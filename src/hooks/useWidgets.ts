// ============================================================
// useWidgets v2 - 支援 page_id 過濾 + 新 Widget 類型
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, PhotoContent, StickerContent, TimerContent, WeatherContent, VideoContent, DrawingContent } from '../types'
import { WIDGET_DEFAULTS } from '../constants/themes'
import { supabase, isSupabaseConfigured, loadWidgets, saveWidget, deleteWidget as dbDelete } from '../lib/supabase'

const LOCAL_KEY = (spaceId: string) => `memory-altar-widgets-${spaceId}`

function loadLocal(spaceId: string): Widget[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(spaceId)) || '[]') } catch { return [] }
}
function saveLocal(spaceId: string, widgets: Widget[]) {
  try { localStorage.setItem(LOCAL_KEY(spaceId), JSON.stringify(widgets)) } catch { /* ignore */ }
}

export function useWidgets(spaceId: string, currentPageId: string) {
  const [allWidgets, setAllWidgets] = useState<Widget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(isSupabaseConfigured)
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // 過濾出當前頁面的 widgets
  const widgets = allWidgets.filter(w => w.page_id === currentPageId)

  useEffect(() => {
    if (!spaceId) return
    async function init() {
      setIsLoading(true)
      let data: Widget[] = []
      if (isSupabaseConfigured) {
        data = await loadWidgets(spaceId)
        if (data.length > 0) { saveLocal(spaceId, data) }
        else {
          data = loadLocal(spaceId)
          if (data.length > 0) await Promise.all(data.map(saveWidget))
        }
      } else {
        data = loadLocal(spaceId)
        setIsOnline(false)
      }
      setAllWidgets(data)
      setIsLoading(false)
    }
    init()
  }, [spaceId])

  // Realtime
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !spaceId) return
    const channel = supabase!.channel(`widgets-v2:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'widgets', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const w = { ...payload.new, zIndex: payload.new.z_index } as Widget
            setAllWidgets(prev => {
              const exists = prev.find(x => x.id === w.id)
              const next = exists ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]
              saveLocal(spaceId, next)
              return next
            })
          } else if (payload.eventType === 'DELETE') {
            setAllWidgets(prev => { const next = prev.filter(x => x.id !== payload.old.id); saveLocal(spaceId, next); return next })
          }
        })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [spaceId])

  const debouncedSave = useCallback((widget: Widget) => {
    const t = saveTimers.current.get(widget.id)
    if (t) clearTimeout(t)
    const timer = setTimeout(() => { if (isSupabaseConfigured) saveWidget(widget); saveTimers.current.delete(widget.id) }, 800)
    saveTimers.current.set(widget.id, timer)
  }, [])

  const addWidget = useCallback((type: WidgetType, canvasCenter: { x: number; y: number }) => {
    const defaults = WIDGET_DEFAULTS[type] || { width: 200, height: 200 }
    const maxZ = Math.max(0, ...allWidgets.map(w => w.zIndex))
    const w: Widget = {
      id: uuidv4(), space_id: spaceId, page_id: currentPageId, type,
      x: canvasCenter.x - defaults.width / 2 + (Math.random() - 0.5) * 80,
      y: canvasCenter.y - defaults.height / 2 + (Math.random() - 0.5) * 80,
      rotation: (Math.random() - 0.5) * 8,
      width: defaults.width, height: defaults.height, zIndex: maxZ + 1,
      content: getDefaultContent(type),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => { const next = [...prev, w]; saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) saveWidget(w)
    return w.id
  }, [allWidgets, spaceId, currentPageId])

  const updateWidget = useCallback((id: string, changes: Partial<Widget>) => {
    setAllWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...changes, updated_at: new Date().toISOString() } : w)
      saveLocal(spaceId, next)
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)
      return next
    })
  }, [spaceId, debouncedSave])

  const deleteWidget = useCallback((id: string) => {
    setAllWidgets(prev => { const next = prev.filter(w => w.id !== id); saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) dbDelete(id)
  }, [spaceId])

  const duplicateWidget = useCallback((id: string) => {
    const original = allWidgets.find(w => w.id === id)
    if (!original) return
    const maxZ = Math.max(0, ...allWidgets.map(w => w.zIndex))
    const copy: Widget = {
      ...original, id: uuidv4(),
      x: original.x + 24, y: original.y + 24,
      zIndex: maxZ + 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => { const next = [...prev, copy]; saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) saveWidget(copy)
  }, [allWidgets, spaceId])

  const bringToFront = useCallback((id: string) => {
    setAllWidgets(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex))
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w)
    })
  }, [])

  return { widgets, isLoading, isOnline, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront }
}

function getDefaultContent(type: WidgetType): PhotoContent | StickerContent | TimerContent | WeatherContent | VideoContent | DrawingContent {
  switch (type) {
    case 'photo':    return { imageUrl: null, caption: '', style: 'polaroid' } as PhotoContent
    case 'sticker':  return { text: '雙擊編輯 ✍️', fontSize: 18, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)' } as StickerContent
    case 'timer':    return { title: '在一起', startDate: new Date().toISOString().split('T')[0], emoji: '💕' } as TimerContent
    case 'weather':  return { mood: 'sunny', label: '今天好幸福', date: new Date().toISOString() } as WeatherContent
    case 'video':    return { videoUrl: null, caption: '' } as VideoContent
    case 'drawing':  return { imageUrl: null, caption: '' } as DrawingContent
  }
}

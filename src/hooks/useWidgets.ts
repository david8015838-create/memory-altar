// ============================================================
// useWidgets v4 - A3 undo debounce race fix + A4 timer cleanup
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, PhotoContent, StickerContent, TimerContent, WeatherContent, VideoContent, DrawingContent } from '../types'
import { WIDGET_DEFAULTS } from '../constants/themes'
import { supabase, isSupabaseConfigured, loadWidgets, saveWidget, deleteWidget as dbDelete, dataUrlToStorage } from '../lib/supabase'

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

  // Undo / Redo stacks（ref 避免 stale closure）
  const undoStack = useRef<Widget[][]>([])
  const redoStack = useRef<Widget[][]>([])
  const allWidgetsRef = useRef<Widget[]>([])
  useEffect(() => { allWidgetsRef.current = allWidgets }, [allWidgets])

  // 過濾出當前頁面的 widgets
  const widgets = allWidgets.filter(w => w.page_id === currentPageId)

  useEffect(() => {
    if (!spaceId) return
    async function init() {
      setIsLoading(true)
      let data: Widget[] = []
      if (isSupabaseConfigured) {
        const [remote, local] = await Promise.all([
          loadWidgets(spaceId),
          Promise.resolve(loadLocal(spaceId)),
        ])
        const merged = new Map<string, Widget>()
        for (const w of local)  merged.set(w.id, w)
        for (const w of remote) {
          const existing = merged.get(w.id)
          if (!existing || new Date(w.updated_at) >= new Date(existing.updated_at)) {
            merged.set(w.id, w)
          }
        }
        data = Array.from(merged.values())
        saveLocal(spaceId, data)
        const remoteIds = new Set(remote.map(w => w.id))
        const localOnly = data.filter(w => !remoteIds.has(w.id))
        if (localOnly.length > 0) {
          await Promise.all(localOnly.map(saveWidget))
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

  // A4: cleanup all timers on unmount
  useEffect(() => () => { saveTimers.current.forEach(clearTimeout); saveTimers.current.clear() }, [])

  const debouncedSave = useCallback((widget: Widget) => {
    const t = saveTimers.current.get(widget.id)
    if (t) clearTimeout(t)
    const timer = setTimeout(() => { if (isSupabaseConfigured) saveWidget(widget); saveTimers.current.delete(widget.id) }, 800)
    saveTimers.current.set(widget.id, timer)
  }, [])

  // ── Undo/Redo helpers ───────────────────────────────────
  const snapshot = () => {
    undoStack.current = [...undoStack.current.slice(-19), [...allWidgetsRef.current]]
    redoStack.current = []
  }

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    // A3: flush all pending debounce saves before undo to prevent overwriting
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
    const prev = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    redoStack.current = [...redoStack.current, [...allWidgetsRef.current]]
    setAllWidgets(prev)
    saveLocal(spaceId, prev)
    if (isSupabaseConfigured) prev.forEach(saveWidget)
  }, [spaceId])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    // A3: flush all pending debounce saves before redo
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
    const next = redoStack.current[redoStack.current.length - 1]
    redoStack.current = redoStack.current.slice(0, -1)
    undoStack.current = [...undoStack.current, [...allWidgetsRef.current]]
    setAllWidgets(next)
    saveLocal(spaceId, next)
    if (isSupabaseConfigured) next.forEach(saveWidget)
  }, [spaceId])

  // ── CRUD ────────────────────────────────────────────────
  const addWidget = useCallback((type: WidgetType, canvasCenter: { x: number; y: number }) => {
    snapshot()
    const defaults = WIDGET_DEFAULTS[type] || { width: 200, height: 200 }
    const maxZ = Math.max(0, ...allWidgetsRef.current.map(w => w.zIndex))
    const w: Widget = {
      id: uuidv4(), space_id: spaceId, page_id: currentPageId, type,
      x: canvasCenter.x - defaults.width / 2 + (Math.random() - 0.5) * 80,
      y: canvasCenter.y - defaults.height / 2 + (Math.random() - 0.5) * 80,
      rotation: 0,
      width: defaults.width, height: defaults.height, zIndex: maxZ + 1,
      content: getDefaultContent(type),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => { const next = [...prev, w]; saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) saveWidget(w)
    return w.id
  }, [spaceId, currentPageId])

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
    snapshot()
    setAllWidgets(prev => { const next = prev.filter(w => w.id !== id); saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) dbDelete(id)
  }, [spaceId])

  const duplicateWidget = useCallback((id: string) => {
    snapshot()
    const original = allWidgetsRef.current.find(w => w.id === id)
    if (!original) return
    const maxZ = Math.max(0, ...allWidgetsRef.current.map(w => w.zIndex))
    const copy: Widget = {
      ...original, id: uuidv4(),
      x: original.x + 24, y: original.y + 24,
      zIndex: maxZ + 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => { const next = [...prev, copy]; saveLocal(spaceId, next); return next })
    if (isSupabaseConfigured) saveWidget(copy)
  }, [spaceId])

  const bringToFront = useCallback((id: string) => {
    setAllWidgets(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex))
      const next = prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w)
      saveLocal(spaceId, next)
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)
      return next
    })
  }, [spaceId, debouncedSave])

  /** 雲端同步：將所有 base64 media 上傳到 Storage，再強制寫入 DB */
  const syncToCloud = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isSupabaseConfigured) return { synced: 0, failed: 0 }
    let synced = 0, failed = 0

    const current = allWidgetsRef.current
    const updatedWidgets: Widget[] = []
    for (const w of current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = w.content as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newContent: any = { ...c }
      let changed = false

      if (typeof c.imageUrl === 'string' && c.imageUrl.startsWith('data:')) {
        const folder = w.type === 'drawing' ? 'drawings' : 'photos'
        const url = await dataUrlToStorage(c.imageUrl, w.space_id, folder)
        if (url) { newContent.imageUrl = url; changed = true; synced++ }
        else failed++
      }
      if (typeof c.videoUrl === 'string' && c.videoUrl.startsWith('data:')) {
        const url = await dataUrlToStorage(c.videoUrl, w.space_id, 'videos')
        if (url) { newContent.videoUrl = url; changed = true; synced++ }
        else failed++
      }

      const updated: Widget = changed
        ? { ...w, content: newContent, updated_at: new Date().toISOString() }
        : w
      updatedWidgets.push(updated)
    }

    // B2 fix: compare by ID-keyed lookup, not by index
    const hasChanges = updatedWidgets.some(uw => {
      const orig = current.find(o => o.id === uw.id)
      return orig !== uw
    })
    if (hasChanges) {
      setAllWidgets(updatedWidgets)
      saveLocal(spaceId, updatedWidgets)
    }

    await Promise.all(updatedWidgets.map(saveWidget))
    return { synced, failed }
  }, [spaceId])

  return { widgets, isLoading, isOnline, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront, syncToCloud, undo, redo }
}

function getDefaultContent(type: WidgetType): PhotoContent | StickerContent | TimerContent | WeatherContent | VideoContent | DrawingContent {
  switch (type) {
    case 'photo':    return { imageUrl: null, caption: '', style: 'polaroid' } as PhotoContent
    case 'sticker':  return { text: '點選後編輯 ✍️', fontSize: 18, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)', showBorder: true } as StickerContent
    case 'timer':    return { title: '在一起', startDate: new Date().toISOString().split('T')[0], emoji: '💕' } as TimerContent
    case 'weather':  return { mood: 'sunny', label: '今天好幸福', date: new Date().toISOString() } as WeatherContent
    case 'video':    return { videoUrl: null, caption: '' } as VideoContent
    case 'drawing':  return { imageUrl: null, caption: '', showBorder: true } as DrawingContent
  }
}

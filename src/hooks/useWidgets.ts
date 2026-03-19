// ============================================================
// useWidgets v6 - 純雲端模式，完全不用 localStorage
// 所有資料只存 Supabase，刪除即刪除，不會復活
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, PhotoContent, StickerContent, TimerContent, WeatherContent, VideoContent, DrawingContent, LoveNoteContent } from '../types'
import { WIDGET_DEFAULTS } from '../constants/themes'
import { supabase, isSupabaseConfigured, loadWidgets, saveWidget, deleteWidget as dbDelete, dataUrlToStorage } from '../lib/supabase'

export function useWidgets(spaceId: string, currentPageId: string) {
  const [allWidgets, setAllWidgets] = useState<Widget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(isSupabaseConfigured)

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Undo / Redo stacks
  const undoStack = useRef<Widget[][]>([])
  const redoStack = useRef<Widget[][]>([])
  const allWidgetsRef = useRef<Widget[]>([])
  useEffect(() => { allWidgetsRef.current = allWidgets }, [allWidgets])

  // 過濾出當前頁面的 widgets
  const widgets = allWidgets.filter(w => w.page_id === currentPageId)

  // ── 初始載入：只從 Supabase 拿資料 ──────────────────────
  useEffect(() => {
    if (!spaceId) return
    async function init() {
      setIsLoading(true)
      if (isSupabaseConfigured) {
        const data = await loadWidgets(spaceId)
        setAllWidgets(data)
      } else {
        setIsOnline(false)
        setAllWidgets([])
      }
      setIsLoading(false)
    }
    init()
  }, [spaceId])

  // ── Realtime 訂閱 ────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !spaceId) return
    const channel = supabase!.channel(`widgets-v2:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'widgets', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (!payload.new?.content) return
            const w = { ...payload.new, zIndex: payload.new.z_index } as Widget
            setAllWidgets(prev => {
              const exists = prev.find(x => x.id === w.id)
              return exists ? prev.map(x => x.id === w.id ? w : x) : [...prev, w]
            })
          } else if (payload.eventType === 'DELETE') {
            setAllWidgets(prev => prev.filter(x => x.id !== payload.old.id))
          }
        })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [spaceId])

  // ── cleanup timers on unmount ────────────────────────────
  useEffect(() => () => {
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
  }, [])

  // ── 防抖存 Supabase（拖曳時避免每 px 都發請求） ─────────
  const debouncedSave = useCallback((widget: Widget) => {
    const t = saveTimers.current.get(widget.id)
    if (t) clearTimeout(t)
    const timer = setTimeout(() => {
      if (isSupabaseConfigured) saveWidgetSafe(widget)
      saveTimers.current.delete(widget.id)
    }, 800)
    saveTimers.current.set(widget.id, timer)
  }, [])

  // ── Undo/Redo ────────────────────────────────────────────
  const snapshot = () => {
    undoStack.current = [...undoStack.current.slice(-19), [...allWidgetsRef.current]]
    redoStack.current = []
  }

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
    const prev = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    redoStack.current = [...redoStack.current, [...allWidgetsRef.current]]

    // 找出被 undo 恢復的 widget（在 prev 有但 current 沒有 = 之前被刪的）
    const currentIds = new Set(allWidgetsRef.current.map(w => w.id))
    const restored = prev.filter(w => !currentIds.has(w.id))

    setAllWidgets(prev)

    if (isSupabaseConfigured) {
      // 更新所有 widget
      prev.forEach(saveWidgetSafe)
      // 刪除在 prev 中不存在的（redo 之前新增的）
      const prevIds = new Set(prev.map(w => w.id))
      allWidgetsRef.current.forEach(w => {
        if (!prevIds.has(w.id)) dbDelete(w.id)
      })
      void restored // 已透過 saveWidgetSafe 處理
    }
  }, [spaceId])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
    const next = redoStack.current[redoStack.current.length - 1]
    redoStack.current = redoStack.current.slice(0, -1)
    undoStack.current = [...undoStack.current, [...allWidgetsRef.current]]

    setAllWidgets(next)

    if (isSupabaseConfigured) {
      next.forEach(saveWidgetSafe)
      const nextIds = new Set(next.map(w => w.id))
      allWidgetsRef.current.forEach(w => {
        if (!nextIds.has(w.id)) dbDelete(w.id)
      })
    }
  }, [spaceId])

  // ── CRUD ────────────────────────────────────────────────
  const addWidget = useCallback((type: WidgetType, canvasCenter: { x: number; y: number }) => {
    snapshot()
    const defaults = WIDGET_DEFAULTS[type] || { width: 200, height: 200 }
    const maxZ = allWidgetsRef.current.reduce((m, w) => Math.max(m, w.zIndex), 0)
    const w: Widget = {
      id: uuidv4(), space_id: spaceId, page_id: currentPageId, type,
      x: canvasCenter.x - defaults.width / 2 + (Math.random() - 0.5) * 80,
      y: canvasCenter.y - defaults.height / 2 + (Math.random() - 0.5) * 80,
      rotation: 0,
      width: defaults.width, height: defaults.height, zIndex: maxZ + 1,
      content: getDefaultContent(type),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => [...prev, w])
    if (isSupabaseConfigured) saveWidget(w)
    return w.id
  }, [spaceId, currentPageId])

  const updateWidget = useCallback((id: string, changes: Partial<Widget>) => {
    setAllWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...changes, updated_at: new Date().toISOString() } : w)
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)
      return next
    })
  }, [debouncedSave])

  const deleteWidget = useCallback((id: string) => {
    snapshot()
    setAllWidgets(prev => prev.filter(w => w.id !== id))
    if (isSupabaseConfigured) dbDelete(id)
  }, [spaceId])

  const duplicateWidget = useCallback((id: string) => {
    snapshot()
    const original = allWidgetsRef.current.find(w => w.id === id)
    if (!original) return
    const maxZ = allWidgetsRef.current.reduce((m, w) => Math.max(m, w.zIndex), 0)
    const copy: Widget = {
      ...original, id: uuidv4(),
      x: original.x + 24, y: original.y + 24,
      zIndex: maxZ + 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    setAllWidgets(prev => [...prev, copy])
    if (isSupabaseConfigured) saveWidget(copy)
  }, [spaceId])

  const bringToFront = useCallback((id: string) => {
    setAllWidgets(prev => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 0)
      const next = prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w)
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)
      return next
    })
  }, [debouncedSave])

  /** 雲端同步：將殘留的 base64 media 上傳到 Storage */
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

    const hasChanges = updatedWidgets.some(uw => {
      const orig = current.find(o => o.id === uw.id)
      return orig !== uw
    })
    if (hasChanges) setAllWidgets(updatedWidgets)

    await Promise.all(updatedWidgets.map(w => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = w.content as any
      const hasBase64 = (typeof c?.imageUrl === 'string' && c.imageUrl.startsWith('data:')) ||
                        (typeof c?.videoUrl === 'string' && c.videoUrl.startsWith('data:'))
      return hasBase64 ? Promise.resolve() : saveWidget(w)
    }))
    return { synced, failed }
  }, [spaceId])

  return {
    widgets, isLoading, isOnline,
    isStorageFull: false,  // 不用 localStorage，永遠不會滿
    addWidget, updateWidget, deleteWidget, duplicateWidget,
    bringToFront, syncToCloud, undo, redo,
    clearLocalCache: () => {},  // no-op
  }
}

/** 儲存 widget 到 Supabase，跳過含 base64 的（太大會 timeout） */
function saveWidgetSafe(w: Widget) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = w.content as any
  const hasBase64 = (typeof c?.imageUrl === 'string' && c.imageUrl.startsWith('data:')) ||
                    (typeof c?.videoUrl === 'string' && c.videoUrl.startsWith('data:'))
  if (!hasBase64) saveWidget(w)
}

function getDefaultContent(type: WidgetType): PhotoContent | StickerContent | TimerContent | WeatherContent | VideoContent | DrawingContent | LoveNoteContent {
  switch (type) {
    case 'photo':     return { imageUrl: null, caption: '', style: 'polaroid' } as PhotoContent
    case 'sticker':   return { text: '點選後編輯 ✍️', fontSize: 18, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)', showBorder: true } as StickerContent
    case 'timer':     return { title: '在一起', startDate: new Date().toISOString().split('T')[0], emoji: '💕' } as TimerContent
    case 'weather':   return { mood: 'sunny', label: '今天好幸福', date: new Date().toISOString() } as WeatherContent
    case 'video':     return { videoUrl: null, caption: '' } as VideoContent
    case 'drawing':   return { imageUrl: null, caption: '', showBorder: true } as DrawingContent
    case 'love-note': return { message: '', from: '' } as LoveNoteContent
  }
}

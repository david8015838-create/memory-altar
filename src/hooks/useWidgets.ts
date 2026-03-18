// ============================================================
// useWidgets v5 - debounced localStorage + realtime null-content guard
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, PhotoContent, StickerContent, TimerContent, WeatherContent, VideoContent, DrawingContent, LoveNoteContent } from '../types'
import { WIDGET_DEFAULTS } from '../constants/themes'
import { supabase, isSupabaseConfigured, loadWidgets, saveWidget, deleteWidget as dbDelete, dataUrlToStorage } from '../lib/supabase'

const LOCAL_KEY      = (spaceId: string) => `memory-altar-widgets-${spaceId}`
const TOMBSTONE_KEY  = (spaceId: string) => `memory-altar-deleted-${spaceId}`

/** 讀取已刪除 widget ID 的 tombstone 集合 */
function loadTombstone(spaceId: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(TOMBSTONE_KEY(spaceId)) || '[]')) } catch { return new Set() }
}
/** 寫入 tombstone */
function saveTombstone(spaceId: string, ids: Set<string>) {
  try { localStorage.setItem(TOMBSTONE_KEY(spaceId), JSON.stringify([...ids])) } catch { /* ignore */ }
}

function loadLocal(spaceId: string): Widget[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(spaceId)) || '[]') } catch { return [] }
}
/** 移除 widget 內所有 base64 大圖（imageUrl/videoUrl → null） */
function stripBase64FromWidgets(widgets: Widget[]): Widget[] {
  return widgets.map(w => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = w.content as any
    const hasB64Img = typeof c?.imageUrl === 'string' && c.imageUrl.startsWith('data:')
    const hasB64Vid = typeof c?.videoUrl === 'string' && c.videoUrl.startsWith('data:')
    if (!hasB64Img && !hasB64Vid) return w
    return { ...w, content: { ...c, imageUrl: hasB64Img ? null : c.imageUrl, videoUrl: hasB64Vid ? null : c.videoUrl } }
  })
}

/** 清理所有 space 的本機 base64 以釋放空間 */
export function clearAllLocalBase64() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('memory-altar-widgets-'))
  for (const key of keys) {
    try {
      const widgets: Widget[] = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify(stripBase64FromWidgets(widgets)))
    } catch { /* ignore */ }
  }
}

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
}

/** 回傳 true = 成功，false = 儲存空間不足 */
function saveLocal(spaceId: string, widgets: Widget[]): boolean {
  try {
    localStorage.setItem(LOCAL_KEY(spaceId), JSON.stringify(widgets))
    return true
  } catch (e) {
    if (isQuotaError(e)) {
      // 嘗試清除所有 space 的 base64 來釋放空間，再重試
      try {
        clearAllLocalBase64()
        localStorage.setItem(LOCAL_KEY(spaceId), JSON.stringify(stripBase64FromWidgets(widgets)))
      } catch { /* 完全失敗，資料只在記憶體中 */ }
      return false
    }
    return true
  }
}

export function useWidgets(spaceId: string, currentPageId: string) {
  const [allWidgets, setAllWidgets] = useState<Widget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(isSupabaseConfigured)
  const [isStorageFull, setIsStorageFull] = useState(false)
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Undo / Redo stacks（ref 避免 stale closure）
  const undoStack = useRef<Widget[][]>([])
  const redoStack = useRef<Widget[][]>([])
  const allWidgetsRef = useRef<Widget[]>([])
  useEffect(() => { allWidgetsRef.current = allWidgets }, [allWidgets])

  // 過濾出當前頁面的 widgets
  const widgets = allWidgets.filter(w => w.page_id === currentPageId)

  // ── 防抖 localStorage 寫入：避免每次 drag 事件都 JSON.stringify 大量資料
  // 重要：isLoading 中或空陣列絕對不寫，防止在 init 完成前把資料清空
  const localSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!spaceId || isLoading || allWidgets.length === 0) return
    if (localSaveTimer.current) clearTimeout(localSaveTimer.current)
    localSaveTimer.current = setTimeout(() => {
      const ok = saveLocal(spaceId, allWidgets)
      setIsStorageFull(!ok)
    }, 400)
    return () => { if (localSaveTimer.current) clearTimeout(localSaveTimer.current) }
  }, [allWidgets, spaceId, isLoading])

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
        const tombstone = loadTombstone(spaceId)

        // 重試：tombstone 裡仍存在於 remote 的 widget → 補刪
        const toRetry = remote.filter(w => tombstone.has(w.id))
        if (toRetry.length > 0) {
          await Promise.all(toRetry.map(w => dbDelete(w.id)))
        }

        const merged = new Map<string, Widget>()
        for (const w of local)  merged.set(w.id, w)
        for (const w of remote) {
          if (tombstone.has(w.id)) continue  // 跳過已刪除的
          const existing = merged.get(w.id)
          if (!existing || new Date(w.updated_at) >= new Date(existing.updated_at)) {
            merged.set(w.id, w)
          }
        }

        // tombstone 清理：remote 已不存在的 ID = Supabase 確認刪除 → 從 tombstone 移除
        const remoteIds = new Set(remote.map(w => w.id))
        for (const id of [...tombstone]) {
          if (!remoteIds.has(id)) tombstone.delete(id)
        }
        saveTombstone(spaceId, tombstone)

        data = Array.from(merged.values())
        saveLocal(spaceId, data)
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
            // Guard: Supabase realtime message size limit can cause content to be null
            // This would crash widget components and unmount the entire tree
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

  // A4: cleanup all timers on unmount
  useEffect(() => () => {
    saveTimers.current.forEach(clearTimeout)
    saveTimers.current.clear()
    if (localSaveTimer.current) clearTimeout(localSaveTimer.current)
  }, [])

  // iOS PWA recovery: 當 app 從背景返回（例如選完照片後），
  // 如果 allWidgets 意外變空，從 localStorage 恢復
  useEffect(() => {
    if (!spaceId) return
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (allWidgetsRef.current.length > 0) return  // 有內容就不需要恢復
      const local = loadLocal(spaceId)
      if (local.length > 0) {
        setAllWidgets(local)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [spaceId])

  const debouncedSave = useCallback((widget: Widget) => {
    const t = saveTimers.current.get(widget.id)
    if (t) clearTimeout(t)
    const timer = setTimeout(() => {
      if (isSupabaseConfigured) {
        // 跳過含 base64 的 widget 直接存 Supabase（太大會 timeout）
        // 使用者可按 ☁️ 同步按鈕上傳到 Storage 後再存
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = widget.content as any
        const hasBase64 = (typeof c?.imageUrl === 'string' && c.imageUrl.startsWith('data:')) ||
                          (typeof c?.videoUrl === 'string' && c.videoUrl.startsWith('data:'))
        if (!hasBase64) saveWidget(widget)
      }
      saveTimers.current.delete(widget.id)
    }, 800)
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
    // 寫入 tombstone，防止 Supabase 刪除失敗時 reload 後重新出現
    const tombstone = loadTombstone(spaceId)
    tombstone.add(id)
    saveTombstone(spaceId, tombstone)
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
    setAllWidgets(prev => [...prev, copy])
    if (isSupabaseConfigured) saveWidget(copy)
  }, [spaceId])

  const bringToFront = useCallback((id: string) => {
    setAllWidgets(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex))
      const next = prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w)
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)
      return next
    })
  }, [debouncedSave])

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

  /** 清理本機所有 base64 釋放空間（手動呼叫） */
  const clearLocalCache = useCallback(() => {
    clearAllLocalBase64()
    // 更新 React state 中的 widgets（把 base64 也清掉）
    setAllWidgets(prev => stripBase64FromWidgets(prev))
    setIsStorageFull(false)
  }, [])

  return { widgets, isLoading, isOnline, isStorageFull, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront, syncToCloud, undo, redo, clearLocalCache }
}

function getDefaultContent(type: WidgetType): PhotoContent | StickerContent | TimerContent | WeatherContent | VideoContent | DrawingContent | LoveNoteContent {
  switch (type) {
    case 'photo':    return { imageUrl: null, caption: '', style: 'polaroid' } as PhotoContent
    case 'sticker':  return { text: '點選後編輯 ✍️', fontSize: 18, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)', showBorder: true } as StickerContent
    case 'timer':    return { title: '在一起', startDate: new Date().toISOString().split('T')[0], emoji: '💕' } as TimerContent
    case 'weather':  return { mood: 'sunny', label: '今天好幸福', date: new Date().toISOString() } as WeatherContent
    case 'video':    return { videoUrl: null, caption: '' } as VideoContent
    case 'drawing':    return { imageUrl: null, caption: '', showBorder: true } as DrawingContent
    case 'love-note':  return { message: '', from: '' } as LoveNoteContent
  }
}

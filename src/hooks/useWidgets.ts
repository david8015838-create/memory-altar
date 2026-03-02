// ============================================================
// useWidgets - Widget 的 CRUD 狀態管理
// 優先使用 Supabase，降級到 localStorage
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, PolaroidContent, StickerContent, TimerContent, WeatherContent } from '../types'
import { WIDGET_DEFAULTS } from '../constants/themes'
import {
  supabase,
  isSupabaseConfigured,
  loadWidgets,
  saveWidget,
  deleteWidget as deleteWidgetFromDB,
} from '../lib/supabase'

const SPACE_ID = import.meta.env.VITE_SPACE_ID || 'default-space'
const LOCAL_KEY = `memory-altar-widgets-${SPACE_ID}`

// 本地備份：從 localStorage 讀取
function loadFromLocal(): Widget[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 本地備份：寫入 localStorage
function saveToLocal(widgets: Widget[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(widgets))
  } catch (e) {
    console.warn('localStorage 儲存失敗（可能是圖片太大）:', e)
  }
}

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(isSupabaseConfigured)

  // 避免不必要的 Supabase 寫入（防抖）
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── 初始化：載入資料 ──────────────────────────────
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      if (isSupabaseConfigured) {
        const remote = await loadWidgets(SPACE_ID)
        if (remote.length > 0) {
          setWidgets(remote)
          saveToLocal(remote)
        } else {
          // Supabase 是空的，嘗試把本地資料同步上去
          const local = loadFromLocal()
          setWidgets(local)
          if (local.length > 0) {
            await Promise.all(local.map(saveWidget))
          }
        }
      } else {
        setWidgets(loadFromLocal())
        setIsOnline(false)
      }
      setIsLoading(false)
    }
    init()
  }, [])

  // ── Supabase Realtime 訂閱（即時同步） ──────────
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return

    const channel = supabase!
      .channel(`widgets:${SPACE_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'widgets',
          filter: `space_id=eq.${SPACE_ID}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = { ...payload.new, zIndex: payload.new.z_index } as Widget
            setWidgets(prev => {
              const exists = prev.find(w => w.id === updated.id)
              const next = exists
                ? prev.map(w => (w.id === updated.id ? updated : w))
                : [...prev, updated]
              saveToLocal(next)
              return next
            })
          } else if (payload.eventType === 'DELETE') {
            setWidgets(prev => {
              const next = prev.filter(w => w.id !== payload.old.id)
              saveToLocal(next)
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  // ── 防抖儲存到 Supabase ──────────────────────────
  const debouncedSave = useCallback((widget: Widget) => {
    const existing = saveTimers.current.get(widget.id)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      if (isSupabaseConfigured) saveWidget(widget)
      saveTimers.current.delete(widget.id)
    }, 800) // 800ms 防抖

    saveTimers.current.set(widget.id, timer)
  }, [])

  // ── 新增 Widget ──────────────────────────────────
  const addWidget = useCallback((type: WidgetType, canvasCenter: { x: number; y: number }) => {
    const defaults = WIDGET_DEFAULTS[type]
    const maxZ = Math.max(0, ...widgets.map(w => w.zIndex))

    const newWidget: Widget = {
      id: uuidv4(),
      space_id: SPACE_ID,
      type,
      x: canvasCenter.x - defaults.width / 2 + (Math.random() - 0.5) * 80,
      y: canvasCenter.y - defaults.height / 2 + (Math.random() - 0.5) * 80,
      rotation: (Math.random() - 0.5) * 10, // 隨機輕微傾斜
      width: defaults.width,
      height: defaults.height,
      zIndex: maxZ + 1,
      content: getDefaultContent(type),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setWidgets(prev => {
      const next = [...prev, newWidget]
      saveToLocal(next)
      return next
    })

    if (isSupabaseConfigured) saveWidget(newWidget)
    return newWidget.id
  }, [widgets])

  // ── 更新 Widget（位置/旋轉/內容） ────────────────
  const updateWidget = useCallback((id: string, changes: Partial<Widget>) => {
    setWidgets(prev => {
      const next = prev.map(w =>
        w.id === id
          ? { ...w, ...changes, updated_at: new Date().toISOString() }
          : w
      )
      saveToLocal(next)

      // 找到更新後的 widget 做防抖儲存
      const updated = next.find(w => w.id === id)
      if (updated) debouncedSave(updated)

      return next
    })
  }, [debouncedSave])

  // ── 刪除 Widget ──────────────────────────────────
  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const next = prev.filter(w => w.id !== id)
      saveToLocal(next)
      return next
    })
    if (isSupabaseConfigured) deleteWidgetFromDB(id)
  }, [])

  // ── 置頂 Widget（拖動時置頂） ─────────────────────
  const bringToFront = useCallback((id: string) => {
    setWidgets(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex))
      return prev.map(w =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      )
    })
  }, [])

  return {
    widgets,
    isLoading,
    isOnline,
    addWidget,
    updateWidget,
    deleteWidget,
    bringToFront,
    spaceId: SPACE_ID,
  }
}

// ── 各 Widget 預設內容 ────────────────────────────────
function getDefaultContent(type: WidgetType): PolaroidContent | StickerContent | TimerContent | WeatherContent {
  switch (type) {
    case 'polaroid':
      return { imageUrl: null, caption: '點擊上傳照片 📷', takenAt: '' } as PolaroidContent
    case 'sticker':
      return {
        text: '雙擊編輯 ✍️',
        fontSize: 18,
        color: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.12)',
      } as StickerContent
    case 'timer':
      return {
        title: '在一起',
        startDate: new Date().toISOString().split('T')[0],
        emoji: '💕',
      } as TimerContent
    case 'weather':
      return { mood: 'sunny' as const, label: '今天好幸福', date: new Date().toISOString() } as WeatherContent
  }
}

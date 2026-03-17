// ============================================================
// usePages - 分頁管理
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Page } from '../types'
import { supabase, isSupabaseConfigured, loadPages, createPage, updatePage, deletePage } from '../lib/supabase'

const LOCAL_KEY = (spaceId: string) => `memory-altar-pages-${spaceId}`

function saveLocal(spaceId: string, pages: Page[]) {
  localStorage.setItem(LOCAL_KEY(spaceId), JSON.stringify(pages))
}
function loadLocal(spaceId: string): Page[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(spaceId)) || '[]') } catch { return [] }
}

export function usePages(spaceId: string) {
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // 初始化載入
  useEffect(() => {
    if (!spaceId) return
    async function init() {
      setIsLoading(true)
      let loaded: Page[] = []

      if (isSupabaseConfigured) {
        const [remote, local] = await Promise.all([
          loadPages(spaceId),
          Promise.resolve(loadLocal(spaceId)),
        ])
        // 優先用 Supabase 資料；若 Supabase 回傳空（網路問題）則用本地備援
        // 避免產生新 UUID page 導致 widgets 全部消失
        loaded = remote.length > 0 ? remote : local
      } else {
        loaded = loadLocal(spaceId)
      }

      // 如果沒有任何分頁，建立預設頁
      if (loaded.length === 0) {
        const defaultPage: Page = {
          id: uuidv4(), space_id: spaceId, name: '主頁 🏠',
          page_order: 0, created_at: new Date().toISOString()
        }
        if (isSupabaseConfigured) await createPage(defaultPage)
        loaded = [defaultPage]
      }

      saveLocal(spaceId, loaded)
      setPages(loaded)
      setCurrentPageId(loaded[0].id)
      setIsLoading(false)
    }
    init()
  }, [spaceId])

  // Realtime 訂閱
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !spaceId) return
    const channel = supabase!
      .channel(`pages:${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pages', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPages(prev => { const next = [...prev, payload.new as Page].sort((a,b) => a.page_order - b.page_order); saveLocal(spaceId, next); return next })
          } else if (payload.eventType === 'UPDATE') {
            setPages(prev => { const next = prev.map(p => p.id === payload.new.id ? payload.new as Page : p); saveLocal(spaceId, next); return next })
          } else if (payload.eventType === 'DELETE') {
            setPages(prev => { const next = prev.filter(p => p.id !== payload.old.id); saveLocal(spaceId, next); return next })
          }
        })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [spaceId])

  const addPage = useCallback(async (name: string) => {
    const maxOrder = Math.max(0, ...pages.map(p => p.page_order))
    const newPage: Page = {
      id: uuidv4(), space_id: spaceId, name,
      page_order: maxOrder + 1, created_at: new Date().toISOString()
    }
    if (isSupabaseConfigured) await createPage(newPage)
    setPages(prev => { const next = [...prev, newPage]; saveLocal(spaceId, next); return next })
    setCurrentPageId(newPage.id)
  }, [pages, spaceId])

  const renamePage = useCallback(async (id: string, name: string) => {
    if (isSupabaseConfigured) await updatePage(id, { name })
    setPages(prev => { const next = prev.map(p => p.id === id ? { ...p, name } : p); saveLocal(spaceId, next); return next })
  }, [spaceId])

  const removePage = useCallback(async (id: string) => {
    if (pages.length <= 1) return // 至少保留一頁
    if (isSupabaseConfigured) await deletePage(id)
    setPages(prev => {
      const next = prev.filter(p => p.id !== id)
      saveLocal(spaceId, next)
      if (currentPageId === id) setCurrentPageId(next[0]?.id || '')
      return next
    })
  }, [pages, currentPageId, spaceId])

  const reorderPages = useCallback(async (fromId: string, toId: string) => {
    const fromIdx = pages.findIndex(p => p.id === fromId)
    const toIdx   = pages.findIndex(p => p.id === toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    const newPages = [...pages]
    const [moved] = newPages.splice(fromIdx, 1)
    newPages.splice(toIdx, 0, moved)
    const updated = newPages.map((p, i) => ({ ...p, page_order: i }))
    setPages(updated)
    saveLocal(spaceId, updated)
    if (isSupabaseConfigured) {
      await Promise.all(updated.map(p => updatePage(p.id, { page_order: p.page_order })))
    }
  }, [pages, spaceId])

  return { pages, currentPageId, setCurrentPageId, isLoading, addPage, renamePage, removePage, reorderPages }
}

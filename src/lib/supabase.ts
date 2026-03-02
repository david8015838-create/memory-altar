import { createClient } from '@supabase/supabase-js'
import type { Widget, Page, Space } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
  supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here'

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { realtime: { params: { eventsPerSecond: 10 } } })
  : null

export const isSupabaseConfigured: boolean = Boolean(isConfigured)

// ── 密碼雜湊（Web Crypto API，無需額外套件） ──────────────
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── 空間（Space）操作 ──────────────────────────────────────
export async function getSpace(spaceId: string): Promise<Space | null> {
  if (!supabase) return null
  const { data } = await supabase.from('spaces').select('*').eq('id', spaceId).single()
  return data as Space | null
}

export async function createSpace(spaceId: string, passwordHash: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('spaces').insert({ id: spaceId, password_hash: passwordHash })
  return !error
}

// ── 分頁（Page）操作 ──────────────────────────────────────
export async function loadPages(spaceId: string): Promise<Page[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('pages').select('*').eq('space_id', spaceId).order('page_order')
  return (data || []) as Page[]
}

export async function createPage(page: Omit<Page, 'created_at'>): Promise<Page | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('pages').insert(page).select().single()
  if (error) { console.error(error); return null }
  return data as Page
}

export async function updatePage(id: string, changes: Partial<Page>): Promise<void> {
  if (!supabase) return
  await supabase.from('pages').update(changes).eq('id', id)
}

export async function deletePage(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('pages').delete().eq('id', id)
}

// ── Widget 操作 ───────────────────────────────────────────
export async function loadWidgets(spaceId: string): Promise<Widget[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('widgets').select('*').eq('space_id', spaceId).order('z_index')
  if (error) { console.error(error); return [] }
  return (data || []).map(row => ({ ...row, zIndex: row.z_index })) as Widget[]
}

export async function saveWidget(widget: Widget): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('widgets').upsert({
    id: widget.id, space_id: widget.space_id, page_id: widget.page_id,
    type: widget.type, x: widget.x, y: widget.y,
    rotation: widget.rotation, width: widget.width, height: widget.height,
    z_index: widget.zIndex, content: widget.content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) console.error('saveWidget:', error)
}

export async function deleteWidget(widgetId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('widgets').delete().eq('id', widgetId)
}

/** 刪除整個空間（widgets + pages + space 記錄全清） */
export async function deleteSpace(spaceId: string): Promise<boolean> {
  if (!supabase) return false
  // 順序：先刪 widgets → 再刪 pages → 最後刪 space
  const { error: e1 } = await supabase.from('widgets').delete().eq('space_id', spaceId)
  if (e1) { console.error('刪除 widgets 失敗:', e1); return false }
  const { error: e2 } = await supabase.from('pages').delete().eq('space_id', spaceId)
  if (e2) { console.error('刪除 pages 失敗:', e2); return false }
  const { error: e3 } = await supabase.from('spaces').delete().eq('id', spaceId)
  if (e3) { console.error('刪除 space 失敗:', e3); return false }
  return true
}

/** Keepalive ping（防止 Supabase 免費版閒置停機） */
export async function ping(spaceId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('spaces').select('id').eq('id', spaceId).limit(1)
}

// ── 檔案上傳（照片 / 影片 / 繪圖） ───────────────────────
export async function uploadFile(
  file: File | Blob,
  spaceId: string,
  folder: 'photos' | 'videos' | 'drawings',
  filename?: string
): Promise<string | null> {
  if (!supabase) return null

  const ext = file instanceof File
    ? (file.name.split('.').pop() || 'bin')
    : (folder === 'drawings' ? 'png' : 'bin')
  const name = filename || `${Date.now()}.${ext}`
  const path = `${spaceId}/${folder}/${name}`

  const { data, error } = await supabase.storage.from('photos').upload(path, file, {
    cacheControl: '3600', upsert: false
  })
  if (error) { console.error('upload:', error); return null }

  return supabase.storage.from('photos').getPublicUrl(data.path).data.publicUrl
}

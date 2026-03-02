// ============================================================
// Supabase 客戶端初始化
// ============================================================
// 使用前請：
// 1. 複製 .env.example 為 .env
// 2. 在 https://supabase.com 建立專案
// 3. 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js'
import type { Widget } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// 檢查環境變數是否已設定
const isConfigured =
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-anon-key-here'

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null

/** 是否已完成 Supabase 設定 */
export const isSupabaseConfigured: boolean = Boolean(isConfigured)

/**
 * Supabase 資料庫 Schema (請在 Supabase SQL Editor 執行)
 *
 * CREATE TABLE widgets (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   space_id TEXT NOT NULL DEFAULT 'default',
 *   type TEXT NOT NULL,
 *   x FLOAT NOT NULL DEFAULT 100,
 *   y FLOAT NOT NULL DEFAULT 100,
 *   rotation FLOAT NOT NULL DEFAULT 0,
 *   width FLOAT NOT NULL DEFAULT 200,
 *   height FLOAT NOT NULL DEFAULT 200,
 *   z_index INTEGER NOT NULL DEFAULT 1,
 *   content JSONB NOT NULL DEFAULT '{}',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 啟用 Row Level Security（允許所有人讀寫，適合私人小專案）
 * ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Allow all for now" ON widgets FOR ALL USING (true) WITH CHECK (true);
 *
 * -- 啟用 Realtime
 * ALTER TABLE widgets REPLICA IDENTITY FULL;
 *
 * -- 建立 Storage Bucket（在 Supabase Dashboard > Storage 建立名為 'photos' 的 public bucket）
 */

/** 上傳圖片到 Supabase Storage */
export async function uploadPhoto(file: File, spaceId: string): Promise<string | null> {
  if (!supabase) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${spaceId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('圖片上傳失敗:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/** 從 Supabase 載入所有 Widgets */
export async function loadWidgets(spaceId: string): Promise<Widget[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('space_id', spaceId)
    .order('z_index', { ascending: true })

  if (error) {
    console.error('載入 widgets 失敗:', error)
    return []
  }

  return (data || []).map(row => ({
    ...row,
    zIndex: row.z_index,
  })) as Widget[]
}

/** 儲存 Widget 到 Supabase */
export async function saveWidget(widget: Widget): Promise<void> {
  if (!supabase) return

  const row = {
    id: widget.id,
    space_id: widget.space_id,
    type: widget.type,
    x: widget.x,
    y: widget.y,
    rotation: widget.rotation,
    width: widget.width,
    height: widget.height,
    z_index: widget.zIndex,
    content: widget.content,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('widgets')
    .upsert(row, { onConflict: 'id' })

  if (error) console.error('儲存 widget 失敗:', error)
}

/** 刪除 Widget */
export async function deleteWidget(widgetId: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', widgetId)

  if (error) console.error('刪除 widget 失敗:', error)
}

-- ============================================================
-- 🔄 Supabase 更新 SQL（第二版）
-- 在 Supabase Dashboard > SQL Editor 執行
-- ============================================================

-- 1. 建立空間表（密碼保護）
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,                        -- 空間 ID（使用者自訂）
  password_hash TEXT NOT NULL,               -- SHA-256 雜湊密碼
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on spaces" ON spaces FOR ALL USING (true) WITH CHECK (true);

-- 2. 建立分頁表
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '新頁面',
  page_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pages_space_id_idx ON pages(space_id);
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on pages" ON pages FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE pages REPLICA IDENTITY FULL;

-- 3. 更新 widgets 表：加入 page_id + 支援新 widget 類型
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES pages(id) ON DELETE SET NULL;
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('photo', 'sticker', 'timer', 'weather', 'video', 'drawing'));

-- 4. 把舊的 'polaroid' 類型改為 'photo'
UPDATE widgets SET type = 'photo' WHERE type = 'polaroid';

-- 完成！

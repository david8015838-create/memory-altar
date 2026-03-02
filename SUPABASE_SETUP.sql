-- ============================================================
-- 🗄️ Supabase 資料庫設定 SQL
-- 在 Supabase Dashboard > SQL Editor 執行這段程式碼
-- ============================================================

-- 1. 建立 widgets 資料表
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT NOT NULL DEFAULT 'default',
  type TEXT NOT NULL CHECK (type IN ('polaroid', 'sticker', 'timer', 'weather')),
  x FLOAT NOT NULL DEFAULT 100,
  y FLOAT NOT NULL DEFAULT 100,
  rotation FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 200,
  height FLOAT NOT NULL DEFAULT 200,
  z_index INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS widgets_space_id_idx ON widgets(space_id);

-- 3. 啟用 Row Level Security（RLS）
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- 4. 建立存取政策（允許所有人讀寫，適合私人小專案）
--    如果未來要加入認證，請修改這裡的 policy
CREATE POLICY "Allow all operations"
  ON widgets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. 啟用 Realtime（讓兩個人的畫面即時同步）
ALTER TABLE widgets REPLICA IDENTITY FULL;

-- 在 Supabase Dashboard > Database > Replication 中也要啟用 widgets 表

-- ============================================================
-- 📦 Storage Bucket 設定
-- 在 Supabase Dashboard > Storage 執行以下步驟：
-- 1. 點擊「New Bucket」
-- 2. Bucket 名稱：photos
-- 3. 設定為 Public bucket（勾選 Public）
-- 4. 點擊「Save」
-- ============================================================

-- 以下是 Storage 的 RLS Policy（在 Storage > Policies 設定）
-- 允許任何人上傳和讀取照片：
-- INSERT: true
-- SELECT: true

-- ============================================================
-- 🔧 緊急修正：widgets type constraint 缺少 love-note
-- 在 Supabase Dashboard > SQL Editor 執行此檔案
-- ============================================================

-- 1. 先把舊的 type 限制移除
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;

-- 2. 加回包含 love-note 的新限制
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('photo', 'sticker', 'timer', 'weather', 'video', 'drawing', 'love-note'));

-- 完成！現在情書 widget 可以正常同步到雲端了。

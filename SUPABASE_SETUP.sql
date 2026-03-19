-- Memory Altar - Supabase Setup SQL
-- Paste this entire file into Supabase Dashboard > SQL Editor > Run

-- ===== 1. spaces =====
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on spaces" ON spaces;
CREATE POLICY "Allow all on spaces" ON spaces FOR ALL USING (true) WITH CHECK (true);

-- ===== 2. pages =====
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'page',
  page_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pages_space_id_idx ON pages(space_id);
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pages" ON pages;
CREATE POLICY "Allow all on pages" ON pages FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE pages REPLICA IDENTITY FULL;

-- ===== 3. widgets =====
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id TEXT NOT NULL,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  rotation FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 200,
  height FLOAT NOT NULL DEFAULT 200,
  z_index INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS widgets_space_id_idx ON widgets(space_id);
CREATE INDEX IF NOT EXISTS widgets_page_id_idx ON widgets(page_id);

-- ===== 4. widgets RLS =====
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on widgets" ON widgets;
DROP POLICY IF EXISTS "Allow all operations" ON widgets;
CREATE POLICY "Allow all on widgets" ON widgets FOR ALL USING (true) WITH CHECK (true);

-- ===== 5. widgets type constraint (drop old, add new) =====
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = rel.oid
      AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'widgets'
      AND con.contype = 'c'
      AND att.attname = 'type'
  LOOP
    EXECUTE 'ALTER TABLE widgets DROP CONSTRAINT ' || quote_ident(cname);
  END LOOP;
END $$;

UPDATE widgets SET type = 'photo' WHERE type = 'polaroid';

ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('photo', 'sticker', 'timer', 'weather', 'video', 'drawing', 'love-note'));

-- ===== 6. Enable Realtime =====
ALTER TABLE widgets REPLICA IDENTITY FULL;


-- =====================================================
-- After running this SQL, do these steps in the UI:
--
-- [A] Enable Realtime for widgets table:
--     Dashboard > Database > Replication
--     Toggle ON for: widgets, pages
--
-- [B] Create Storage Bucket:
--     Dashboard > Storage > New Bucket
--     Name: photos
--     Public: YES (toggle on)
--     Save
-- =====================================================

# Memory Altar — 專案開發上下文

## 基本資訊
- **專案名稱**: memory-altar
- **目的**: 情侶共用的數位回憶空間，兩台裝置即時同步
- **部署網址**: https://david8015838-create.github.io/memory-altar/
- **本地開發**: `npm run dev` → http://localhost:5173/memory-altar/
- **部署指令**: `npm run deploy`（build + gh-pages）

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端框架 | Vite + React 18 + TypeScript |
| 樣式 | Tailwind CSS + CSS 變數主題系統 |
| 動畫 | Framer Motion |
| 圖示 | Lucide React |
| 後端/DB | Supabase（PostgreSQL + Realtime + Storage） |
| 認證 | Supabase Auth（Email/Password） |
| 部署 | GitHub Pages（gh-pages） |
| PWA | vite-plugin-pwa |

### 關鍵檔案
```
src/
  types/index.ts              — 所有 TypeScript 型別定義
  constants/themes.ts         — 12 個主題 + WIDGET_DEFAULTS
  lib/supabase.ts             — Supabase client + CRUD helpers
  hooks/
    useAuth.ts                — 登入/登出/Session
    useWidgets.ts             — Widget CRUD + localStorage fallback + Realtime
    usePages.ts               — 分頁 CRUD
    useTheme.ts               — 主題切換
  components/
    Canvas/InfiniteCanvas.tsx — 無限畫布（pan/zoom/pinch）
    widgets/BaseWidget.tsx    — 拖曳/縮放/旋轉/鎖定基礎組件
    widgets/PhotoWidget.tsx
    widgets/StickerWidget.tsx
    widgets/TimerWidget.tsx
    widgets/WeatherWidget.tsx
    widgets/VideoWidget.tsx
    widgets/DrawingWidget.tsx
    widgets/LoveNoteWidget.tsx — 信封情書 Widget
    ui/Toolbar.tsx            — 主工具列（新增 widget / 主題 / 頁面）
    ui/WidgetActionBar.tsx    — Widget 選取後的操作列（刪除/旋轉/複製/鎖定）
    ui/DrawingCanvas.tsx      — 手繪畫板
    pages/PageTabs.tsx        — 底部分頁標籤
    effects/                  — 視覺特效（FloatingBackground/PetalRain/WhisperMessages...）
  App.tsx                     — 主入口，串接所有 hooks + 組件
SUPABASE_SETUP.sql            — 在 Supabase SQL Editor 執行的建表腳本
.env.example                  — 環境變數範本
```

---

## Supabase 設定

### 環境變數（`.env`）
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SPACE_ID=our-memory-altar
```

### DB Schema（執行 `SUPABASE_SETUP.sql`）
| Table | 用途 |
|-------|------|
| `spaces` | 空間（id + password_hash） |
| `pages` | 分頁（space_id + name + page_order） |
| `widgets` | 所有 widget 資料（space_id / page_id / type / x / y / rotation / width / height / z_index / content JSONB） |

### Storage Buckets
- `media`：照片、影片、手繪圖片（public bucket）

### Realtime
- `widgets` 表已啟用 Replica Identity Full + Realtime
- `pages` 表已啟用 Realtime
- `spaces` 表已啟用 Realtime（供背景音樂同步用）

---

## Widget 類型

| type | 說明 |
|------|------|
| `photo` | 拍立得照片框（4 種風格：polaroid / square / round / film） |
| `sticker` | 文字貼紙（可調字體大小/顏色） |
| `timer` | 紀念日計時器（顯示在一起 N 天） |
| `weather` | 心情天氣（6 種心情） |
| `video` | 影片播放器（支援上傳 + URL） |
| `drawing` | 手繪圖板（儲存為 PNG） |
| `love-note` | 信封情書（點擊封蠟印章彈出信紙 Modal） |

---

## 已完成功能（截至 2026-03-04）

### Bug Fixes
- **A1** Toolbar 選單點外部或 Escape 自動關閉
- **A2** WeatherWidget 離開編輯模式自動關閉選色器
- **A3** Undo/Redo 前清空 debounce pending saves（避免 race condition）
- **A4** useWidgets unmount 清理所有 debounce timers
- **A5** VideoWidget URL 變更時清除錯誤狀態
- **A6** DrawingCanvas 初始空白狀態存入 history

### UX 改善
- **B1** Page 刪除需 inline 確認（防誤刪）
- **B2** Canvas 載入中顯示 spinner
- **B3** 手繪儲存後顯示 toast 提示（雲端/本地）
- **B4** WidgetActionBar 新增鎖定/解鎖按鈕

### 新功能
- **C1** 鍵盤快捷鍵（Ctrl+Z undo / Ctrl+Y redo / Delete 刪除選取 / Escape 取消選取）
- **C2** Toolbar「定位」按鈕 → 重置視角（fit all widgets 或回到畫布中心）
- **F7** Love Note Widget（信封情書）：封閉信封 + 點擊彈出全螢幕信紙 Modal

---

## 未完成功能（計畫中）

以下功能已有完整計畫（見 `~/.claude/plans/sprightly-shimmying-flask.md`），尚未實作：

### F5 暱稱設定（F1/F2 的前置條件）
- `src/hooks/useMyName.ts`（新建）：讀 localStorage `memory-altar-myname`
- `src/components/auth/NameSetupModal.tsx`（新建）：首次進入時彈出設定視窗
- `src/App.tsx`：若 `myName === null` 顯示 NameSetupModal

### F1 Partner Presence（對方在線指示）
- `src/hooks/usePresence.ts`（新建）：Supabase Realtime Presence 頻道
- `src/components/ui/PresenceIndicator.tsx`（新建）：右上角顯示「🟢 對方 也在這裡」
- 需先完成 F5（暱稱）

### F2 Widget 署名
- Widget 加 `added_by?: string` 欄位（DB: `ALTER TABLE widgets ADD COLUMN added_by TEXT`）
- `addWidget` 時自動帶入 `myName`
- BaseWidget view mode 左下角顯示「♡ 小名」
- 需先完成 F5（暱稱）

### F3 ❤️ 反應按鈕
- Widget 加 `hearts?: number` 欄位（DB: `ALTER TABLE widgets ADD COLUMN hearts INTEGER DEFAULT 0`）
- View mode 每個 widget 右下角 ❤️ 按鈕，點擊 +1，即時同步
- BaseWidget 新增 `onHeart` callback

### F4 常駐音樂播放器
- `spaces` 表加 `background_music TEXT` 欄位
- `src/hooks/useSpaceMusic.ts`（新建）：讀取並訂閱 spaces.background_music
- `src/components/ui/MusicPlayer.tsx`（新建）：底部固定列，YouTube embedded 播放
- 需在 Supabase SQL Editor 執行：
  ```sql
  ALTER TABLE spaces ADD COLUMN IF NOT EXISTS background_music TEXT;
  ```

---

## 尚需 DB Migration（實作 F1-F4 前需先執行）

```sql
-- F2: Widget 署名
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS added_by TEXT;

-- F3: 愛心反應
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 0;

-- F4: 背景音樂
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS background_music TEXT;
```

---

## 注意事項

- Supabase 未設定時自動退回 **localStorage 模式**（單機可用）
- `isSupabaseConfigured` flag 控制所有雲端操作的開關
- Widget 資料合併策略：remote 的 `updated_at` 較新則以 remote 為主
- Base64 媒體檔（data: URL）需透過 `syncToCloud()` 上傳到 Supabase Storage 才能跨裝置同步
- GitHub Pages 部署路徑：`/memory-altar/`（在 `vite.config.ts` 設定 base）

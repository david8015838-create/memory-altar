# ✨ 回憶祭壇 (Memory Altar)

> 一個專屬於我們的數位回憶空間

## 🚀 快速開始

### 本機測試（離線模式）

```bash
npm install
npm run dev
```

開啟 http://localhost:5173/memory-altar/

> 注意：離線模式下，資料儲存在瀏覽器 localStorage，不會跨裝置同步

---

### 雲端同步設定（Supabase）

#### Step 1：建立 Supabase 帳號
1. 前往 [https://supabase.com](https://supabase.com) 建立免費帳號
2. 建立新專案（選擇離你最近的伺服器，建議 **Asia (Tokyo)**）
3. 等待專案初始化（約 1-2 分鐘）

#### Step 2：設定資料庫
1. 進入你的 Supabase 專案
2. 點擊左側 **SQL Editor**
3. 複製貼上 `SUPABASE_SETUP.sql` 的內容並執行

#### Step 3：建立照片儲存桶
1. 點擊左側 **Storage**
2. 點擊 **New Bucket**
3. 名稱輸入 `photos`，勾選 **Public bucket**
4. 點擊 **Save**

#### Step 4：取得 API 金鑰
1. 點擊左側 **Project Settings > API**
2. 複製：
   - **Project URL**（例如：`https://abcdef.supabase.co`）
   - **anon public key**（一串很長的 JWT）

#### Step 5：設定環境變數
```bash
cp .env.example .env
```

編輯 `.env` 填入你的 Supabase 資訊：
```env
VITE_SUPABASE_URL=https://你的專案ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
VITE_SPACE_ID=chen-yuqi-2024  # 改成你們獨特的名稱
```

> ⚠️ `.env` 不會被 git 追蹤，安全無虞

#### Step 6：啟動
```bash
npm run dev
```

---

### 📱 部署到 GitHub Pages（手機可訪問）

```bash
# 建立 GitHub Repository 後執行：
git remote add origin https://github.com/你的帳號/memory-altar.git
git push -u origin main

# 部署
npm run deploy
```

網址：`https://你的帳號.github.io/memory-altar/`

> 部署前先確認 `.env` 有填好，並在 `vite.config.ts` 中的 `REPO_NAME` 改成你的 repo 名稱

---

## 🎮 使用說明

| 功能 | 操作 |
|------|------|
| 新增回憶組件 | 編輯模式 → 「新增」按鈕 |
| 拖動組件 | 編輯模式 → 直接拖動 |
| 旋轉組件 | 編輯模式 → 懸停 → 點擊旋轉按鈕 |
| 縮放組件 | 編輯模式 → 懸停 → 拖動右下角把手 |
| 編輯文字 | 編輯模式 → 雙擊文字 |
| 上傳照片 | 編輯模式 → 點擊拍立得空白區域 |
| 放大照片 | 瀏覽模式 → 點擊照片 |
| 平移畫布 | 滑鼠中鍵拖動 或 Alt + 左鍵拖動 |
| 縮放畫布 | 滾輪 或 雙指捏合 |
| 切換主題 | 工具列 🎨 按鈕 |
| 花瓣雨 🌸 | 右下角花瓣按鈕 |
| 悄悄話 ✨ | 右下角星星按鈕 |

---

## 🛠 Tech Stack

- **框架**：Vite + React 18 + TypeScript
- **樣式**：Tailwind CSS + Glassmorphism
- **動畫**：Framer Motion
- **後端**：Supabase（資料庫 + 圖片儲存 + 即時同步）
- **PWA**：vite-plugin-pwa（可安裝到手機主畫面）
- **部署**：GitHub Pages

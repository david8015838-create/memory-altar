// ============================================================
// 數位回憶祭壇 - 核心型別定義
// ============================================================

/** Widget 的種類 */
export type WidgetType = 'polaroid' | 'sticker' | 'timer' | 'weather'

/** 主題色調 */
export type ThemeName = 'midnight' | 'sunset' | 'forest'

/** 心情天氣類型 */
export type WeatherMood =
  | 'sunny'    // ☀️ 開心
  | 'cloudy'   // ☁️ 平靜
  | 'rainy'    // 🌧️ 想念
  | 'snowy'    // ❄️ 浪漫
  | 'stormy'   // ⛈️ 思念
  | 'rainbow'  // 🌈 幸福

/** 拍立得照片 Widget 內容 */
export interface PolaroidContent {
  imageUrl: string | null    // Supabase Storage URL 或 base64
  caption: string            // 照片下方說明文字
  takenAt?: string           // 拍攝日期
}

/** 文字貼紙 Widget 內容 */
export interface StickerContent {
  text: string               // 貼紙文字
  fontSize: number           // 字體大小 (px)
  color: string              // 文字顏色（hex）
  backgroundColor: string    // 背景顏色（hex）
}

/** 紀念日計時器 Widget 內容 */
export interface TimerContent {
  title: string              // 標題（如：「在一起」）
  startDate: string          // ISO 日期字串
  emoji: string              // 主題 emoji
}

/** 心情天氣 Widget 內容 */
export interface WeatherContent {
  mood: WeatherMood
  label: string              // 自定義標籤（如：「今天好想你」）
  date?: string              // ISO 日期字串
}

/** Widget 的通用資料結構 */
export interface Widget {
  id: string                 // UUID
  space_id: string           // 共享空間 ID
  type: WidgetType

  // 位置與變形
  x: number                  // 畫布 X 座標
  y: number                  // 畫布 Y 座標
  rotation: number           // 旋轉角度（度）
  width: number              // 寬度
  height: number             // 高度
  zIndex: number             // 疊放順序

  // 內容（根據 type 不同填入不同欄位）
  content: PolaroidContent | StickerContent | TimerContent | WeatherContent

  // 時間戳
  created_at: string
  updated_at: string
}

/** 主題定義 */
export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  // CSS 漸層背景色
  backgroundGradient: string
  // 背景光暈球顏色
  orbColors: string[]
  // 玻璃擬態邊框顏色
  glassBorder: string
  // 玻璃擬態背景
  glassBackground: string
  // 主要強調色
  accent: string
  // 文字色
  textPrimary: string
  textSecondary: string
}

/** 畫布視圖狀態（pan + zoom） */
export interface CanvasViewport {
  x: number    // 平移 X
  y: number    // 平移 Y
  scale: number // 縮放比例
}

/** App 模式 */
export type AppMode = 'view' | 'edit'

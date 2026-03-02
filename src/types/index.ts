// ============================================================
// 數位回憶祭壇 v2 - 核心型別定義
// ============================================================

export type WidgetType = 'photo' | 'sticker' | 'timer' | 'weather' | 'video' | 'drawing'
export type ThemeName = 'midnight' | 'sunset' | 'forest'
export type WeatherMood = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'rainbow'
export type AppMode = 'view' | 'edit'

/** 照片框風格 */
export type PhotoStyle = 'polaroid' | 'square' | 'round' | 'film'

/** 照片 Widget（含多種框風格） */
export interface PhotoContent {
  imageUrl: string | null
  caption: string          // 照片說明（必有）
  style: PhotoStyle        // 框風格
  takenAt?: string
}

/** 文字貼紙 */
export interface StickerContent {
  text: string
  fontSize: number
  color: string
  backgroundColor: string
  showBorder: boolean   // 是否顯示玻璃外框
}

/** 紀念日計時器 */
export interface TimerContent {
  title: string
  startDate: string
  emoji: string
}

/** 心情天氣 */
export interface WeatherContent {
  mood: WeatherMood
  label: string
  date?: string
}

/** 影片 Widget */
export interface VideoContent {
  videoUrl: string | null
  caption: string
  thumbnailUrl?: string
}

/** 手繪 Widget */
export interface DrawingContent {
  imageUrl: string | null  // 繪圖存成 PNG 的 URL
  caption: string
  showBorder: boolean   // 是否顯示背景外框
}

export type WidgetContent =
  | PhotoContent | StickerContent | TimerContent
  | WeatherContent | VideoContent | DrawingContent

/** Widget 通用資料 */
export interface Widget {
  id: string
  space_id: string
  page_id: string | null
  type: WidgetType
  x: number
  y: number
  rotation: number
  width: number
  height: number
  zIndex: number
  content: WidgetContent
  created_at: string
  updated_at: string
}

/** 分頁 */
export interface Page {
  id: string
  space_id: string
  name: string
  page_order: number
  created_at: string
}

/** 空間（密碼保護） */
export interface Space {
  id: string
  password_hash: string
  created_at: string
}

/** 主題定義 */
export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  backgroundGradient: string
  orbColors: string[]
  glassBorder: string
  glassBackground: string
  accent: string
  textPrimary: string
  textSecondary: string
}

export interface CanvasViewport {
  x: number
  y: number
  scale: number
}

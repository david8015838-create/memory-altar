// ============================================================
// 三種主題色調定義
// ============================================================

import type { Theme } from '../types'

export const THEMES: Record<string, Theme> = {
  // 🌌 深夜星空 - 深邃藍紫，靜謐浪漫
  midnight: {
    name: 'midnight',
    label: '深夜星空',
    emoji: '🌌',
    backgroundGradient: 'linear-gradient(135deg, #0d0620 0%, #1a0a2e 30%, #0a1628 60%, #0d0620 100%)',
    orbColors: ['#7c3aed', '#4338ca', '#1d4ed8', '#7e22ce'],
    glassBorder: 'rgba(139, 92, 246, 0.3)',
    glassBackground: 'rgba(15, 10, 40, 0.6)',
    accent: '#a78bfa',
    textPrimary: '#f3f0ff',
    textSecondary: '#c4b5fd',
  },

  // 🌅 落日暖橙 - 溫暖橙玫，甜蜜浪漫
  sunset: {
    name: 'sunset',
    label: '落日暖橙',
    emoji: '🌅',
    backgroundGradient: 'linear-gradient(135deg, #1c0a00 0%, #2d1200 30%, #1a0810 60%, #200a05 100%)',
    orbColors: ['#dc2626', '#ea580c', '#d97706', '#be185d'],
    glassBorder: 'rgba(251, 146, 60, 0.3)',
    glassBackground: 'rgba(45, 18, 0, 0.6)',
    accent: '#fb923c',
    textPrimary: '#fff7ed',
    textSecondary: '#fed7aa',
  },

  // 🌿 森林呼吸 - 翠綠深邃，清新靜謐
  forest: {
    name: 'forest',
    label: '森林呼吸',
    emoji: '🌿',
    backgroundGradient: 'linear-gradient(135deg, #051208 0%, #0a2010 30%, #081a12 60%, #051208 100%)',
    orbColors: ['#065f46', '#047857', '#0d9488', '#166534'],
    glassBorder: 'rgba(52, 211, 153, 0.3)',
    glassBackground: 'rgba(5, 18, 8, 0.6)',
    accent: '#34d399',
    textPrimary: '#ecfdf5',
    textSecondary: '#a7f3d0',
  },
}

/** 心情天氣的顯示設定 */
export const WEATHER_MOODS = {
  sunny:   { emoji: '☀️', label: '晴天', color: '#fbbf24', description: '開心' },
  cloudy:  { emoji: '☁️', label: '多雲', color: '#94a3b8', description: '平靜' },
  rainy:   { emoji: '🌧️', label: '下雨', color: '#60a5fa', description: '想念' },
  snowy:   { emoji: '❄️', label: '下雪', color: '#bae6fd', description: '浪漫' },
  stormy:  { emoji: '⛈️', label: '暴風', color: '#818cf8', description: '思念' },
  rainbow: { emoji: '🌈', label: '彩虹', color: '#f472b6', description: '幸福' },
} as const

/** 悄悄話星球 - 預設愛語清單（可自行修改） */
export const WHISPER_MESSAGES = [
  '你是我最美的意外 ✨',
  '和你在一起，每天都是禮物 🎁',
  '我喜歡你喜歡到停不下來 💕',
  '你笑起來的樣子，是我最愛的風景 🌸',
  '謝謝你出現在我的生命裡 🌙',
  '想到你就覺得幸福 💖',
  '你讓平凡的日子變得閃閃發光 ⭐',
  '有你的每一天，都值得被記住 📖',
  '愛你，昨天，今天，每一天 ∞',
  '你是我的家 🏡',
]

/** 預設 Widget 尺寸 */
export const WIDGET_DEFAULTS = {
  polaroid: { width: 220, height: 280 },
  sticker:  { width: 200, height: 140 },
  timer:    { width: 240, height: 180 },
  weather:  { width: 180, height: 160 },
}

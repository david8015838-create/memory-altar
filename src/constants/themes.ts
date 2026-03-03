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

  // 🌸 粉櫻春日 - 玫瑰粉，嬌嫩浪漫
  sakura: {
    name: 'sakura',
    label: '粉櫻春日',
    emoji: '🌸',
    backgroundGradient: 'linear-gradient(135deg, #1a0812 0%, #2e1020 30%, #1a0818 60%, #1a0812 100%)',
    orbColors: ['#db2777', '#ec4899', '#f43f5e', '#be185d'],
    glassBorder: 'rgba(244, 114, 182, 0.3)',
    glassBackground: 'rgba(46, 16, 32, 0.6)',
    accent: '#f472b6',
    textPrimary: '#fdf2f8',
    textSecondary: '#fbcfe8',
  },

  // 🌊 深海漫遊 - 藍綠深邃，如海底世界
  ocean: {
    name: 'ocean',
    label: '深海漫遊',
    emoji: '🌊',
    backgroundGradient: 'linear-gradient(135deg, #020c18 0%, #041928 30%, #02111e 60%, #020c18 100%)',
    orbColors: ['#0369a1', '#0891b2', '#0e7490', '#164e63'],
    glassBorder: 'rgba(56, 189, 248, 0.3)',
    glassBackground: 'rgba(4, 25, 40, 0.6)',
    accent: '#38bdf8',
    textPrimary: '#f0f9ff',
    textSecondary: '#bae6fd',
  },

  // 🌹 玫瑰情人 - 深紅熱情，濃烈愛意
  rose: {
    name: 'rose',
    label: '玫瑰情人',
    emoji: '🌹',
    backgroundGradient: 'linear-gradient(135deg, #1c0508 0%, #2e0910 30%, #1a0608 60%, #1c0508 100%)',
    orbColors: ['#b91c1c', '#dc2626', '#e11d48', '#881337'],
    glassBorder: 'rgba(248, 113, 113, 0.3)',
    glassBackground: 'rgba(46, 9, 16, 0.6)',
    accent: '#f87171',
    textPrimary: '#fff1f2',
    textSecondary: '#fecdd3',
  },

  // 🌌 極光之夜 - 流動極光，神秘夢幻
  aurora: {
    name: 'aurora',
    label: '極光之夜',
    emoji: '🌌',
    backgroundGradient: 'linear-gradient(135deg, #020f0a 0%, #031a10 30%, #020f10 60%, #020f0a 100%)',
    orbColors: ['#059669', '#0d9488', '#0891b2', '#7c3aed'],
    glassBorder: 'rgba(52, 211, 153, 0.3)',
    glassBackground: 'rgba(3, 26, 16, 0.6)',
    accent: '#6ee7b7',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
  },

  // 💜 薰衣草田 - 淡紫芬芳，溫柔夢境
  lavender: {
    name: 'lavender',
    label: '薰衣草田',
    emoji: '💜',
    backgroundGradient: 'linear-gradient(135deg, #0f0a1e 0%, #1a1030 30%, #120a24 60%, #0f0a1e 100%)',
    orbColors: ['#7c3aed', '#9333ea', '#a855f7', '#6d28d9'],
    glassBorder: 'rgba(196, 181, 253, 0.3)',
    glassBackground: 'rgba(26, 16, 48, 0.6)',
    accent: '#c084fc',
    textPrimary: '#fdf4ff',
    textSecondary: '#e9d5ff',
  },

  // ☕ 咖啡時光 - 溫暖琥珀，慵懶午後
  coffee: {
    name: 'coffee',
    label: '咖啡時光',
    emoji: '☕',
    backgroundGradient: 'linear-gradient(135deg, #0f0a05 0%, #1e1208 30%, #150d07 60%, #0f0a05 100%)',
    orbColors: ['#92400e', '#a16207', '#78350f', '#b45309'],
    glassBorder: 'rgba(217, 119, 6, 0.3)',
    glassBackground: 'rgba(30, 18, 8, 0.6)',
    accent: '#fbbf24',
    textPrimary: '#fffbeb',
    textSecondary: '#fde68a',
  },

  // 🌙 月光銀白 - 皎潔清冷，如月下漫步
  moonlight: {
    name: 'moonlight',
    label: '月光銀白',
    emoji: '🌙',
    backgroundGradient: 'linear-gradient(135deg, #080c14 0%, #0f1520 30%, #0a1018 60%, #080c14 100%)',
    orbColors: ['#334155', '#475569', '#64748b', '#1e293b'],
    glassBorder: 'rgba(148, 163, 184, 0.3)',
    glassBackground: 'rgba(15, 21, 32, 0.6)',
    accent: '#cbd5e1',
    textPrimary: '#f8fafc',
    textSecondary: '#e2e8f0',
  },

  // 🌃 霓虹城市 - 電馭賽博，絢爛都市
  neon: {
    name: 'neon',
    label: '霓虹城市',
    emoji: '🌃',
    backgroundGradient: 'linear-gradient(135deg, #020205 0%, #050210 30%, #020208 60%, #020205 100%)',
    orbColors: ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981'],
    glassBorder: 'rgba(236, 72, 153, 0.3)',
    glassBackground: 'rgba(5, 2, 16, 0.6)',
    accent: '#e879f9',
    textPrimary: '#fdf4ff',
    textSecondary: '#f0abfc',
  },

  // 🪐 銀河彼端 - 深邃宇宙，遙遠星河
  galaxy: {
    name: 'galaxy',
    label: '銀河彼端',
    emoji: '🪐',
    backgroundGradient: 'linear-gradient(135deg, #07030f 0%, #0f0520 30%, #070315 60%, #07030f 100%)',
    orbColors: ['#4c1d95', '#5b21b6', '#3730a3', '#312e81'],
    glassBorder: 'rgba(139, 92, 246, 0.2)',
    glassBackground: 'rgba(7, 3, 15, 0.7)',
    accent: '#a5b4fc',
    textPrimary: '#faf5ff',
    textSecondary: '#e0e7ff',
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
export const WIDGET_DEFAULTS: Record<string, { width: number; height: number }> = {
  photo:    { width: 220, height: 280 },
  sticker:  { width: 200, height: 140 },
  timer:    { width: 240, height: 180 },
  weather:  { width: 180, height: 160 },
  video:    { width: 280, height: 220 },
  drawing:    { width: 240, height: 240 },
  'love-note': { width: 260, height: 200 },
}

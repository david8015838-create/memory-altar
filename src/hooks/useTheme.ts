// ============================================================
// useTheme - 主題色調狀態管理
// ============================================================

import { useState, useEffect } from 'react'
import type { ThemeName, Theme } from '../types'
import { THEMES } from '../constants/themes'

const THEME_KEY = 'memory-altar-theme'

export function useTheme() {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeName | null
    return saved && THEMES[saved] ? saved : 'midnight'
  })

  const theme: Theme = THEMES[themeName]

  const changeTheme = (name: ThemeName) => {
    setThemeName(name)
    localStorage.setItem(THEME_KEY, name)
  }

  // 更新 CSS 變數和 body 背景
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', theme.accent)
    document.documentElement.style.setProperty('--text-primary', theme.textPrimary)
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary)
    document.documentElement.style.setProperty('--glass-border', theme.glassBorder)
    document.documentElement.style.setProperty('--glass-bg', theme.glassBackground)
    document.body.style.background = theme.backgroundGradient
  }, [theme])

  return { theme, themeName, changeTheme, allThemes: THEMES }
}

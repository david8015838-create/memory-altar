// ============================================================
// Toolbar - 頂部工具列
// 包含：模式切換、新增 Widget、主題切換、同步狀態
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3, Eye, Plus, Camera, Type, Timer, Cloud,
  Wifi, WifiOff, Palette, Flower2, Sparkles,
} from 'lucide-react'
import type { AppMode, Theme, ThemeName, WidgetType } from '../../types'
import { THEMES } from '../../constants/themes'

interface Props {
  mode: AppMode
  theme: Theme
  isOnline: boolean
  onModeToggle: () => void
  onAddWidget: (type: WidgetType) => void
  onThemeChange: (name: ThemeName) => void
  onTriggerPetals: () => void
  onTriggerWhispers: () => void
}

const WIDGET_BUTTONS: { type: WidgetType; icon: React.ReactNode; label: string }[] = [
  { type: 'polaroid', icon: <Camera size={16} />, label: '拍立得' },
  { type: 'sticker',  icon: <Type size={16} />,   label: '文字貼紙' },
  { type: 'timer',    icon: <Timer size={16} />,   label: '計時器' },
  { type: 'weather',  icon: <Cloud size={16} />,   label: '心情天氣' },
]

export function Toolbar({
  mode,
  theme,
  isOnline,
  onModeToggle,
  onAddWidget,
  onThemeChange,
  onTriggerPetals,
  onTriggerWhispers,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)

  const isEditMode = mode === 'edit'

  return (
    <>
      {/* ─── 主工具列（頂部中央） ─── */}
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{
          zIndex: 100,
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      >
        {/* 標題 */}
        <span
          className="text-sm font-medium mr-1"
          style={{
            color: 'var(--accent)',
            fontFamily: '"Noto Serif TC", serif',
          }}
        >
          回憶祭壇
        </span>

        {/* 分隔線 */}
        <div className="w-px h-4 bg-white/20" />

        {/* 模式切換 */}
        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors"
          style={{
            background: isEditMode ? `${theme.accent}30` : 'transparent',
            color: isEditMode ? theme.accent : 'var(--text-secondary)',
            border: isEditMode ? `1px solid ${theme.accent}50` : '1px solid transparent',
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onModeToggle}
          title={isEditMode ? '切換到瀏覽模式' : '切換到編輯模式'}
        >
          {isEditMode ? <Edit3 size={14} /> : <Eye size={14} />}
          <span>{isEditMode ? '編輯' : '瀏覽'}</span>
        </motion.button>

        {/* 新增 Widget（僅編輯模式） */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
            >
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors"
                style={{
                  background: showAddMenu ? `${theme.accent}20` : 'transparent',
                  color: 'var(--text-secondary)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddMenu(!showAddMenu)
                  setShowThemePicker(false)
                }}
              >
                <Plus size={14} />
                <span>新增</span>
              </motion.button>

              {/* 新增選單 */}
              <AnimatePresence>
                {showAddMenu && (
                  <motion.div
                    className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col gap-1 p-2 rounded-xl min-w-[130px]"
                    style={{
                      background: 'rgba(10,8,30,0.95)',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    }}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  >
                    {WIDGET_BUTTONS.map(btn => (
                      <button
                        key={btn.type}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-white/10"
                        style={{ color: 'var(--text-primary)' }}
                        onClick={() => {
                          onAddWidget(btn.type)
                          setShowAddMenu(false)
                        }}
                      >
                        <span style={{ color: theme.accent }}>{btn.icon}</span>
                        {btn.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主題切換 */}
        <div className="relative">
          <motion.button
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowThemePicker(!showThemePicker)
              setShowAddMenu(false)
            }}
            title="切換主題"
          >
            <Palette size={14} />
          </motion.button>

          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                className="absolute top-10 right-0 flex flex-col gap-1 p-2 rounded-xl min-w-[140px]"
                style={{
                  background: 'rgba(10,8,30,0.95)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                }}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
              >
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-white/10"
                    style={{
                      color: theme.name === t.name ? t.accent : 'var(--text-primary)',
                      background: theme.name === t.name ? `${t.accent}15` : 'transparent',
                    }}
                    onClick={() => {
                      onThemeChange(t.name)
                      setShowThemePicker(false)
                    }}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 連線狀態 */}
        <div
          title={isOnline ? '已連線到 Supabase' : '離線模式（資料存本機）'}
          style={{ color: isOnline ? '#4ade80' : '#94a3b8' }}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>
      </motion.div>

      {/* ─── 彩蛋按鈕（右下角，瀏覽模式顯示） ─── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3" style={{ zIndex: 100 }}>
        {/* 花瓣雨 */}
        <motion.button
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onTriggerPetals}
          title="花瓣雨 🌸"
        >
          <Flower2 size={20} style={{ color: theme.accent }} />
        </motion.button>

        {/* 悄悄話 */}
        <motion.button
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={onTriggerWhispers}
          title="悄悄話 ✨"
        >
          <Sparkles size={20} style={{ color: theme.accent }} />
        </motion.button>
      </div>
    </>
  )
}

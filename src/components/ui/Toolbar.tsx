import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Eye, Plus, Camera, Type, Timer, Cloud, Wifi, WifiOff, Palette, Flower2, Sparkles, Video, Pen, LogOut, Trash2 } from 'lucide-react'
import type { AppMode, Theme, ThemeName, WidgetType } from '../../types'
import { THEMES } from '../../constants/themes'

interface Props {
  mode: AppMode; theme: Theme; isOnline: boolean
  onModeToggle: () => void
  onAddWidget: (type: WidgetType) => void
  onAddDrawing: () => void
  onThemeChange: (n: ThemeName) => void
  onTriggerPetals: () => void
  onTriggerWhispers: () => void
  onLogout: () => void
  onDeleteRoom: () => void  // 刪除整個房間
}

const WIDGET_BUTTONS: { type: WidgetType | 'draw'; icon: React.ReactNode; label: string }[] = [
  { type: 'photo',   icon: <Camera size={15} />, label: '照片' },
  { type: 'video',   icon: <Video  size={15} />, label: '影片' },
  { type: 'sticker', icon: <Type   size={15} />, label: '文字' },
  { type: 'timer',   icon: <Timer  size={15} />, label: '計時器' },
  { type: 'weather', icon: <Cloud  size={15} />, label: '心情' },
  { type: 'draw',    icon: <Pen    size={15} />, label: '手繪' },
]

export function Toolbar({ mode, theme, isOnline, onModeToggle, onAddWidget, onAddDrawing, onThemeChange, onTriggerPetals, onTriggerWhispers, onLogout, onDeleteRoom }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const isEditMode = mode === 'edit'

  const closeAll = () => { setShowAdd(false); setShowTheme(false) }

  return (
    <>
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
        style={{ zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>

        <span className="text-sm font-medium" style={{ color: 'var(--accent)', fontFamily: '"Noto Serif TC", serif', whiteSpace: 'nowrap' }}>✨ 回憶</span>
        <div className="w-px h-4 bg-white/20" />

        {/* 模式切換 */}
        <motion.button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm"
          style={{ background: isEditMode ? `${theme.accent}30` : 'transparent', color: isEditMode ? theme.accent : 'var(--text-secondary)', border: isEditMode ? `1px solid ${theme.accent}50` : '1px solid transparent' }}
          whileTap={{ scale: 0.95 }} onClick={() => { onModeToggle(); closeAll() }}>
          {isEditMode ? <Edit3 size={13} /> : <Eye size={13} />}
          <span>{isEditMode ? '編輯' : '瀏覽'}</span>
        </motion.button>

        {/* 新增（編輯模式） */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div className="relative" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
              <motion.button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm"
                style={{ background: showAdd ? `${theme.accent}20` : 'transparent', color: 'var(--text-secondary)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowAdd(!showAdd); setShowTheme(false) }}>
                <Plus size={13} /><span>新增</span>
              </motion.button>
              <AnimatePresence>
                {showAdd && (
                  <motion.div className="absolute top-10 left-1/2 -translate-x-1/2 p-2 rounded-2xl min-w-[160px]"
                    style={{ background: 'rgba(8,6,24,0.97)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}>
                    <div className="grid grid-cols-2 gap-1">
                      {WIDGET_BUTTONS.map(btn => (
                        <button key={btn.type}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:bg-white/10 active:bg-white/20"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => { btn.type === 'draw' ? onAddDrawing() : onAddWidget(btn.type as WidgetType); closeAll() }}>
                          <span style={{ color: theme.accent }}>{btn.icon}</span>{btn.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主題 */}
        <div className="relative">
          <motion.button className="p-1.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowTheme(!showTheme); setShowAdd(false) }}>
            <Palette size={14} />
          </motion.button>
          <AnimatePresence>
            {showTheme && (
              <motion.div className="absolute top-10 right-0 p-2 rounded-2xl min-w-[150px]"
                style={{ background: 'rgba(8,6,24,0.97)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}>
                {Object.values(THEMES).map(t => (
                  <button key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full text-left transition-colors hover:bg-white/10"
                    style={{ color: theme.name === t.name ? t.accent : 'var(--text-primary)', background: theme.name === t.name ? `${t.accent}15` : 'transparent' }}
                    onClick={() => { onThemeChange(t.name); setShowTheme(false) }}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 連線狀態 */}
        <div title={isOnline ? '已連線' : '離線模式'} style={{ color: isOnline ? '#4ade80' : '#94a3b8' }}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
        </div>

        {/* 刪除房間 */}
        <motion.button className="p-1.5 rounded-xl" style={{ color: '#f87171' }}
          whileTap={{ scale: 0.95 }} onClick={onDeleteRoom} title="刪除整個房間">
          <Trash2 size={13} />
        </motion.button>

        {/* 登出 */}
        <motion.button className="p-1.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.95 }} onClick={onLogout} title="離開空間">
          <LogOut size={13} />
        </motion.button>
      </motion.div>

      {/* 彩蛋按鈕（右下，頁面 tabs 上方） */}
      <div className="fixed right-4 flex flex-col gap-2" style={{ bottom: 80, zIndex: 100 }}>
        <motion.button className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onTriggerPetals} title="花瓣雨 🌸">
          <Flower2 size={18} style={{ color: theme.accent }} />
        </motion.button>
        <motion.button className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
          whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}
          onClick={onTriggerWhispers} title="悄悄話 ✨">
          <Sparkles size={18} style={{ color: theme.accent }} />
        </motion.button>
      </div>
    </>
  )
}

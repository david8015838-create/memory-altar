import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Eye, Plus, Camera, Type, Timer, Cloud, Wifi, WifiOff, Video, Pen, LogOut, Trash2, Sparkles, X, CloudUpload, MoreHorizontal, Locate, Mail } from 'lucide-react'
import type { AppMode, Theme, ThemeName, WidgetType } from '../../types'
import { THEMES } from '../../constants/themes'

export interface EffectsState {
  petal:    { active: boolean; onToggle: () => void }
  whisper:  { active: boolean; onToggle: () => void }
  star:     { active: boolean; onToggle: () => void }
  snow:     { active: boolean; onToggle: () => void }
  firefly:  { active: boolean; onToggle: () => void }
}

interface Props {
  mode: AppMode; theme: Theme; isOnline: boolean
  onModeToggle: () => void
  onAddWidget: (type: WidgetType) => void
  onAddDrawing: () => void
  onThemeChange: (n: ThemeName) => void
  onLogout: () => void
  onDeleteRoom: () => void
  onSync: () => Promise<{ synced: number; failed: number }>
  onResetView: () => void  // C2
  effects: EffectsState
}

const WIDGET_BUTTONS: { type: WidgetType | 'draw'; icon: React.ReactNode; label: string }[] = [
  { type: 'photo',     icon: <Camera size={15} />, label: '照片' },
  { type: 'video',     icon: <Video  size={15} />, label: '影片' },
  { type: 'sticker',   icon: <Type   size={15} />, label: '文字' },
  { type: 'timer',     icon: <Timer  size={15} />, label: '計時器' },
  { type: 'weather',   icon: <Cloud  size={15} />, label: '心情' },
  { type: 'draw',      icon: <Pen    size={15} />, label: '手繪' },
  { type: 'love-note', icon: <Mail   size={15} />, label: '情書' },
]

const EFFECTS_CONFIG = [
  { key: 'petal'   as const, emoji: '🌸', label: '花瓣雨' },
  { key: 'whisper' as const, emoji: '✨', label: '悄悄話' },
  { key: 'star'    as const, emoji: '⭐', label: '星光雨' },
  { key: 'snow'    as const, emoji: '❄️', label: '飄雪' },
  { key: 'firefly' as const, emoji: '🌟', label: '螢火蟲' },
]

export function Toolbar({ mode, theme, isOnline, onModeToggle, onAddWidget, onAddDrawing, onThemeChange, onLogout, onDeleteRoom, onSync, onResetView, effects }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const isEditMode = mode === 'edit'

  const anyEffectActive = Object.values(effects).some(e => e.active)
  const anyOpen = showAdd || showTheme || showMore || showEffects
  const closeAll = () => { setShowAdd(false); setShowTheme(false); setShowEffects(false); setShowMore(false) }

  // A1: close menus on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSync = async () => {
    if (syncing) return
    closeAll()
    setSyncing(true)
    setSyncMsg(null)
    try {
      const { synced, failed } = await onSync()
      setSyncMsg(failed > 0 ? `⚠ ${failed} 失敗` : synced > 0 ? `✓ ${synced} 個已上雲` : '✓ 已同步')
    } catch { setSyncMsg('✗ 同步失敗') }
    finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 3500)
    }
  }

  return (
    <>
      {/* A1: transparent overlay to close menus on outside click */}
      {anyOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 99 }}
          onClick={closeAll}
        />
      )}

      {/* 主工具列 */}
      <motion.div
        className="fixed left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
        style={{
          zIndex: 100,
          top: 'max(1rem, env(safe-area-inset-top))',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 'calc(100vw - 16px)',
        }}
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>

        {/* 標題：手機隱藏 */}
        <span className="hidden sm:inline text-sm font-medium" style={{ color: 'var(--accent)', fontFamily: '"Noto Serif TC", serif', whiteSpace: 'nowrap' }}>✨ 回憶</span>
        <div className="hidden sm:block w-px h-4 bg-white/20" />

        {/* 模式切換 */}
        <motion.button className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-sm"
          style={{ background: isEditMode ? `${theme.accent}30` : 'transparent', color: isEditMode ? theme.accent : 'var(--text-secondary)', border: isEditMode ? `1px solid ${theme.accent}50` : '1px solid transparent' }}
          whileTap={{ scale: 0.95 }} onClick={() => { onModeToggle(); closeAll() }}>
          {isEditMode ? <Edit3 size={13} /> : <Eye size={13} />}
          <span className="hidden sm:inline">{isEditMode ? '編輯' : '瀏覽'}</span>
        </motion.button>

        {/* 新增（編輯模式） */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div className="relative" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
              <motion.button className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-sm"
                style={{ background: showAdd ? `${theme.accent}20` : 'transparent', color: 'var(--text-secondary)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowAdd(!showAdd); setShowTheme(false); setShowEffects(false) }}>
                <Plus size={13} /><span className="hidden sm:inline">新增</span>
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

        {/* 主題（圓形色塊選擇） */}
        <div className="relative">
          <motion.button
            className="w-6 h-6 rounded-full border-2 flex-shrink-0"
            style={{
              background: theme.accent,
              borderColor: showTheme ? theme.accent : 'rgba(255,255,255,0.3)',
              boxShadow: showTheme ? `0 0 10px ${theme.accent}80` : 'none',
            }}
            whileTap={{ scale: 0.9 }}
            title="切換主題"
            onClick={() => { setShowTheme(!showTheme); setShowAdd(false); setShowEffects(false) }}
          />
          <AnimatePresence>
            {showTheme && (
              <motion.div className="absolute top-10 right-0 p-2 rounded-2xl"
                style={{ background: 'rgba(8,6,24,0.97)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', minWidth: 180, maxHeight: '70vh', overflowY: 'auto' }}
                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}>
                <p className="text-xs px-2 pb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>選擇主題</p>
                {Object.values(THEMES).map(t => (
                  <button key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full text-left transition-colors hover:bg-white/10"
                    style={{ color: theme.name === t.name ? t.accent : 'var(--text-primary)', background: theme.name === t.name ? `${t.accent}15` : 'transparent' }}
                    onClick={() => { onThemeChange(t.name as ThemeName); setShowTheme(false) }}>
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                    {theme.name === t.name && <span className="ml-auto text-xs" style={{ color: t.accent }}>✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 雲端同步按鈕（編輯模式，已連線才顯示） */}
        {isEditMode && isOnline && (
          <motion.button
            className="relative flex items-center gap-1 p-1.5 rounded-xl"
            style={{ color: syncMsg?.startsWith('✓') ? '#4ade80' : syncMsg?.startsWith('⚠') ? '#fb923c' : 'var(--text-secondary)' }}
            whileTap={{ scale: 0.95 }}
            title="同步到雲端（讓其他裝置也能看到）"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><CloudUpload size={13} /></motion.div>
              : <CloudUpload size={13} />
            }
            {/* 結果提示（短暫顯示） */}
            {syncMsg && (
              <motion.span
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.85)', color: syncMsg.startsWith('✓') ? '#4ade80' : '#fb923c', border: '1px solid rgba(255,255,255,0.1)' }}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              >{syncMsg}</motion.span>
            )}
          </motion.button>
        )}

        {/* C2: 回到中心按鈕 */}
        <motion.button
          className="p-1.5 rounded-xl"
          style={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.95 }}
          title="回到所有貼紙的位置"
          onClick={() => { onResetView(); closeAll() }}
        >
          <Locate size={13} />
        </motion.button>

        {/* 連線狀態 */}
        <div title={isOnline ? '已連線' : '離線模式'} style={{ color: isOnline ? '#4ade80' : '#94a3b8' }}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
        </div>

        {/* 桌面：直接顯示刪除 + 離開 */}
        <motion.button className="hidden sm:flex p-1.5 rounded-xl" style={{ color: '#f87171' }}
          whileTap={{ scale: 0.95 }} onClick={onDeleteRoom} title="刪除整個房間">
          <Trash2 size={13} />
        </motion.button>
        <motion.button className="hidden sm:flex p-1.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.95 }} onClick={onLogout} title="離開空間">
          <LogOut size={13} />
        </motion.button>

        {/* 手機：⋮ 收合選單 */}
        <div className="relative sm:hidden">
          <motion.button className="p-1.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowMore(v => !v); setShowAdd(false); setShowTheme(false) }}>
            <MoreHorizontal size={15} />
          </motion.button>
          <AnimatePresence>
            {showMore && (
              <motion.div
                className="absolute top-10 right-0 p-1.5 rounded-2xl flex flex-col gap-1 min-w-[120px]"
                style={{ background: 'rgba(8,6,24,0.97)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 200 }}
                initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ color: '#f87171' }}
                  onClick={() => { closeAll(); onDeleteRoom() }}>
                  <Trash2 size={14} /> 刪除房間
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => { closeAll(); onLogout() }}>
                  <LogOut size={14} /> 離開空間
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 特效浮動面板（右下角，任何模式都可用） */}
      <div className="fixed right-4 flex flex-col items-end" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))', zIndex: 100 }}>

        {/* 展開的特效列表 */}
        <AnimatePresence>
          {showEffects && (
            <motion.div
              className="mb-2 p-2 rounded-2xl flex flex-col gap-1"
              style={{ background: 'rgba(8,6,24,0.97)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 130 }}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
            >
              <p className="text-xs px-2 pb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>點按開啟 / 停止</p>
              {EFFECTS_CONFIG.map(ef => {
                const state = effects[ef.key]
                return (
                  <button
                    key={ef.key}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                    style={{
                      color: state.active ? theme.accent : 'var(--text-primary)',
                      background: state.active ? `${theme.accent}20` : 'transparent',
                      border: state.active ? `1px solid ${theme.accent}50` : '1px solid transparent',
                    }}
                    onClick={state.onToggle}
                  >
                    <span>{ef.emoji}</span>
                    <span>{ef.label}</span>
                    {state.active && (
                      <motion.span
                        className="ml-auto"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ fontSize: 8, color: theme.accent }}
                      >
                        ●
                      </motion.span>
                    )}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 特效主按鈕 */}
        <motion.button
          className="w-12 h-12 rounded-full flex items-center justify-center relative"
          style={{
            background: showEffects ? `${theme.accent}30` : 'var(--glass-bg)',
            border: `1px solid ${showEffects ? theme.accent : 'var(--glass-border)'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: anyEffectActive ? `0 0 20px ${theme.accent}60` : 'none',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEffects(v => !v)}
          title="特效"
        >
          {showEffects
            ? <X size={18} style={{ color: theme.accent }} />
            : <Sparkles size={18} style={{ color: anyEffectActive ? theme.accent : 'var(--text-secondary)' }} />
          }
          {/* 活躍指示點 */}
          {anyEffectActive && !showEffects && (
            <motion.div
              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: theme.accent }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>
    </>
  )
}

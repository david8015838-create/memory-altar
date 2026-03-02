// ============================================================
// App.tsx - 主應用程式
// 組合所有元件，管理全域狀態
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppMode, WidgetType, ThemeName } from './types'
import { useWidgets } from './hooks/useWidgets'
import { useTheme } from './hooks/useTheme'
import { FloatingBackground } from './components/effects/FloatingBackground'
import { PetalRain } from './components/effects/PetalRain'
import { WhisperMessages } from './components/effects/WhisperMessages'
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas'
import { Toolbar } from './components/ui/Toolbar'

export default function App() {
  const { theme, changeTheme } = useTheme()
  const {
    widgets,
    isLoading,
    isOnline,
    addWidget,
    updateWidget,
    deleteWidget,
    bringToFront,
  } = useWidgets()

  const [mode, setMode] = useState<AppMode>('edit')
  const [isPetalActive, setIsPetalActive] = useState(false)
  const [isWhisperActive, setIsWhisperActive] = useState(false)

  // 畫布 DOM ref（用於計算新 widget 的初始位置）
  const canvasRef = useRef<HTMLDivElement | null>(null)

  // 計算畫布可視中心（新增 widget 時用）
  const getCanvasCenter = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    // 畫布 4000x4000，起始 offset = -2000
    return {
      x: 2000 - vw / 2 + vw * 0.3 + (Math.random() - 0.5) * 200,
      y: 2000 - vh / 2 + vh * 0.3 + (Math.random() - 0.5) * 200,
    }
  }, [])

  const handleAddWidget = (type: WidgetType) => {
    addWidget(type, getCanvasCenter())
  }

  const toggleMode = () => setMode(prev => prev === 'edit' ? 'view' : 'edit')

  // ── 載入畫面 ──────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: theme.backgroundGradient }}
      >
        <FloatingBackground theme={theme} />
        <motion.div
          className="text-center relative"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <p style={{ color: theme.accent, fontFamily: '"Noto Serif TC", serif', fontSize: 18 }}>
            回憶祭壇
          </p>
          <p className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
            載入中...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: theme.backgroundGradient }}
    >
      {/* 動態背景光暈 */}
      <FloatingBackground theme={theme} />

      {/* 無限畫布 */}
      <InfiniteCanvas
        widgets={widgets}
        mode={mode}
        theme={theme}
        onUpdateWidget={updateWidget}
        onDeleteWidget={deleteWidget}
        onBringToFront={bringToFront}
        onCanvasRef={(ref) => { canvasRef.current = ref }}
      />

      {/* 工具列（瀏覽模式下漸隱） */}
      <AnimatePresence>
        {(mode === 'edit' || true) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mode === 'view' ? 0.3 : 1 }}
            style={{ pointerEvents: mode === 'view' ? 'none' : ('auto' as React.CSSProperties['pointerEvents']) }}
            onMouseEnter={(e) => {
              if (mode === 'view') {
                ;(e.currentTarget as HTMLDivElement).style.opacity = '1'
                ;(e.currentTarget as HTMLDivElement).style.pointerEvents = 'auto'
              }
            }}
            onMouseLeave={(e) => {
              if (mode === 'view') {
                ;(e.currentTarget as HTMLDivElement).style.opacity = '0.3'
                ;(e.currentTarget as HTMLDivElement).style.pointerEvents = 'none'
              }
            }}
          >
            <Toolbar
              mode={mode}
              theme={theme}
              isOnline={isOnline}
              onModeToggle={toggleMode}
              onAddWidget={handleAddWidget}
              onThemeChange={(name: ThemeName) => changeTheme(name)}
              onTriggerPetals={() => !isPetalActive && setIsPetalActive(true)}
              onTriggerWhispers={() => !isWhisperActive && setIsWhisperActive(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 彩蛋：花瓣雨 */}
      <PetalRain
        isActive={isPetalActive}
        onComplete={() => setIsPetalActive(false)}
      />

      {/* 彩蛋：悄悄話流星 */}
      <WhisperMessages
        isActive={isWhisperActive}
        onComplete={() => setIsWhisperActive(false)}
        accentColor={theme.accent}
      />

      {/* 空畫布提示（無 widget 時） */}
      <AnimatePresence>
        {widgets.length === 0 && mode === 'edit' && (
          <motion.div
            className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="text-center text-lg"
              style={{
                color: 'var(--text-secondary)',
                fontFamily: '"Noto Serif TC", serif',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              點擊「新增」開始記錄你們的回憶 ✨
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 模式切換提示 */}
      <AnimatePresence>
        {mode === 'view' && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(20px)',
              zIndex: 100,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            移動滑鼠到頂部顯示工具列
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

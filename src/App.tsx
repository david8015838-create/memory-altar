// ============================================================
// App.tsx v2 - 整合認證、分頁、手繪 Modal
// ============================================================

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppMode, WidgetType, ThemeName } from './types'
import { useAuth } from './hooks/useAuth'
import { usePages } from './hooks/usePages'
import { useWidgets } from './hooks/useWidgets'
import { useTheme } from './hooks/useTheme'
import { FloatingBackground } from './components/effects/FloatingBackground'
import { PetalRain } from './components/effects/PetalRain'
import { WhisperMessages } from './components/effects/WhisperMessages'
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas'
import { Toolbar } from './components/ui/Toolbar'
import { PageTabs } from './components/pages/PageTabs'
import { LoginScreen } from './components/auth/LoginScreen'
import { DrawingCanvas } from './components/ui/DrawingCanvas'

export default function App() {
  const { theme, changeTheme } = useTheme()
  const { status, spaceId, error, isCreatingNew, setIsCreatingNew, login, register, logout } = useAuth()

  const { pages, currentPageId, setCurrentPageId, addPage, renamePage, removePage } = usePages(spaceId)
  const { widgets, isLoading, isOnline, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront } = useWidgets(spaceId, currentPageId)

  const [mode, setMode] = useState<AppMode>('edit')
  const [isPetalActive, setIsPetalActive] = useState(false)
  const [isWhisperActive, setIsWhisperActive] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)

  const canvasRef = useRef<HTMLDivElement | null>(null)

  const getCanvasCenter = useCallback(() => ({
    x: 2000 - window.innerWidth / 2 + window.innerWidth * 0.3 + (Math.random() - 0.5) * 200,
    y: 2000 - window.innerHeight / 2 + window.innerHeight * 0.3 + (Math.random() - 0.5) * 200,
  }), [])

  const handleAddWidget = (type: WidgetType) => addWidget(type, getCanvasCenter())

  // 手繪完成 → 建立 drawing widget
  const handleDrawingSave = (imageUrl: string) => {
    const widgetId = addWidget('drawing', getCanvasCenter())
    // 等下一個 tick 讓 widget 先建立，再更新 imageUrl
    setTimeout(() => {
      // 找到剛建立的 widget 更新 content
      updateWidget(widgetId as string, { content: { imageUrl, caption: '' } })
    }, 100)
    setShowDrawingCanvas(false)
  }

  // ── 載入中 ────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.backgroundGradient }}>
        <FloatingBackground theme={theme} />
        <motion.div className="text-center z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.div>
          <p style={{ color: theme.accent, fontFamily: '"Noto Serif TC", serif' }}>回憶祭壇</p>
        </motion.div>
      </div>
    )
  }

  // ── 未登入 ────────────────────────────────────────────
  if (status === 'unauthenticated') {
    return (
      <LoginScreen
        theme={theme}
        isCreatingNew={isCreatingNew}
        onToggleMode={setIsCreatingNew}
        onLogin={login}
        onRegister={register}
        error={error}
      />
    )
  }

  // ── 主畫面 ────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: theme.backgroundGradient }}>
      <FloatingBackground theme={theme} />

      {/* 無限畫布 */}
      {!showDrawingCanvas && currentPageId && (
        <InfiniteCanvas
          widgets={widgets}
          mode={mode}
          theme={theme}
          onUpdateWidget={updateWidget}
          onDeleteWidget={deleteWidget}
          onDuplicateWidget={duplicateWidget}
          onBringToFront={bringToFront}
          onCanvasRef={r => { canvasRef.current = r }}
        />
      )}

      {/* 工具列 */}
      {!showDrawingCanvas && (
        <motion.div animate={{ opacity: mode === 'view' ? 0.25 : 1 }}
          style={{ pointerEvents: mode === 'view' ? 'none' : 'auto' }}
          onMouseEnter={e => { if (mode === 'view') { (e.currentTarget as HTMLDivElement).style.opacity = '1'; (e.currentTarget as HTMLDivElement).style.pointerEvents = 'auto' } }}
          onMouseLeave={e => { if (mode === 'view') { (e.currentTarget as HTMLDivElement).style.opacity = '0.25'; (e.currentTarget as HTMLDivElement).style.pointerEvents = 'none' } }}>
          <Toolbar
            mode={mode} theme={theme} isOnline={isOnline}
            onModeToggle={() => setMode(m => m === 'edit' ? 'view' : 'edit')}
            onAddWidget={handleAddWidget}
            onAddDrawing={() => setShowDrawingCanvas(true)}
            onThemeChange={(n: ThemeName) => changeTheme(n)}
            onTriggerPetals={() => !isPetalActive && setIsPetalActive(true)}
            onTriggerWhispers={() => !isWhisperActive && setIsWhisperActive(true)}
            onLogout={logout}
          />
        </motion.div>
      )}

      {/* 分頁 Tabs */}
      {!showDrawingCanvas && (
        <PageTabs
          pages={pages} currentPageId={currentPageId} mode={mode} theme={theme}
          onSelect={setCurrentPageId}
          onAdd={addPage} onRename={renamePage} onDelete={removePage}
        />
      )}

      {/* 手繪畫布 Modal */}
      <AnimatePresence>
        {showDrawingCanvas && (
          <DrawingCanvas
            theme={theme} spaceId={spaceId}
            onSave={handleDrawingSave}
            onClose={() => setShowDrawingCanvas(false)}
          />
        )}
      </AnimatePresence>

      {/* 花瓣雨 */}
      <PetalRain isActive={isPetalActive} onComplete={() => setIsPetalActive(false)} />

      {/* 悄悄話 */}
      <WhisperMessages isActive={isWhisperActive} onComplete={() => setIsWhisperActive(false)} accentColor={theme.accent} />

      {/* 空畫布提示 */}
      <AnimatePresence>
        {widgets.length === 0 && mode === 'edit' && !isLoading && !showDrawingCanvas && (
          <motion.div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 2 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.p className="text-center text-lg" style={{ color: 'var(--text-secondary)', fontFamily: '"Noto Serif TC", serif' }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>
              點擊「新增」開始記錄你們的回憶 ✨
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

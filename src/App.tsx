// ============================================================
// App.tsx v3 - 整合認證、分頁、手繪 Modal、持續特效
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppMode, WidgetType, ThemeName } from './types'
import { useAuth } from './hooks/useAuth'
import { usePages } from './hooks/usePages'
import { useWidgets } from './hooks/useWidgets'
import { useTheme } from './hooks/useTheme'
import { FloatingBackground } from './components/effects/FloatingBackground'
import { PetalRain } from './components/effects/PetalRain'
import { WhisperMessages } from './components/effects/WhisperMessages'
import { StarShower } from './components/effects/StarShower'
import { SnowFall } from './components/effects/SnowFall'
import { Fireflies } from './components/effects/Fireflies'
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas'
import { Toolbar } from './components/ui/Toolbar'
import { PageTabs } from './components/pages/PageTabs'
import { LoginScreen } from './components/auth/LoginScreen'
import { DrawingCanvas } from './components/ui/DrawingCanvas'
import { ConfirmModal } from './components/ui/ConfirmModal'
import { deleteSpace, ping } from './lib/supabase'

export default function App() {
  const { theme, changeTheme } = useTheme()
  const { status, spaceId, error, isCreatingNew, setIsCreatingNew, login, register, logout } = useAuth()

  const { pages, currentPageId, setCurrentPageId, addPage, renamePage, removePage } = usePages(spaceId)
  const { widgets, isLoading, isOnline, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront, syncToCloud, undo, redo } = useWidgets(spaceId, currentPageId)

  const [mode, setMode] = useState<AppMode>('view')
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── 特效開關（持續循環，點按切換）
  const [isPetalActive,   setIsPetalActive]   = useState(false)
  const [isWhisperActive, setIsWhisperActive] = useState(false)
  const [isStarActive,    setIsStarActive]    = useState(false)
  const [isSnowActive,    setIsSnowActive]    = useState(false)
  const [isFireflyActive, setIsFireflyActive] = useState(false)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const resetViewRef = useRef<(() => void) | null>(null) // C2

  // ── Keepalive：每 4 分鐘 ping 一次
  useEffect(() => {
    if (!spaceId) return
    const id = setInterval(() => ping(spaceId), 4 * 60 * 1000)
    return () => clearInterval(id)
  }, [spaceId])

  // ── C1: 鍵盤快捷鍵 Ctrl/Cmd+Z = undo, Ctrl/Cmd+Y / Ctrl+Shift+Z = redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // ── 刪除整個房間
  const handleDeleteRoom = async () => {
    setIsDeleting(true)
    const ok = await deleteSpace(spaceId)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (ok) logout()
  }

  const getCanvasCenter = useCallback(() => ({
    x: 2000 - window.innerWidth / 2 + window.innerWidth * 0.3 + (Math.random() - 0.5) * 200,
    y: 2000 - window.innerHeight / 2 + window.innerHeight * 0.3 + (Math.random() - 0.5) * 200,
  }), [])

  const handleAddWidget = (type: WidgetType) => addWidget(type, getCanvasCenter())

  const handleDrawingSave = (imageUrl: string) => {
    const widgetId = addWidget('drawing', getCanvasCenter())
    setTimeout(() => {
      updateWidget(widgetId as string, { content: { imageUrl, caption: '', showBorder: true } })
    }, 100)
    setShowDrawingCanvas(false)
  }

  // ── 載入中
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

  // ── 未登入
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

  // ── 主畫面
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
          onRegisterReset={fn => { resetViewRef.current = fn }}
        />
      )}

      {/* 工具列（編輯模式完整顯示） */}
      {!showDrawingCanvas && mode === 'edit' && (
        <Toolbar
          mode={mode} theme={theme} isOnline={isOnline}
          onModeToggle={() => setMode('view')}
          onAddWidget={handleAddWidget}
          onAddDrawing={() => setShowDrawingCanvas(true)}
          onThemeChange={(n: ThemeName) => changeTheme(n)}
          onLogout={logout}
          onDeleteRoom={() => setShowDeleteConfirm(true)}
          onSync={syncToCloud}
          onResetView={() => resetViewRef.current?.()}
          effects={{
            petal:   { active: isPetalActive,   onToggle: () => setIsPetalActive(v => !v) },
            whisper: { active: isWhisperActive, onToggle: () => setIsWhisperActive(v => !v) },
            star:    { active: isStarActive,    onToggle: () => setIsStarActive(v => !v) },
            snow:    { active: isSnowActive,    onToggle: () => setIsSnowActive(v => !v) },
            firefly: { active: isFireflyActive, onToggle: () => setIsFireflyActive(v => !v) },
          }}
        />
      )}

      {/* 瀏覽模式：固定的「返回編輯」按鈕 */}
      {!showDrawingCanvas && mode === 'view' && (
        <motion.button
          className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{
            zIndex: 100,
            top: 'max(1rem, env(safe-area-inset-top))',
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${theme.glassBorder}`,
            color: theme.textSecondary,
            backdropFilter: 'blur(20px)',
          }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMode('edit')}
        >
          ✏️ 點此返回編輯
        </motion.button>
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

      {/* 持續循環特效層 */}
      <PetalRain   isActive={isPetalActive} />
      <WhisperMessages isActive={isWhisperActive} accentColor={theme.accent} />
      <StarShower  isActive={isStarActive} />
      <SnowFall    isActive={isSnowActive} />
      <Fireflies   isActive={isFireflyActive} />

      {/* B2: loading indicator while widgets are being fetched */}
      <AnimatePresence>
        {isLoading && !showDrawingCanvas && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 5 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-8 h-8 rounded-full border-2"
              style={{ borderColor: `${theme.accent}40`, borderTopColor: theme.accent }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 刪除房間確認 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        theme={theme}
        title="刪除整個空間？"
        message={`確定要永久刪除「${spaceId}」這個空間嗎？\n所有照片、影片、手繪、文字都將一併刪除，且無法復原。`}
        confirmLabel={isDeleting ? '刪除中…' : '確認刪除'}
        cancelLabel="取消"
        danger
        onConfirm={handleDeleteRoom}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

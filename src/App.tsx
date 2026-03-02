// ============================================================
// App.tsx v2 - 整合認證、分頁、手繪 Modal
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
  const { widgets, isLoading, isOnline, addWidget, updateWidget, deleteWidget, duplicateWidget, bringToFront } = useWidgets(spaceId, currentPageId)

  const [mode, setMode] = useState<AppMode>('edit')
  const [isPetalActive, setIsPetalActive] = useState(false)
  const [isWhisperActive, setIsWhisperActive] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canvasRef = useRef<HTMLDivElement | null>(null)

  // ── Keepalive：每 4 分鐘 ping 一次，防止 Supabase 免費版閒置停機 ──
  useEffect(() => {
    if (!spaceId) return
    const id = setInterval(() => ping(spaceId), 4 * 60 * 1000)
    return () => clearInterval(id)
  }, [spaceId])

  // ── 刪除整個房間 ──────────────────────────────────────
  const handleDeleteRoom = async () => {
    setIsDeleting(true)
    const ok = await deleteSpace(spaceId)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (ok) logout()  // 刪除成功後登出
  }

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

      {/* 工具列（編輯模式完整顯示） */}
      {!showDrawingCanvas && mode === 'edit' && (
        <Toolbar
          mode={mode} theme={theme} isOnline={isOnline}
          onModeToggle={() => setMode('view')}
          onAddWidget={handleAddWidget}
          onAddDrawing={() => setShowDrawingCanvas(true)}
          onThemeChange={(n: ThemeName) => changeTheme(n)}
          onTriggerPetals={() => !isPetalActive && setIsPetalActive(true)}
          onTriggerWhispers={() => !isWhisperActive && setIsWhisperActive(true)}
          onLogout={logout}
          onDeleteRoom={() => setShowDeleteConfirm(true)}
        />
      )}

      {/* 瀏覽模式：固定的「返回編輯」按鈕（手機/桌面都能點） */}
      {!showDrawingCanvas && mode === 'view' && (
        <motion.button
          className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{
            zIndex: 100,
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

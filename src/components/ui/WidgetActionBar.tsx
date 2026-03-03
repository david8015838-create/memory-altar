// ============================================================
// WidgetActionBar - 選取 Widget 後的底部操作列
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RotateCcw, RotateCw, Copy, X, Lock, Unlock } from 'lucide-react'
import type { Widget, Theme } from '../../types'

interface Props {
  selectedWidget: Widget | null
  theme: Theme
  onDelete: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onDuplicate: () => void
  onDeselect: () => void
  onToggleLock: () => void
}

export function WidgetActionBar({
  selectedWidget, theme, onDelete, onRotateLeft, onRotateRight, onDuplicate, onDeselect, onToggleLock
}: Props) {
  return (
    <AnimatePresence>
      {selectedWidget && (
        <motion.div
          // inset-x-3 確保左右各留 12px，永遠不超出螢幕
          // flex justify-center 讓按鈕群置中
          className="fixed inset-x-3 flex justify-center"
          style={{
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            zIndex: 200,
            pointerEvents: 'none', // 讓定位層穿透，只有按鈕列本身可點
          }}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl"
            style={{
              pointerEvents: 'auto',
              background: 'rgba(10,8,30,0.95)',
              border: `1px solid ${theme.glassBorder}`,
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <ActionBtn icon={<RotateCcw size={16} />} label="左轉" color={theme.textSecondary} onClick={onRotateLeft} />
            <ActionBtn icon={<RotateCw  size={16} />} label="右轉" color={theme.textSecondary} onClick={onRotateRight} />
            <ActionBtn icon={<Copy     size={16} />} label="複製" color={theme.accent}        onClick={onDuplicate} />
            {/* B4: lock/unlock toggle */}
            <ActionBtn
              icon={selectedWidget?.locked ? <Unlock size={16} /> : <Lock size={16} />}
              label={selectedWidget?.locked ? '解鎖' : '鎖定'}
              color={selectedWidget?.locked ? '#fbbf24' : theme.textSecondary}
              onClick={onToggleLock}
            />
            <div className="w-px h-6 mx-0.5 bg-white/10 flex-shrink-0" />
            <ActionBtn icon={<Trash2   size={16} />} label="刪除" color="#f87171"             onClick={onDelete} />
            <div className="w-px h-6 mx-0.5 bg-white/10 flex-shrink-0" />
            <ActionBtn icon={<X        size={16} />} label="取消" color={theme.textSecondary} onClick={onDeselect} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ActionBtn({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void
}) {
  return (
    <motion.button
      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl flex-shrink-0"
      style={{ color, minWidth: 32 }}
      whileTap={{ scale: 0.85 }}
      whileHover={{ background: 'rgba(255,255,255,0.08)' }}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="hidden sm:block text-[9px] opacity-70">{label}</span>
    </motion.button>
  )
}

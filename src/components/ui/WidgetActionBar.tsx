// ============================================================
// WidgetActionBar - 選取 Widget 後的底部操作列
// 手機 / 桌面都能清楚操作
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RotateCcw, RotateCw, Copy, X } from 'lucide-react'
import type { Widget, Theme } from '../../types'

interface Props {
  selectedWidget: Widget | null
  theme: Theme
  onDelete: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onDuplicate: () => void
  onDeselect: () => void
}

export function WidgetActionBar({
  selectedWidget, theme, onDelete, onRotateLeft, onRotateRight, onDuplicate, onDeselect
}: Props) {
  return (
    <AnimatePresence>
      {selectedWidget && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-2xl"
          // 底部，在分頁列上方
          style={{
            bottom: 70, zIndex: 200,
            background: 'rgba(10,8,30,0.95)',
            border: `1px solid ${theme.glassBorder}`,
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* 向左旋轉 */}
          <ActionBtn icon={<RotateCcw size={18} />} label="左轉" color={theme.textSecondary}
            onClick={onRotateLeft} />

          {/* 向右旋轉 */}
          <ActionBtn icon={<RotateCw size={18} />} label="右轉" color={theme.textSecondary}
            onClick={onRotateRight} />

          {/* 複製 */}
          <ActionBtn icon={<Copy size={18} />} label="複製" color={theme.accent}
            onClick={onDuplicate} />

          <div className="w-px h-8 bg-white/10" />

          {/* 刪除（紅色） */}
          <ActionBtn icon={<Trash2 size={18} />} label="刪除" color="#f87171"
            onClick={onDelete} />

          <div className="w-px h-8 bg-white/10" />

          {/* 取消選取 */}
          <ActionBtn icon={<X size={18} />} label="取消" color={theme.textSecondary}
            onClick={onDeselect} />
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
      className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-[48px]"
      style={{ color }}
      whileTap={{ scale: 0.85 }}
      whileHover={{ background: 'rgba(255,255,255,0.08)' }}
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] opacity-70">{label}</span>
    </motion.button>
  )
}

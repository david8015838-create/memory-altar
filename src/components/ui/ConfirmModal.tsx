// ============================================================
// ConfirmModal - 二次確認對話框
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import type { Theme } from '../../types'

interface Props {
  isOpen: boolean
  theme: Theme
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen, theme, title, message,
  confirmLabel = '確認', cancelLabel = '取消',
  danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: 99999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'rgba(12,8,32,0.98)',
              border: `1px solid ${theme.glassBorder}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.textPrimary, fontFamily: '"Noto Serif TC", serif' }}>
              {title}
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: theme.textSecondary }}>
              {message}
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: theme.textSecondary, border: `1px solid ${theme.glassBorder}` }}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: danger ? '#ef4444' : theme.accent, color: '#fff' }}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

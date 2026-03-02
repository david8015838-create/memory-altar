// ============================================================
// LoginScreen - 密碼保護入口
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Heart, Sparkles } from 'lucide-react'
import type { Theme } from '../../types'
import { FloatingBackground } from '../effects/FloatingBackground'

interface Props {
  theme: Theme
  isCreatingNew: boolean
  onToggleMode: (v: boolean) => void
  onLogin: (spaceId: string, password: string) => Promise<void>
  onRegister: (spaceId: string, password: string, confirm: string) => Promise<void>
  error: string
}

export function LoginScreen({ theme, isCreatingNew, onToggleMode, onLogin, onRegister, error }: Props) {
  const [spaceId, setSpaceId] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (isCreatingNew) {
      await onRegister(spaceId, password, confirm)
    } else {
      await onLogin(spaceId, password)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.backgroundGradient }}>
      <FloatingBackground theme={theme} />

      <motion.div
        className="relative z-10 w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* 標題 */}
        <div className="text-center mb-8">
          <motion.div
            className="text-5xl mb-3"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✨
          </motion.div>
          <h1 className="text-2xl font-medium" style={{ color: theme.accent, fontFamily: '"Noto Serif TC", serif' }}>
            回憶祭壇
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
            我們的專屬空間
          </p>
        </div>

        {/* 卡片 */}
        <div className="rounded-2xl p-6" style={{
          background: theme.glassBackground, border: `1px solid ${theme.glassBorder}`,
          backdropFilter: 'blur(24px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
        }}>
          {/* 模式切換 */}
          <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {['進入空間', '建立空間'].map((label, i) => (
              <button key={i} className="flex-1 py-2 text-sm transition-all"
                style={{
                  background: isCreatingNew === (i === 1) ? theme.accent : 'transparent',
                  color: isCreatingNew === (i === 1) ? '#fff' : theme.textSecondary,
                  borderRadius: '10px', fontWeight: isCreatingNew === (i === 1) ? 600 : 400
                }}
                onClick={() => onToggleMode(i === 1)}
              >{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* 空間 ID */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>空間 ID</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: `1px solid ${theme.glassBorder}`,
                  color: theme.textPrimary
                }}
                placeholder={isCreatingNew ? '例如：chen-yuqi-2024' : '輸入你們的空間 ID'}
                value={spaceId}
                onChange={e => setSpaceId(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {/* 密碼 */}
            <div>
              <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>密碼</label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: `1px solid ${theme.glassBorder}`,
                    color: theme.textPrimary
                  }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="輸入密碼"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} style={{ color: theme.textSecondary }} />
                           : <Eye size={16} style={{ color: theme.textSecondary }} />}
                </button>
              </div>
            </div>

            {/* 確認密碼（建立時顯示） */}
            <AnimatePresence>
              {isCreatingNew && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label className="text-xs mb-1 block" style={{ color: theme.textSecondary }}>確認密碼</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.08)', border: `1px solid ${theme.glassBorder}`,
                      color: theme.textPrimary
                    }}
                    type="password" placeholder="再輸入一次密碼"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 錯誤訊息 */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* 提交按鈕 */}
            <motion.button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mt-1"
              style={{ background: theme.accent, color: '#fff' }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
            >
              {loading ? (
                <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <>
                  {isCreatingNew ? <Sparkles size={15} /> : <Heart size={15} />}
                  {isCreatingNew ? '建立我們的空間' : '進入回憶'}
                </>
              )}
            </motion.button>
          </form>
        </div>

        {isCreatingNew && (
          <p className="text-center text-xs mt-4" style={{ color: theme.textSecondary }}>
            建立後把空間 ID 和密碼分享給對方，就能一起編輯 💕
          </p>
        )}
      </motion.div>
    </div>
  )
}

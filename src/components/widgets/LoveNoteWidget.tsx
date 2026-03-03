// ============================================================
// LoveNoteWidget — 信封情書 Widget
// 關閉：信封圖案，點擊後展開讀信
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Widget, LoveNoteContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget
  isEditMode: boolean
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onUpdate: (changes: Partial<Widget>) => void
  onBringToFront: () => void
}

export function LoveNoteWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = widget.content as LoveNoteContent
  const [isOpen, setIsOpen] = useState(false)
  const [editingMsg, setEditingMsg] = useState(false)
  const [editingFrom, setEditingFrom] = useState(false)

  const block = (e: React.SyntheticEvent) => e.stopPropagation()

  const sealColor = '#e879a0'

  return (
    <BaseWidget
      widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={200} minHeight={160}
    >
      <div className="w-full h-full relative select-none" style={{ perspective: 800 }}>

        {/* ── 信封外殼 ──────────────────────────── */}
        <motion.div
          className="w-full h-full rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #fff8f0 0%, #fde8ef 100%)',
            border: '1.5px solid rgba(232,121,160,0.4)',
            boxShadow: '0 4px 24px rgba(232,121,160,0.2), 0 1px 4px rgba(0,0,0,0.12)',
            position: 'relative',
          }}
        >
          {/* 信封 V 折痕 */}
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '42%', zIndex: 3, pointerEvents: 'none' }}
          >
            {/* 上蓋翻起效果（關閉時顯示，打開時隱藏） */}
            <AnimatePresence>
              {!isOpen && (
                <motion.polygon
                  points="0,0 100,0 50,55"
                  fill="#fdd0de"
                  stroke="rgba(232,121,160,0.3)"
                  strokeWidth="0.5"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  style={{ transformOrigin: 'top center' }}
                />
              )}
            </AnimatePresence>

            {/* 側折痕（裝飾線） */}
            <line x1="0" y1="0" x2="50" y2="55" stroke="rgba(232,121,160,0.2)" strokeWidth="0.5" />
            <line x1="100" y1="0" x2="50" y2="55" stroke="rgba(232,121,160,0.2)" strokeWidth="0.5" />
          </svg>

          {/* 信封底部 V 折痕 */}
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '38%', zIndex: 1, pointerEvents: 'none' }}
          >
            <polygon points="0,40 100,40 50,0" fill="#fde0eb" stroke="rgba(232,121,160,0.2)" strokeWidth="0.5" />
          </svg>

          {/* 信封中間區域 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 2, padding: '20% 16px 12px' }}
          >
            {!isOpen ? (
              /* ── 關閉：封蠟印章 + 點擊提示 ── */
              <motion.div
                className="flex flex-col items-center gap-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* 封蠟 */}
                <motion.div
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${sealColor}cc, ${sealColor})`,
                    boxShadow: `0 2px 12px ${sealColor}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    fontSize: 22,
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { block(e); if (!isEditMode) setIsOpen(true) }}
                >
                  💌
                </motion.div>
                {content.from && (
                  <p style={{ fontSize: 11, color: sealColor, opacity: 0.8, fontFamily: '"Caveat", cursive' }}>
                    給你的一封信
                  </p>
                )}
                {!isEditMode && (
                  <p style={{ fontSize: 9, color: 'rgba(180,100,130,0.5)' }}>點擊打開</p>
                )}
              </motion.div>
            ) : (
              /* ── 打開：信件內容 ── */
              <motion.div
                className="w-full h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
                style={{ padding: '0 4px', gap: 6 }}
              >
                <p style={{ fontSize: 12, color: '#c06090', fontFamily: '"Caveat", cursive', fontWeight: 600 }}>
                  親愛的你 ❤
                </p>

                {/* 信件正文 */}
                <div style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#6d3050',
                  fontFamily: '"Caveat", cursive',
                  lineHeight: 1.6,
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}>
                  {content.message || '（還沒寫信喔，在編輯模式下點擊即可填寫）'}
                </div>

                {/* 署名 */}
                {content.from && (
                  <p style={{ fontSize: 12, color: '#c06090', fontFamily: '"Caveat", cursive', textAlign: 'right' }}>
                    —— {content.from}
                  </p>
                )}

                {/* 關閉按鈕 */}
                <motion.button
                  style={{ fontSize: 9, color: 'rgba(180,100,130,0.5)', textAlign: 'center' }}
                  onClick={(e) => { block(e); setIsOpen(false) }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕ 收起
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── Edit mode：浮動編輯列 ────────────────── */}
        <AnimatePresence>
          {isEditMode && isSelected && (
            <motion.div
              data-no-drag
              className="absolute left-1/2 -translate-x-1/2 flex flex-col gap-1.5 p-2 rounded-2xl"
              style={{
                top: 'calc(100% + 10px)',
                background: 'rgba(8,6,24,0.97)',
                border: '1px solid rgba(232,121,160,0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                width: Math.max(widget.width, 220),
                zIndex: 50,
              }}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              onMouseDown={block}
              onPointerDown={block}
            >
              {/* 信件內容 */}
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>信件內容</label>
              {editingMsg ? (
                <textarea
                  autoFocus
                  className="rounded-xl px-2 py-1.5 text-sm outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(232,121,160,0.4)',
                    fontFamily: '"Caveat", cursive',
                    fontSize: 14,
                    minHeight: 80,
                  }}
                  value={content.message}
                  onChange={e => onUpdate({ content: { ...content, message: e.target.value } })}
                  onBlur={() => setEditingMsg(false)}
                />
              ) : (
                <button
                  className="rounded-xl px-2 py-1.5 text-sm text-left"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: content.message ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                    border: '1px dashed rgba(232,121,160,0.3)',
                    fontFamily: '"Caveat", cursive',
                    fontSize: 14,
                    minHeight: 36,
                  }}
                  onClick={() => setEditingMsg(true)}
                >
                  {content.message || '點擊填寫信件內容…'}
                </button>
              )}

              {/* 署名 */}
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>署名（寄件人）</label>
              {editingFrom ? (
                <input
                  autoFocus
                  className="rounded-xl px-2 py-1.5 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(232,121,160,0.4)',
                    fontFamily: '"Caveat", cursive',
                    fontSize: 14,
                  }}
                  value={content.from}
                  onChange={e => onUpdate({ content: { ...content, from: e.target.value } })}
                  onBlur={() => setEditingFrom(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingFrom(false)}
                />
              ) : (
                <button
                  className="rounded-xl px-2 py-1.5 text-sm text-left"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: content.from ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                    border: '1px dashed rgba(232,121,160,0.3)',
                    fontFamily: '"Caveat", cursive',
                    fontSize: 14,
                  }}
                  onClick={() => setEditingFrom(true)}
                >
                  {content.from || '點擊填寫名字…'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseWidget>
  )
}

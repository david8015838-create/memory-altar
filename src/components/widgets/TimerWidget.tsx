import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Widget, TimerContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
  onBringToFront: () => void
}

const TIMER_EMOJIS = ['💕', '💗', '💖', '💝', '🌸', '🌙', '⭐', '🎀', '🫶', '✨', '🥂', '🌹']

function calcDiff(startDate: string) {
  const diff = Math.max(0, Date.now() - new Date(startDate).getTime())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function TimerWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = widget.content as TimerContent
  const [diff, setDiff] = useState(() => calcDiff(content.startDate))

  useEffect(() => {
    const id = setInterval(() => setDiff(calcDiff(content.startDate)), 1000)
    return () => clearInterval(id)
  }, [content.startDate])

  const canEdit = isEditMode && isSelected

  const block = (e: React.SyntheticEvent) => e.stopPropagation()

  const cycleEmoji = (e: React.MouseEvent) => {
    block(e)
    const idx = TIMER_EMOJIS.indexOf(content.emoji)
    onUpdate({ content: { ...content, emoji: TIMER_EMOJIS[(idx + 1) % TIMER_EMOJIS.length] } })
  }

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={200} minHeight={150}>
      <div className="w-full h-full flex flex-col items-center justify-center p-3" style={{
        borderRadius: 16, background: 'rgba(15,10,40,0.6)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>

        {/* Emoji — 選取時點擊切換 */}
        <motion.div
          className="text-2xl mb-1 select-none"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ cursor: canEdit ? 'pointer' : 'default' }}
          title={canEdit ? '點擊換表情' : ''}
          onClick={canEdit ? cycleEmoji : undefined}
        >
          {content.emoji}
        </motion.div>

        {/* 標題 — 選取時直接可編輯，不需雙擊 */}
        {canEdit ? (
          <input
            className="bg-transparent text-center outline-none mb-2 w-full"
            style={{
              color: 'var(--accent)', fontSize: 14,
              fontFamily: '"Noto Serif TC", serif',
              borderBottom: '1px solid rgba(167,139,250,0.3)',
              padding: '2px 4px',
            }}
            value={content.title}
            placeholder="紀念日名稱"
            onChange={e => onUpdate({ content: { ...content, title: e.target.value } })}
            onMouseDown={block}
            onClick={block}
          />
        ) : (
          <p className="mb-2 text-center" style={{ color: 'var(--accent)', fontSize: 14, fontFamily: '"Noto Serif TC", serif' }}>
            {content.title}
          </p>
        )}

        {/* 天數計數 */}
        <div className="flex items-baseline gap-1 mb-2">
          <motion.span
            className="font-bold tabular-nums"
            style={{ fontSize: Math.min(48, widget.width * 0.18), color: 'var(--text-primary)', fontFamily: 'system-ui, monospace' }}
            key={diff.days} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {diff.days.toLocaleString()}
          </motion.span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>天</span>
        </div>

        <div className="flex items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          <span>{String(diff.hours).padStart(2, '0')}h</span><span>·</span>
          <span>{String(diff.minutes).padStart(2, '0')}m</span><span>·</span>
          <motion.span key={diff.seconds} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {String(diff.seconds).padStart(2, '0')}s
          </motion.span>
        </div>

        {/* 日期 — 選取時直接顯示日期選擇器 */}
        {canEdit ? (
          <input
            type="date"
            className="mt-2 outline-none text-xs text-center rounded-lg px-2 py-1"
            style={{
              color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--glass-border)',
            }}
            value={content.startDate}
            onChange={e => onUpdate({ content: { ...content, startDate: e.target.value } })}
            onMouseDown={block}
            onClick={block}
          />
        ) : (
          <p className="mt-2 text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
            {new Date(content.startDate).toLocaleDateString('zh-TW')}
          </p>
        )}

        {canEdit && (
          <p className="mt-1 text-center" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
            點擊表情換圖示
          </p>
        )}
      </div>
    </BaseWidget>
  )
}

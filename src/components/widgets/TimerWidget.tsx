// ============================================================
// TimerWidget - 紀念日倒數計時器
// 顯示在一起的天數、小時、分鐘
// ============================================================

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Widget, TimerContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget
  isEditMode: boolean
  onUpdate: (changes: Partial<Widget>) => void
  onDelete: () => void
  onBringToFront: () => void
}

interface TimeDiff {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeDiff(startDate: string): TimeDiff {
  const start = new Date(startDate).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - start)

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export function TimerWidget({ widget, isEditMode, onUpdate, onDelete, onBringToFront }: Props) {
  const content = widget.content as TimerContent
  const [timeDiff, setTimeDiff] = useState(() => calcTimeDiff(content.startDate))
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDate, setIsEditingDate] = useState(false)

  // 每秒更新
  useEffect(() => {
    const id = setInterval(() => {
      setTimeDiff(calcTimeDiff(content.startDate))
    }, 1000)
    return () => clearInterval(id)
  }, [content.startDate])

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onBringToFront={onBringToFront}
      minWidth={200}
      minHeight={150}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3"
        style={{
          borderRadius: '16px',
          background: 'rgba(15, 10, 40, 0.6)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Emoji */}
        <motion.div
          className="text-2xl mb-1"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {content.emoji}
        </motion.div>

        {/* 標題 */}
        {isEditingTitle && isEditMode ? (
          <input
            autoFocus
            className="bg-transparent text-center outline-none font-handwriting mb-2 w-full"
            style={{
              color: 'var(--accent)',
              fontSize: 14,
              fontFamily: '"Noto Serif TC", serif',
            }}
            value={content.title}
            onChange={e => onUpdate({ content: { ...content, title: e.target.value } })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
          />
        ) : (
          <p
            className="mb-2 text-center"
            style={{
              color: 'var(--accent)',
              fontSize: 14,
              fontFamily: '"Noto Serif TC", serif',
              cursor: isEditMode ? 'text' : 'default',
            }}
            onDoubleClick={() => isEditMode && setIsEditingTitle(true)}
          >
            {content.title}
          </p>
        )}

        {/* 天數大字 */}
        <div className="flex items-baseline gap-1 mb-2">
          <motion.span
            className="font-bold tabular-nums"
            style={{
              fontSize: Math.min(48, widget.width * 0.18),
              color: 'var(--text-primary)',
              fontFamily: 'system-ui, monospace',
            }}
            key={timeDiff.days} // 天數變化時觸發動畫
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {timeDiff.days.toLocaleString()}
          </motion.span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>天</span>
        </div>

        {/* 小時/分鐘/秒 */}
        <div className="flex items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          <span>{String(timeDiff.hours).padStart(2, '0')}h</span>
          <span>·</span>
          <span>{String(timeDiff.minutes).padStart(2, '0')}m</span>
          <span>·</span>
          <motion.span
            key={timeDiff.seconds}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {String(timeDiff.seconds).padStart(2, '0')}s
          </motion.span>
        </div>

        {/* 起始日期（編輯模式可修改） */}
        {isEditingDate && isEditMode ? (
          <input
            type="date"
            autoFocus
            className="mt-2 bg-transparent outline-none text-xs text-center"
            style={{ color: 'var(--text-secondary)' }}
            value={content.startDate}
            onChange={e => onUpdate({ content: { ...content, startDate: e.target.value } })}
            onBlur={() => setIsEditingDate(false)}
          />
        ) : (
          <p
            className="mt-2 text-xs"
            style={{
              color: 'var(--text-secondary)',
              cursor: isEditMode ? 'text' : 'default',
              opacity: 0.6,
            }}
            onDoubleClick={() => isEditMode && setIsEditingDate(true)}
            title={isEditMode ? '雙擊修改日期' : ''}
          >
            {new Date(content.startDate).toLocaleDateString('zh-TW')}
          </p>
        )}
      </div>
    </BaseWidget>
  )
}

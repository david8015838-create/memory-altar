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

function calcDiff(startDate: string) {
  const diff = Math.max(0, Date.now() - new Date(startDate).getTime())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export function TimerWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate,  onBringToFront }: Props) {
  const content = widget.content as TimerContent
  const [diff, setDiff] = useState(() => calcDiff(content.startDate))
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDate, setEditingDate] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setDiff(calcDiff(content.startDate)), 1000)
    return () => clearInterval(id)
  }, [content.startDate])

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
        <motion.div className="text-2xl mb-1" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          {content.emoji}
        </motion.div>
        {editingTitle && isEditMode ? (
          <input autoFocus className="bg-transparent text-center outline-none mb-2 w-full"
            style={{ color: 'var(--accent)', fontSize: 14, fontFamily: '"Noto Serif TC", serif' }}
            value={content.title}
            onChange={e => onUpdate({ content: { ...content, title: e.target.value } })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)} />
        ) : (
          <p className="mb-2 text-center" style={{ color: 'var(--accent)', fontSize: 14, fontFamily: '"Noto Serif TC", serif', cursor: isEditMode ? 'text' : 'default' }}
            onDoubleClick={() => isEditMode && setEditingTitle(true)}>
            {content.title}
          </p>
        )}
        <div className="flex items-baseline gap-1 mb-2">
          <motion.span className="font-bold tabular-nums"
            style={{ fontSize: Math.min(48, widget.width * 0.18), color: 'var(--text-primary)', fontFamily: 'system-ui, monospace' }}
            key={diff.days} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}>
            {diff.days.toLocaleString()}
          </motion.span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>天</span>
        </div>
        <div className="flex items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          <span>{String(diff.hours).padStart(2,'0')}h</span><span>·</span>
          <span>{String(diff.minutes).padStart(2,'0')}m</span><span>·</span>
          <motion.span key={diff.seconds} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {String(diff.seconds).padStart(2,'0')}s
          </motion.span>
        </div>
        {editingDate && isEditMode ? (
          <input type="date" autoFocus className="mt-2 bg-transparent outline-none text-xs text-center"
            style={{ color: 'var(--text-secondary)' }}
            value={content.startDate}
            onChange={e => onUpdate({ content: { ...content, startDate: e.target.value } })}
            onBlur={() => setEditingDate(false)} />
        ) : (
          <p className="mt-2 text-xs opacity-60" style={{ color: 'var(--text-secondary)', cursor: isEditMode ? 'text' : 'default' }}
            onDoubleClick={() => isEditMode && setEditingDate(true)}>
            {new Date(content.startDate).toLocaleDateString('zh-TW')}
          </p>
        )}
      </div>
    </BaseWidget>
  )
}

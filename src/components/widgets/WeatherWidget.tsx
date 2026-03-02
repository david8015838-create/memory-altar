import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Widget, WeatherContent, WeatherMood } from '../../types'
import { WEATHER_MOODS } from '../../constants/themes'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
   onBringToFront: () => void
}

export function WeatherWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate,  onBringToFront }: Props) {
  const content = widget.content as WeatherContent
  const [editingLabel, setEditingLabel] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const mood = WEATHER_MOODS[content.mood]

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={140} minHeight={120}>
      <div className="w-full h-full relative flex flex-col items-center justify-center p-3" style={{
        borderRadius: 20,
        background: `linear-gradient(135deg, ${mood.color}25, ${mood.color}10)`,
        border: `1px solid ${mood.color}50`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 4px 24px ${mood.color}30`,
        transition: 'all 0.5s ease',
      }}>
        <motion.div className="text-4xl mb-2 select-none" animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          onClick={() => isEditMode && setShowPicker(!showPicker)}
          style={{ cursor: isEditMode ? 'pointer' : 'default' }}>
          {mood.emoji}
        </motion.div>
        <p className="text-xs mb-1" style={{ color: mood.color, opacity: 0.8 }}>{mood.description}</p>
        {editingLabel ? (
          <input autoFocus className="bg-transparent text-center outline-none w-full text-sm"
            style={{ color: 'var(--text-primary)', fontFamily: '"Noto Serif TC", serif' }}
            value={content.label}
            onChange={e => onUpdate({ content: { ...content, label: e.target.value } })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingLabel(false)} />
        ) : (
          <p className="text-sm text-center leading-snug" style={{ color: 'var(--text-primary)', fontFamily: '"Noto Serif TC", serif', cursor: isEditMode ? 'text' : 'default' }}
            onDoubleClick={() => isEditMode && setEditingLabel(true)}>
            {content.label}
          </p>
        )}
        {showPicker && isEditMode && (
          <motion.div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1 p-2 rounded-xl"
            style={{ background: 'rgba(15,10,40,0.9)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', zIndex: 20 }}
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
            {(Object.keys(WEATHER_MOODS) as WeatherMood[]).map(m => (
              <button key={m} className="text-lg hover:scale-125 transition-transform"
                onClick={e => { e.stopPropagation(); onUpdate({ content: { ...content, mood: m } }); setShowPicker(false) }}>
                {WEATHER_MOODS[m].emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </BaseWidget>
  )
}

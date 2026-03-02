// ============================================================
// WeatherWidget - 心情天氣標籤
// 可選擇 6 種心情，並自定義標籤文字
// ============================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Widget, WeatherContent, WeatherMood } from '../../types'
import { WEATHER_MOODS } from '../../constants/themes'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget
  isEditMode: boolean
  onUpdate: (changes: Partial<Widget>) => void
  onDelete: () => void
  onBringToFront: () => void
}

export function WeatherWidget({ widget, isEditMode, onUpdate, onDelete, onBringToFront }: Props) {
  const content = widget.content as WeatherContent
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)

  const currentMood = WEATHER_MOODS[content.mood]

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onBringToFront={onBringToFront}
      minWidth={140}
      minHeight={120}
    >
      <div
        className="w-full h-full relative flex flex-col items-center justify-center p-3"
        style={{
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${currentMood.color}25, ${currentMood.color}10)`,
          border: `1px solid ${currentMood.color}50`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 4px 24px ${currentMood.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          transition: 'all 0.5s ease',
        }}
      >
        {/* 天氣 Emoji */}
        <motion.div
          className="text-4xl mb-2 select-none"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          onClick={() => isEditMode && setShowMoodPicker(!showMoodPicker)}
          style={{ cursor: isEditMode ? 'pointer' : 'default' }}
          title={isEditMode ? '點擊切換心情' : ''}
        >
          {currentMood.emoji}
        </motion.div>

        {/* 心情描述 */}
        <p className="text-xs mb-1" style={{ color: currentMood.color, opacity: 0.8 }}>
          {currentMood.description}
        </p>

        {/* 自定義標籤 */}
        {isEditingLabel ? (
          <input
            autoFocus
            className="bg-transparent text-center outline-none w-full text-sm"
            style={{
              color: 'var(--text-primary)',
              fontFamily: '"Noto Serif TC", serif',
            }}
            value={content.label}
            onChange={e => onUpdate({ content: { ...content, label: e.target.value } })}
            onBlur={() => setIsEditingLabel(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingLabel(false)}
          />
        ) : (
          <p
            className="text-sm text-center leading-snug"
            style={{
              color: 'var(--text-primary)',
              fontFamily: '"Noto Serif TC", serif',
              cursor: isEditMode ? 'text' : 'default',
            }}
            onDoubleClick={() => isEditMode && setIsEditingLabel(true)}
            title={isEditMode ? '雙擊編輯標籤' : ''}
          >
            {content.label}
          </p>
        )}

        {/* 心情選擇器 */}
        {showMoodPicker && isEditMode && (
          <motion.div
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1 p-2 rounded-xl"
            style={{
              background: 'rgba(15,10,40,0.9)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)',
              zIndex: 20,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {(Object.keys(WEATHER_MOODS) as WeatherMood[]).map(mood => (
              <button
                key={mood}
                className="text-lg hover:scale-125 transition-transform"
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate({ content: { ...content, mood } })
                  setShowMoodPicker(false)
                }}
                title={WEATHER_MOODS[mood].description}
              >
                {WEATHER_MOODS[mood].emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </BaseWidget>
  )
}

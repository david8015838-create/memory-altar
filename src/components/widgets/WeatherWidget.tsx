import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Widget, WeatherContent, WeatherMood } from '../../types'
import { WEATHER_MOODS } from '../../constants/themes'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
  onBringToFront: () => void
}

export function WeatherWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = widget.content as WeatherContent
  const [showPicker, setShowPicker] = useState(false)
  const [editingLabel, setEditingLabel] = useState(false)
  const mood = WEATHER_MOODS[content.mood]

  // A2: close picker when leaving edit mode
  useEffect(() => { if (!isEditMode) setShowPicker(false) }, [isEditMode])

  const block = (e: React.SyntheticEvent) => e.stopPropagation()

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

        {/* 心情選擇器 — 顯示在 widget 上方，不會被裁切 */}
        <AnimatePresence>
          {showPicker && isEditMode && (
            <motion.div
              className="absolute flex gap-1 p-2 rounded-xl flex-wrap justify-center"
              style={{
                bottom: 'calc(100% + 8px)',
                left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15,10,40,0.95)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                minWidth: 200,
              }}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              onMouseDown={block}
              onMouseUp={block}
              onPointerDown={block}
              onPointerUp={block}
            >
              {(Object.keys(WEATHER_MOODS) as WeatherMood[]).map(m => (
                <button
                  key={m}
                  className="rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
                  style={{ width: 48, height: 48, background: content.mood === m ? `${WEATHER_MOODS[m].color}30` : 'transparent' }}
                  onClick={e => { block(e); onUpdate({ content: { ...content, mood: m } }); setShowPicker(false) }}
                >
                  <span style={{ fontSize: 22 }}>{WEATHER_MOODS[m].emoji}</span>
                  <span style={{ fontSize: 8, color: WEATHER_MOODS[m].color }}>{WEATHER_MOODS[m].description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji — 點擊開啟選擇器 */}
        <motion.div
          className="text-4xl mb-2 select-none"
          animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ cursor: isEditMode ? 'pointer' : 'default' }}
          title={isEditMode ? '點擊換心情' : ''}
          onClick={e => { block(e); if (isEditMode) setShowPicker(v => !v) }}
        >
          {mood.emoji}
        </motion.div>

        <p className="text-xs mb-1" style={{ color: mood.color, opacity: 0.8 }}>{mood.description}</p>

        {/* 標籤 — 選取時可直接編輯 */}
        {isEditMode && isSelected ? (
          editingLabel ? (
            <input
              autoFocus
              className="bg-transparent text-center outline-none w-full text-sm"
              style={{
                color: 'var(--text-primary)',
                fontFamily: '"Noto Serif TC", serif',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
              }}
              value={content.label}
              onChange={e => onUpdate({ content: { ...content, label: e.target.value } })}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingLabel(false)}
              onMouseDown={block}
              onClick={block}
            />
          ) : (
            <button
              className="text-sm text-center rounded-lg px-2 py-1 w-full"
              style={{
                color: 'var(--text-primary)',
                fontFamily: '"Noto Serif TC", serif',
                background: 'rgba(255,255,255,0.06)',
                border: '1px dashed rgba(255,255,255,0.2)',
              }}
              onClick={e => { block(e); setEditingLabel(true) }}
            >
              {content.label || '點擊輸入心情'}
            </button>
          )
        ) : (
          <p className="text-sm text-center leading-snug" style={{ color: 'var(--text-primary)', fontFamily: '"Noto Serif TC", serif' }}>
            {content.label}
          </p>
        )}

        {isEditMode && isSelected && (
          <p className="mt-2" style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>點擊圖示換心情</p>
        )}
      </div>
    </BaseWidget>
  )
}

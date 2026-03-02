import { useState, useRef, useEffect } from 'react'
import type { Widget, StickerContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
   onBringToFront: () => void
}

const COLOR_PRESETS = [
  { bg: 'rgba(255,255,255,0.12)', text: '#ffffff' },
  { bg: 'rgba(251,207,232,0.2)',  text: '#fce7f3' },
  { bg: 'rgba(253,230,138,0.2)',  text: '#fef3c7' },
  { bg: 'rgba(187,247,208,0.2)',  text: '#dcfce7' },
  { bg: 'rgba(199,210,254,0.2)',  text: '#e0e7ff' },
  { bg: 'rgba(254,202,202,0.2)',  text: '#fee2e2' },
]

export function StickerWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate,  onBringToFront }: Props) {
  const content = widget.content as StickerContent
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={100} minHeight={60}>
      <div className="w-full h-full relative overflow-hidden" style={{
        borderRadius: 12,
        background: content.backgroundColor,
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }} onDoubleClick={() => isEditMode && setIsEditing(true)}>
        {isEditing ? (
          <textarea ref={textareaRef} className="w-full h-full bg-transparent resize-none outline-none p-3 leading-relaxed"
            style={{ fontFamily: '"Noto Serif TC", serif', fontSize: content.fontSize, color: content.color }}
            value={content.text}
            onChange={e => onUpdate({ content: { ...content, text: e.target.value } })}
            onBlur={() => setIsEditing(false)} />
        ) : (
          <div className="w-full h-full p-3 flex items-center justify-center overflow-hidden leading-relaxed"
            style={{ fontFamily: '"Noto Serif TC", serif', fontSize: content.fontSize, color: content.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'center', cursor: isEditMode ? 'text' : 'default' }}
            title={isEditMode ? '雙擊編輯' : ''}>
            {content.text}
          </div>
        )}
        {/* 顏色 + 字大小（選取時顯示） */}
        {isEditMode && isSelected && !isEditing && (
          <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between px-1.5">
            <div className="flex gap-0.5">
              {COLOR_PRESETS.map((p, i) => (
                <button key={i} className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform flex-shrink-0"
                  style={{ background: p.bg }}
                  onClick={e => { e.stopPropagation(); onUpdate({ content: { ...content, backgroundColor: p.bg, color: p.text } }) }} />
              ))}
            </div>
            <div className="flex gap-0.5">
              {[14, 18, 24, 32].map(fs => (
                <button key={fs} className="w-5 h-5 rounded text-center hover:bg-white/20 transition-colors"
                  style={{ fontSize: 8, color: content.color, fontWeight: content.fontSize === fs ? 700 : 400 }}
                  onClick={e => { e.stopPropagation(); onUpdate({ content: { ...content, fontSize: fs } }) }}>
                  {fs}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  )
}

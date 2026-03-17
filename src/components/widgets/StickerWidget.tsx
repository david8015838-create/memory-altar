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
  { bg: 'rgba(251,207,232,0.25)', text: '#fce7f3' },
  { bg: 'rgba(253,230,138,0.25)', text: '#fef3c7' },
  { bg: 'rgba(187,247,208,0.25)', text: '#dcfce7' },
  { bg: 'rgba(199,210,254,0.25)', text: '#e0e7ff' },
  { bg: 'rgba(254,202,202,0.25)', text: '#fee2e2' },
]
const FONT_SIZES = [14, 18, 24, 32]

export function StickerWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = (widget.content ?? { text: '', fontSize: 18, color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.12)', showBorder: true }) as StickerContent
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // 阻止所有事件冒泡（防止 canvas 干擾）
  const block = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  const showBorder = content.showBorder !== false  // 預設顯示

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={100} minHeight={60}>

      {/* Widget 主體 */}
      <div className="w-full h-full relative" style={{
        borderRadius: 12,
        background: showBorder ? content.backgroundColor : 'transparent',
        border: showBorder ? '1px solid rgba(255,255,255,0.15)' : 'none',
        backdropFilter: showBorder ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: showBorder ? 'blur(12px)' : 'none',
        boxShadow: showBorder ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {isEditing ? (
          <textarea ref={textareaRef}
            className="w-full h-full bg-transparent resize-none outline-none p-3 leading-relaxed"
            style={{ fontFamily: '"Noto Serif TC", serif', fontSize: content.fontSize, color: content.color }}
            value={content.text}
            onChange={e => onUpdate({ content: { ...content, text: e.target.value } })}
            onBlur={() => setIsEditing(false)}
            onMouseDown={block}
            onClick={block}
          />
        ) : (
          <div
            className="w-full h-full p-3 flex items-center justify-center leading-relaxed overflow-hidden"
            style={{
              fontFamily: '"Noto Serif TC", serif', fontSize: content.fontSize,
              color: content.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              textAlign: 'center', cursor: isEditMode ? 'pointer' : 'default',
              textShadow: showBorder ? 'none' : '0 1px 12px rgba(0,0,0,0.7)',
            }}
            onDoubleClick={() => isEditMode && setIsEditing(true)}
          >
            {content.text}
          </div>
        )}
      </div>

      {/* 浮動控制列（選取 + 編輯模式時顯示在 widget 上方） */}
      {isEditMode && isSelected && !isEditing && (
        <div
          className="absolute rounded-xl p-2"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%', transform: 'translateX(-50%)',
            minWidth: 220,
            background: 'rgba(8,6,24,0.97)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            zIndex: 30,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
          }}
          onMouseDown={block}
          onMouseUp={block}
          onPointerDown={block}
          onPointerUp={block}
        >
          {/* 顏色色塊 */}
          <div className="flex items-center gap-2 justify-center mb-2">
            {COLOR_PRESETS.map((p, i) => (
              <button key={i}
                className="rounded-full flex-shrink-0 transition-transform active:scale-90"
                style={{
                  width: 28, height: 28,
                  background: p.bg,
                  border: content.backgroundColor === p.bg
                    ? '2.5px solid #fff'
                    : '2px solid rgba(255,255,255,0.2)',
                }}
                onClick={e => { block(e); onUpdate({ content: { ...content, backgroundColor: p.bg, color: p.text } }) }}
              />
            ))}
          </div>

          {/* 字體大小 + 框切換 + 編輯按鈕 */}
          <div className="flex items-center justify-between gap-1">
            {/* 字體大小 */}
            <div className="flex gap-1">
              {FONT_SIZES.map((fs, idx) => (
                <button key={fs}
                  className="rounded-lg flex items-center justify-center font-bold"
                  style={{
                    width: 34, height: 34,
                    background: content.fontSize === fs ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                    color: content.fontSize === fs ? '#fff' : 'var(--text-secondary)',
                    fontSize: 9 + idx * 2,
                    fontFamily: '"Noto Serif TC", serif',
                  }}
                  onClick={e => { block(e); onUpdate({ content: { ...content, fontSize: fs } }) }}
                >A</button>
              ))}
            </div>

            {/* 邊框切換 */}
            <button
              className="rounded-lg text-xs"
              style={{
                height: 34, minWidth: 40, paddingInline: 6,
                background: showBorder ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
                border: showBorder ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: showBorder ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onClick={e => { block(e); onUpdate({ content: { ...content, showBorder: !showBorder } }) }}
            >{showBorder ? '有框' : '無框'}</button>

            {/* 編輯文字 */}
            <button
              className="rounded-lg text-xs"
              style={{
                height: 34, minWidth: 40, paddingInline: 6,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
              }}
              onClick={e => { block(e); setIsEditing(true) }}
            >✏️</button>
          </div>
        </div>
      )}
    </BaseWidget>
  )
}

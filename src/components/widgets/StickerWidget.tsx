// ============================================================
// StickerWidget - 手寫感文字貼紙
// 雙擊進入編輯模式，支援字體大小調整
// ============================================================

import { useState, useRef, useEffect } from 'react'
import type { Widget, StickerContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget
  isEditMode: boolean
  onUpdate: (changes: Partial<Widget>) => void
  onDelete: () => void
  onBringToFront: () => void
}

// 預設貼紙顏色（背景/文字搭配）
const COLOR_PRESETS = [
  { bg: 'rgba(255,255,255,0.12)', text: '#ffffff' },  // 透明白
  { bg: 'rgba(251,207,232,0.2)',  text: '#fce7f3' },  // 粉紅
  { bg: 'rgba(253,230,138,0.2)',  text: '#fef3c7' },  // 暖黃
  { bg: 'rgba(187,247,208,0.2)',  text: '#dcfce7' },  // 嫩綠
  { bg: 'rgba(199,210,254,0.2)',  text: '#e0e7ff' },  // 薰衣草
  { bg: 'rgba(254,202,202,0.2)',  text: '#fee2e2' },  // 珊瑚紅
]

export function StickerWidget({ widget, isEditMode, onUpdate, onDelete, onBringToFront }: Props) {
  const content = widget.content as StickerContent
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (isEditMode) setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onBringToFront={onBringToFront}
      minWidth={100}
      minHeight={60}
    >
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          borderRadius: '12px',
          background: content.backgroundColor,
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* 文字本體 */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="w-full h-full bg-transparent resize-none outline-none p-3 leading-relaxed"
            style={{
              fontFamily: '"Noto Serif TC", serif',
              fontSize: content.fontSize,
              color: content.color,
            }}
            value={content.text}
            onChange={e => onUpdate({ content: { ...content, text: e.target.value } })}
            onBlur={handleBlur}
          />
        ) : (
          <div
            className="w-full h-full p-3 flex items-center justify-center overflow-hidden leading-relaxed"
            style={{
              fontFamily: '"Noto Serif TC", serif',
              fontSize: content.fontSize,
              color: content.color,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textAlign: 'center',
              cursor: isEditMode ? 'text' : 'default',
            }}
            title={isEditMode ? '雙擊編輯文字' : ''}
          >
            {content.text}
          </div>
        )}

        {/* 顏色選擇器（編輯模式顯示） */}
        {isEditMode && !isEditing && (
          <div className="absolute bottom-1 right-1 flex gap-1">
            {COLOR_PRESETS.map((preset, i) => (
              <button
                key={i}
                className="w-4 h-4 rounded-full border border-white/30 hover:scale-125 transition-transform"
                style={{ background: preset.bg }}
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate({
                    content: {
                      ...content,
                      backgroundColor: preset.bg,
                      color: preset.text,
                    }
                  })
                }}
                title="切換顏色"
              />
            ))}
          </div>
        )}

        {/* 字體大小調整（編輯模式顯示） */}
        {isEditMode && !isEditing && (
          <div className="absolute top-1 right-1 flex items-center gap-1">
            <button
              className="w-5 h-5 rounded text-xs flex items-center justify-center hover:bg-white/20 transition-colors"
              style={{ color: content.color }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate({ content: { ...content, fontSize: Math.max(10, content.fontSize - 2) } })
              }}
            >
              A-
            </button>
            <button
              className="w-5 h-5 rounded text-xs flex items-center justify-center hover:bg-white/20 transition-colors"
              style={{ color: content.color }}
              onClick={(e) => {
                e.stopPropagation()
                onUpdate({ content: { ...content, fontSize: Math.min(48, content.fontSize + 2) } })
              }}
            >
              A+
            </button>
          </div>
        )}
      </div>
    </BaseWidget>
  )
}

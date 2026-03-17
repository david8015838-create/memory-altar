// ============================================================
// DrawingWidget - 顯示已儲存的手繪作品（支援邊框切換）
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import type { Widget, DrawingContent } from '../../types'
import { BaseWidget } from './BaseWidget'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
  onBringToFront: () => void
}

export function DrawingWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = (widget.content ?? { imageUrl: null, caption: '', showBorder: true }) as DrawingContent
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)

  const showBorder = content.showBorder !== false   // 預設顯示
  const block = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <>
      <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
        onSelect={onSelect} onDeselect={onDeselect}
        onUpdate={onUpdate} onBringToFront={onBringToFront}
        minWidth={160} minHeight={160}>

        {/* 邊框切換按鈕（選取時顯示在 widget 上方） */}
        {isEditMode && isSelected && (
          <div
            className="absolute flex gap-2"
            style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
            onMouseDown={block}
            onMouseUp={block}
            onPointerDown={block}
            onPointerUp={block}
          >
            <button
              className="rounded-xl text-xs px-3"
              style={{
                height: 34,
                background: showBorder ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
                border: showBorder ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: showBorder ? 'var(--accent)' : 'var(--text-secondary)',
                backdropFilter: 'blur(20px)',
                whiteSpace: 'nowrap',
              }}
              onClick={e => { block(e); onUpdate({ content: { ...content, showBorder: !showBorder } }) }}
            >
              {showBorder ? '有背景框' : '無背景框'}
            </button>
          </div>
        )}

        <div className="w-full h-full flex flex-col" style={{
          borderRadius: showBorder ? 12 : 0,
          overflow: 'hidden',
          border: showBorder ? '1px solid var(--glass-border)' : 'none',
          background: showBorder ? '#1a1a2e' : 'transparent',
          boxShadow: showBorder ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        }}>
          <div className="flex-1 relative overflow-hidden">
            {content.imageUrl ? (
              <>
                <img
                  src={content.imageUrl} alt="手繪"
                  className="w-full h-full object-contain" draggable={false}
                  style={!showBorder ? { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' } : {}}
                />
                {!isEditMode && (
                  <button
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <ZoomIn size={24} className="text-white" />
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: '#555' }}>
                <span className="text-sm">手繪作品</span>
              </div>
            )}
          </div>

          {/* 說明文字（有框時才顯示） */}
          {showBorder && (
            <div className="px-2 py-1.5 flex-shrink-0">
              {editingCaption ? (
                <input
                  autoFocus
                  className="w-full bg-transparent outline-none text-center"
                  style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)' }}
                  value={content.caption}
                  onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
                  onBlur={() => setEditingCaption(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)}
                  onMouseDown={block}
                  onClick={block}
                />
              ) : (
                <p
                  className="text-center truncate"
                  style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)', cursor: isEditMode ? 'text' : 'default' }}
                  onDoubleClick={() => isEditMode && setEditingCaption(true)}
                >
                  {content.caption || (isEditMode ? '雙擊輸入說明' : '')}
                </p>
              )}
            </div>
          )}
        </div>
      </BaseWidget>

      {/* 燈箱 */}
      <AnimatePresence>
        {lightboxOpen && content.imageUrl && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img
              src={content.imageUrl} className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
              onClick={() => setLightboxOpen(false)}>
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================
// DrawingWidget - 顯示已儲存的手繪作品
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

export function DrawingWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate,  onBringToFront }: Props) {
  const content = widget.content as DrawingContent
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)

  return (
    <>
      <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
        onSelect={onSelect} onDeselect={onDeselect}
        onUpdate={onUpdate} onBringToFront={onBringToFront}
        minWidth={160} minHeight={160}>
        <div className="w-full h-full flex flex-col" style={{
          borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--glass-border)',
          background: '#1a1a2e',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div className="flex-1 relative overflow-hidden">
            {content.imageUrl ? (
              <>
                <img src={content.imageUrl} alt="手繪" className="w-full h-full object-contain" draggable={false} />
                {!isEditMode && (
                  <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                    onClick={() => setLightboxOpen(true)}>
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
          {/* 說明 */}
          <div className="px-2 py-1.5 flex-shrink-0">
            {editingCaption ? (
              <input autoFocus className="w-full bg-transparent outline-none text-center"
                style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)' }}
                value={content.caption}
                onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
                onBlur={() => setEditingCaption(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)} />
            ) : (
              <p className="text-center truncate"
                style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)', cursor: isEditMode ? 'text' : 'default' }}
                onDoubleClick={() => isEditMode && setEditingCaption(true)}>
                {content.caption || (isEditMode ? '雙擊輸入說明' : '')}
              </p>
            )}
          </div>
        </div>
      </BaseWidget>

      <AnimatePresence>
        {lightboxOpen && content.imageUrl && (
          <motion.div className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}>
            <motion.img src={content.imageUrl} className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={e => e.stopPropagation()} />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
              onClick={() => setLightboxOpen(false)}><X size={22} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

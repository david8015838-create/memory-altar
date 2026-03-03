// ============================================================
// PhotoWidget - 多風格照片 Widget
// 支援：拍立得、方形、圓形、底片格
// 每款都有下方說明文字
// ============================================================

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ZoomIn, X } from 'lucide-react'
import type { Widget, PhotoContent, PhotoStyle } from '../../types'
import { BaseWidget } from './BaseWidget'
import { uploadFile, isSupabaseConfigured } from '../../lib/supabase'

interface Props {
  widget: Widget
  isEditMode: boolean
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onUpdate: (changes: Partial<Widget>) => void
  onBringToFront: () => void
}

const STYLE_LABELS: Record<PhotoStyle, string> = {
  polaroid: '拍立得', square: '方框', round: '圓形', film: '底片'
}

export function PhotoWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = widget.content as PhotoContent
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    let url: string | null = null
    if (isSupabaseConfigured) url = await uploadFile(file, widget.space_id, 'photos')
    if (!url) url = await fileToBase64(file)
    if (url) onUpdate({ content: { ...content, imageUrl: url } })
    setUploading(false)
    e.target.value = ''
  }

  const isRound = content.style === 'round'
  const isFilm = content.style === 'film'
  const isPolaroid = content.style === 'polaroid'

  const containerStyle: React.CSSProperties = {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    ...(isRound ? { borderRadius: '50%' } : { borderRadius: isPolaroid ? 4 : 12 }),
    ...(isPolaroid ? { background: 'rgba(255,255,255,0.95)', padding: '10px 10px 0' }
                   : isFilm ? { background: '#111', border: '3px solid #222' }
                   : { background: 'rgba(15,10,40,0.7)', border: '1px solid var(--glass-border)' }),
  }

  const imgAreaStyle: React.CSSProperties = {
    flex: 1, position: 'relative', overflow: 'hidden', minHeight: '65%',
    ...(isRound ? { borderRadius: '50%' }
                : isFilm ? { margin: '4px 8px', borderRadius: 2 }
                : {}),
    background: '#222',
  }

  // 底片孔裝飾
  const FilmHoles = () => isFilm ? (
    <div className="flex justify-between px-2 py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-sm" style={{ background: '#333' }} />
      ))}
    </div>
  ) : null

  return (
    <>
      <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
        onSelect={onSelect} onDeselect={onDeselect}
        onUpdate={onUpdate} onBringToFront={onBringToFront}
        minWidth={140} minHeight={180}>
        <div style={containerStyle}>
          {isFilm && <FilmHoles />}

          {/* 圖片區 */}
          <div style={imgAreaStyle}>
            {content.imageUrl ? (
              <>
                <img src={content.imageUrl} alt={content.caption}
                  className="w-full h-full object-cover" draggable={false}
                  style={isRound ? { borderRadius: '50%' } : {}} />
                {!isEditMode && (
                  <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setLightboxOpen(true)}>
                    <ZoomIn size={24} className="text-white drop-shadow" />
                  </button>
                )}
              </>
            ) : (
              <button className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ color: '#888' }}
                onClick={() => isEditMode && fileInputRef.current?.click()}
                disabled={!isEditMode}>
                {uploading ? (
                  <motion.div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                ) : (
                  <><Camera size={24} />{isEditMode && <span className="text-xs">點擊上傳</span>}</>
                )}
              </button>
            )}
          </div>

          {isFilm && <FilmHoles />}

          {/* 說明文字（非圓形才顯示） */}
          {!isRound && (
            <div className="px-2 py-1.5 flex-shrink-0" style={{ minHeight: 32 }}>
              {editingCaption ? (
                <input autoFocus
                  className="w-full bg-transparent outline-none text-center"
                  style={{
                    fontFamily: '"Noto Serif TC", serif', fontSize: 11,
                    color: isPolaroid ? '#444' : 'var(--text-secondary)'
                  }}
                  value={content.caption}
                  onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
                  onBlur={() => setEditingCaption(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)} />
              ) : (
                <p className="text-center leading-tight truncate"
                  style={{
                    fontFamily: '"Noto Serif TC", serif', fontSize: 11,
                    color: isPolaroid ? '#555' : 'var(--text-secondary)',
                    cursor: isEditMode ? 'text' : 'default',
                  }}
                  onDoubleClick={() => isEditMode && setEditingCaption(true)}
                  title={isEditMode ? '雙擊編輯說明' : ''}>
                  {content.caption || (isEditMode ? '雙擊輸入說明' : '')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 風格切換（編輯 + 選取時顯示） */}
        {isEditMode && isSelected && (
          <div
            className="absolute -top-9 left-0 flex gap-1"
            style={{ zIndex: 20 }}
            // 阻止事件冒泡到 BaseWidget，否則點按鈕會觸發取消選取
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
          >
            {(Object.keys(STYLE_LABELS) as PhotoStyle[]).map(s => (
              <button key={s}
                className="px-2 py-1 rounded-lg text-xs"
                style={{
                  background: content.style === s ? 'var(--accent)' : 'rgba(0,0,0,0.85)',
                  color: content.style === s ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                  minHeight: 28, // 手機觸控目標
                }}
                onClick={e => {
                  e.stopPropagation()
                  onUpdate({ content: { ...content, style: s } })
                }}>
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </BaseWidget>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {/* 燈箱 */}
      <AnimatePresence>
        {lightboxOpen && content.imageUrl && (
          <motion.div className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}>
            <motion.img src={content.imageUrl} alt={content.caption}
              className="max-w-[92vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
              style={isRound ? { borderRadius: '50%' } : {}}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={e => e.stopPropagation()} />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"
              onClick={() => setLightboxOpen(false)}><X size={22} /></button>
            {content.caption && (
              <p className="absolute bottom-8 text-white/70 text-sm"
                style={{ fontFamily: '"Noto Serif TC", serif' }}>{content.caption}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

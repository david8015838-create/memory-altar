// ============================================================
// VideoWidget - 影片上傳與播放 Widget
// ============================================================

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Video } from 'lucide-react'
import type { Widget, VideoContent } from '../../types'
import { BaseWidget } from './BaseWidget'
import { uploadFile, isSupabaseConfigured } from '../../lib/supabase'

interface Props {
  widget: Widget; isEditMode: boolean; isSelected: boolean
  onSelect: () => void; onDeselect: () => void
  onUpdate: (c: Partial<Widget>) => void
   onBringToFront: () => void
}

const MAX_VIDEO_MB = 50

export function VideoWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate,  onBringToFront }: Props) {
  const content = widget.content as VideoContent
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setSizeError(true); return }
    setSizeError(false)
    setUploading(true)

    let url: string | null = null
    if (isSupabaseConfigured) {
      url = await uploadFile(file, widget.space_id, 'videos')
    } else {
      // 本機模式：用 object URL（不跨裝置）
      url = URL.createObjectURL(file)
    }
    if (url) onUpdate({ content: { ...content, videoUrl: url } })
    setUploading(false)
    e.target.value = ''
  }

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={200} minHeight={180}>
      <div className="w-full h-full flex flex-col" style={{
        borderRadius: 12, overflow: 'hidden',
        background: '#0a0a0a',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* 影片區 */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '70%' }}>
          {content.videoUrl ? (
            <video src={content.videoUrl} controls
              className="w-full h-full object-contain bg-black"
              style={{ display: 'block' }}
              playsInline preload="metadata" />
          ) : (
            <button className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ color: '#666' }}
              onClick={() => isEditMode && fileInputRef.current?.click()}
              disabled={!isEditMode}>
              {uploading ? (
                <motion.div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <>
                  <Video size={28} />
                  {isEditMode && <span className="text-xs">點擊上傳影片</span>}
                  {sizeError && <span className="text-xs text-red-400">影片需小於 {MAX_VIDEO_MB}MB</span>}
                </>
              )}
            </button>
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

      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
    </BaseWidget>
  )
}

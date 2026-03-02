// ============================================================
// PolaroidWidget - 拍立得照片 Widget
// 點擊上傳照片（Supabase Storage），雙擊放大
// ============================================================

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ZoomIn, X } from 'lucide-react'
import type { Widget, PolaroidContent } from '../../types'
import { BaseWidget } from './BaseWidget'
import { uploadPhoto, isSupabaseConfigured } from '../../lib/supabase'

interface Props {
  widget: Widget
  isEditMode: boolean
  onUpdate: (changes: Partial<Widget>) => void
  onDelete: () => void
  onBringToFront: () => void
}

export function PolaroidWidget({ widget, isEditMode, onUpdate, onDelete, onBringToFront }: Props) {
  const content = widget.content as PolaroidContent
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditingCaption, setIsEditingCaption] = useState(false)

  // ── 處理照片上傳 ──────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    let imageUrl: string | null = null

    if (isSupabaseConfigured) {
      // 上傳到 Supabase Storage
      imageUrl = await uploadPhoto(file, widget.space_id)
    }

    if (!imageUrl) {
      // 降級到 base64（本機模式）
      imageUrl = await fileToBase64(file)
    }

    if (imageUrl) {
      onUpdate({ content: { ...content, imageUrl } })
    }

    setIsUploading(false)
    e.target.value = '' // 重置 input
  }

  return (
    <>
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onBringToFront={onBringToFront}
        minWidth={160}
        minHeight={200}
      >
        {/* 拍立得外框 */}
        <div
          className="w-full h-full flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '4px',
            padding: '10px 10px 0 10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* 照片區域 */}
          <div
            className="relative flex-1 overflow-hidden rounded-sm"
            style={{ backgroundColor: '#e8e4df', minHeight: '60%' }}
          >
            {content.imageUrl ? (
              <>
                <img
                  src={content.imageUrl}
                  alt={content.caption}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* 放大按鈕（非編輯模式） */}
                {!isEditMode && (
                  <button
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <ZoomIn size={28} className="text-white drop-shadow" />
                  </button>
                )}
              </>
            ) : (
              // 空照片佔位
              <button
                className="w-full h-full flex flex-col items-center justify-center gap-2 transition-colors hover:bg-black/5"
                onClick={() => isEditMode && fileInputRef.current?.click()}
                disabled={!isEditMode}
              >
                {isUploading ? (
                  <motion.div
                    className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <Camera size={28} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {isEditMode ? '點擊上傳照片' : ''}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 說明文字區域（拍立得下方白邊） */}
          <div
            className="py-2 px-1 text-center"
            style={{ minHeight: '20%', flexShrink: 0 }}
          >
            {isEditingCaption ? (
              <input
                autoFocus
                className="w-full text-center outline-none bg-transparent text-gray-700"
                style={{ fontFamily: 'Noto Serif TC, serif', fontSize: 12 }}
                value={content.caption}
                onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
                onBlur={() => setIsEditingCaption(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingCaption(false)}
              />
            ) : (
              <p
                className="text-gray-700 text-center leading-tight cursor-text"
                style={{ fontFamily: 'Noto Serif TC, serif', fontSize: 12 }}
                onDoubleClick={() => isEditMode && setIsEditingCaption(true)}
                title={isEditMode ? '雙擊編輯說明' : ''}
              >
                {content.caption || '點擊上傳照片 📷'}
              </p>
            )}
          </div>
        </div>
      </BaseWidget>

      {/* 隱藏的 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 燈箱放大檢視 */}
      <AnimatePresence>
        {isLightboxOpen && content.imageUrl && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <motion.img
              src={content.imageUrl}
              alt={content.caption}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={24} />
            </button>
            {content.caption && (
              <p className="absolute bottom-8 text-white/80 text-sm" style={{ fontFamily: 'Noto Serif TC, serif' }}>
                {content.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// 輔助：File → base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

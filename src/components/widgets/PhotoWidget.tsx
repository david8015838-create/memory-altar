// ============================================================
// PhotoWidget - 多風格照片 Widget
// 支援：拍立得、方形、圓形、底片格
// 每款都有下方說明文字
// ============================================================

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ZoomIn, X, RotateCcw } from 'lucide-react'
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

// image/* 是跨平台最相容的寫法；額外加副檔名讓 iOS Files app 也能篩選到 .jpg 檔
const ACCEPT = 'image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif'

type UploadStatus = '' | 'compressing' | 'uploading'

export function PhotoWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = (widget.content ?? { imageUrl: null, caption: '', style: 'polaroid' }) as PhotoContent
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('')
  const [uploadError, setUploadError] = useState('')
  const [editingCaption, setEditingCaption] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('compressing')
    setUploadError('')
    let imageUrl: string | null = null

    try {
      // Step 1: compress to Blob (more memory-efficient than base64)
      const blob = await compressToBlob(file, 1600, 0.88)

      if (isSupabaseConfigured) {
        // Step 2a: upload directly to Supabase Storage → get permanent URL
        setUploadStatus('uploading')
        imageUrl = await uploadFile(blob, widget.space_id, 'photos')
      }

      // Step 2b: if Supabase not configured OR upload failed, fall back to base64
      if (!imageUrl) {
        if (isSupabaseConfigured) {
          // Supabase configured but upload failed → warn user
          console.warn('[PhotoUpload] Supabase upload failed, falling back to local base64')
          setUploadError('雲端上傳失敗，已暫存本機（建議稍後按 ☁️ 同步）')
        }
        setUploadStatus('compressing')
        const passes: [number, number][] = [
          [1600, 0.88],
          [1200, 0.78],
          [900,  0.68],
          [600,  0.60],
        ]
        for (const [maxW, q] of passes) {
          try {
            const candidate = await compressToJpeg(file, maxW, q)
            if (candidate.length <= 700_000) { imageUrl = candidate; break }
            if (!imageUrl) imageUrl = candidate
          } catch (err) {
            console.error(`[PhotoUpload] pass ${maxW}px failed:`, err)
          }
        }
      }
    } catch (err) {
      console.error('[PhotoUpload] failed:', err)
    }

    if (imageUrl) {
      onUpdate({ content: { ...content, imageUrl } })
      setUploadError('')
    } else {
      setUploadError('上傳失敗，請確認網路後重試')
    }
    setUploadStatus('')
    e.target.value = ''
  }

  const isUploading = uploadStatus !== ''
  const statusLabel = uploadStatus === 'uploading' ? '上傳中…' : '壓縮中…'

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

                {/* 瀏覽模式：點圖放大 */}
                {!isEditMode && (
                  <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                    onClick={() => setLightboxOpen(true)}>
                    <ZoomIn size={24} className="text-white drop-shadow" />
                  </button>
                )}

                {/* 編輯 + 選取：更換按鈕 + 上傳錯誤提示 */}
                {isEditMode && isSelected && (
                  <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}
                    onMouseDown={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}>
                    {uploadError && (
                      <p style={{ fontSize: 9, color: '#fb923c', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: 6, maxWidth: 120, textAlign: 'right' }}>
                        {uploadError}
                      </p>
                    )}
                    {isUploading ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--text-secondary)' }}>
                        <motion.div className="w-3 h-3 border border-gray-500 border-t-white rounded-full"
                          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        <span style={{ fontSize: 10 }}>{statusLabel}</span>
                      </div>
                    ) : (
                      <label
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer"
                        style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', position: 'relative' }}
                        onMouseDown={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}>
                        <RotateCcw size={10} /> 更換
                        <input ref={replaceInputRef} type="file" accept={ACCEPT}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 0 }}
                          onChange={handleUpload} />
                      </label>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                style={{ color: '#888' }}>
                <Camera size={24} />
                {uploadError && (
                  <p style={{ fontSize: 10, color: '#fb923c', textAlign: 'center', padding: '0 8px' }}>
                    {uploadError}
                  </p>
                )}
                {isEditMode && (
                  isUploading ? (
                    <div className="flex items-center gap-1.5" style={{ color: '#aaa', fontSize: 11 }}>
                      <motion.div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                      {statusLabel}
                    </div>
                  ) : (
                    <label
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', border: '1px solid rgba(255,255,255,0.12)' }}
                      onMouseDown={e => e.stopPropagation()}
                      onPointerDown={e => e.stopPropagation()}>
                      點擊上傳照片
                      <input ref={fileInputRef} type="file" accept={ACCEPT}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 0 }}
                        onChange={handleUpload} />
                    </label>
                  )
                )}
              </div>
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
                  minHeight: 28,
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

/**
 * 壓縮圖片為 JPEG Blob（直接用於上傳，比 base64 更省記憶體）
 * 支援 JPEG / PNG / WebP / HEIC，同時修正 EXIF 旋轉方向
 */
async function compressToBlob(file: File, maxWidth = 1600, quality = 0.88): Promise<Blob> {
  const orientation = await readExifOrientation(file)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width  = img.naturalWidth  || img.width
      let height = img.naturalHeight || img.height
      if (!width || !height) { reject(new Error('image has zero dimensions')); return }

      const safeMax = Math.min(maxWidth, 4096)
      const scale = Math.min(1, safeMax / Math.max(width, height))
      width  = Math.round(width  * scale)
      height = Math.round(height * scale)

      const swapped = orientation >= 5 && orientation <= 8
      const canvasW = swapped ? height : width
      const canvasH = swapped ? width  : height

      const canvas = document.createElement('canvas')
      canvas.width  = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('canvas unavailable')); return }

      applyExifTransform(ctx, orientation, canvasW, canvasH)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(blob => {
        // 像素資料已複製到 Blob，現在才安全 revoke
        URL.revokeObjectURL(objectUrl)
        canvas.width = 1; canvas.height = 1
        if (!blob) { reject(new Error('toBlob failed')); return }
        resolve(blob)
      }, 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('image load failed')) }
    img.src = objectUrl
  })
}

/**
 * 將任意圖片壓縮成 JPEG base64（fallback：Supabase 不可用時使用）
 */
async function compressToJpeg(file: File, maxWidth = 1600, quality = 0.88): Promise<string> {
  const orientation = await readExifOrientation(file)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width  = img.naturalWidth  || img.width
      let height = img.naturalHeight || img.height
      if (!width || !height) { reject(new Error('image has zero dimensions')); return }
      const safeMax = Math.min(maxWidth, 4096)
      const scale = Math.min(1, safeMax / Math.max(width, height))
      width  = Math.round(width  * scale)
      height = Math.round(height * scale)

      const swapped = orientation >= 5 && orientation <= 8
      const canvasW = swapped ? height : width
      const canvasH = swapped ? width  : height

      const canvas = document.createElement('canvas')
      canvas.width  = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas unavailable')); return }

      applyExifTransform(ctx, orientation, canvasW, canvasH)
      ctx.drawImage(img, 0, 0, width, height)

      // 像素已 drawImage，revokeObjectURL 後再讀 canvas 仍安全
      URL.revokeObjectURL(objectUrl)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      canvas.width = 1; canvas.height = 1
      if (!dataUrl || dataUrl === 'data:,') { reject(new Error('toDataURL failed')); return }
      resolve(dataUrl)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('image load failed')) }
    img.src = objectUrl
  })
}

/** 從 JPEG 的 EXIF 讀取 Orientation tag（其他格式回傳 1） */
function readExifOrientation(file: File): Promise<number> {
  return new Promise(resolve => {
    if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.name.toLowerCase().match(/\.jpe?g$/)) {
      resolve(1); return
    }
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const view = new DataView(e.target!.result as ArrayBuffer)
        if (view.getUint16(0, false) !== 0xFFD8) { resolve(1); return }
        let offset = 2
        while (offset + 4 <= view.byteLength) {
          const marker = view.getUint16(offset, false)
          offset += 2
          if (marker === 0xFFE1) {
            offset += 2  // 跳過長度欄位
            if (view.getUint32(offset, false) !== 0x45786966) { resolve(1); return }
            const tiff = offset + 6
            const little = view.getUint16(tiff, false) === 0x4949
            const ifdOff = view.getUint32(tiff + 4, little)
            const ifd = tiff + ifdOff
            const numEntries = view.getUint16(ifd, little)
            for (let i = 0; i < numEntries && i < 64; i++) {
              const entry = ifd + 2 + i * 12
              if (view.getUint16(entry, little) === 0x0112) {
                resolve(view.getUint16(entry + 8, little))
                return
              }
            }
            resolve(1); return
          }
          if ((marker & 0xFF00) !== 0xFF00) break
          if (marker === 0xFFDA) break
          const segLen2 = view.getUint16(offset, false)
          offset += segLen2
        }
      } catch { /**/ }
      resolve(1)
    }
    reader.onerror = () => resolve(1)
    reader.readAsArrayBuffer(file.slice(0, 65536))
  })
}

/** 根據 EXIF Orientation 旋轉 canvas context */
function applyExifTransform(ctx: CanvasRenderingContext2D, orientation: number, w: number, h: number) {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, w, 0); break
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break
    case 4: ctx.transform(1, 0, 0, -1, 0, h); break
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break
    case 7: ctx.transform(0, -1, -1, 0, h, w); break
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break
  }
}

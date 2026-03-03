// ============================================================
// VideoWidget v2 - 支援 YouTube / 直接連結 / 檔案上傳
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Link, Upload, RotateCcw, AlertCircle } from 'lucide-react'
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

/** 解析 YouTube URL，回傳嵌入用 URL 或 null */
function parseYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1).split('?')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.has('v')) {
        id = u.searchParams.get('v')!
      } else if (u.pathname.includes('/embed/')) {
        id = u.pathname.split('/embed/')[1].split('?')[0]
      } else if (u.pathname.includes('/shorts/')) {
        id = u.pathname.split('/shorts/')[1].split('?')[0]
      }
    }
    return id ? `https://www.youtube.com/embed/${id}?playsinline=1` : null
  } catch {
    return null
  }
}

function isYouTubeEmbed(url: string) {
  return url.includes('youtube.com/embed/')
}

const block = (e: React.SyntheticEvent) => e.stopPropagation()

export function VideoWidget({ widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront }: Props) {
  const content = widget.content as VideoContent
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [error, setError] = useState('')
  const [editingCaption, setEditingCaption] = useState(false)

  // ── URL 輸入確認 ─────────────────────────────────
  const handleUrlConfirm = () => {
    const raw = urlInput.trim()
    if (!raw) return
    setError('')

    // 優先判斷 YouTube
    const ytEmbed = parseYouTubeEmbed(raw)
    if (ytEmbed) {
      onUpdate({ content: { ...content, videoUrl: ytEmbed } })
      setUrlInput('')
      setShowUrlInput(false)
      return
    }

    // 其他 URL（直接影片連結）
    try {
      new URL(raw) // 檢驗格式
      onUpdate({ content: { ...content, videoUrl: raw } })
      setUrlInput('')
      setShowUrlInput(false)
    } catch {
      setError('無效的網址，請確認格式正確')
    }
  }

  // ── 檔案上傳 ─────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`影片需小於 ${MAX_VIDEO_MB}MB，建議改用 YouTube 連結`)
      e.target.value = ''
      return
    }

    setError('')
    setUploading(true)

    let url: string | null = null
    if (isSupabaseConfigured) {
      url = await uploadFile(file, widget.space_id, 'videos')
      if (!url) setError('上傳失敗，請檢查網路或改用 YouTube 連結')
    } else {
      // 本機模式
      url = URL.createObjectURL(file)
    }

    if (url) onUpdate({ content: { ...content, videoUrl: url } })
    setUploading(false)
    e.target.value = ''
  }

  // ── 清除影片 ─────────────────────────────────────
  const handleClear = () => {
    onUpdate({ content: { ...content, videoUrl: null } })
    setError('')
    setUrlInput('')
    setShowUrlInput(false)
  }

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={220} minHeight={180}>

      <div className="w-full h-full flex flex-col" style={{
        borderRadius: 12, overflow: 'hidden',
        background: '#080808',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>

        {/* ── 影片播放區 ── */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '70%' }}>
          {content.videoUrl ? (
            <>
              {isYouTubeEmbed(content.videoUrl) ? (
                // YouTube iframe
                <iframe
                  src={content.videoUrl}
                  className="w-full h-full"
                  style={{ border: 'none', display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // 直接影片
                <video
                  src={content.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  style={{ display: 'block' }}
                  onMouseDown={block}
                  onPointerDown={block}
                />
              )}

              {/* 編輯模式：更換 / 清除按鈕 */}
              {isEditMode && isSelected && (
                <div
                  className="absolute top-1 right-1 flex gap-1"
                  onMouseDown={block} onPointerDown={block}
                >
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(0,0,0,0.75)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
                    onClick={e => { block(e); handleClear() }}
                  >
                    <RotateCcw size={10} /> 更換
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── 空白狀態：輸入區 ── */
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
              {uploading ? (
                <motion.div className="w-7 h-7 border-2 border-gray-600 border-t-white rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <>
                  <Video size={26} style={{ color: '#444' }} />

                  {/* URL 輸入模式 */}
                  <AnimatePresence>
                    {showUrlInput && (
                      <motion.div
                        className="w-full flex flex-col gap-1.5"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        onMouseDown={block} onPointerDown={block}
                      >
                        <input
                          autoFocus
                          className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                          placeholder="YouTube 或直接影片連結…"
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUrlConfirm(); if (e.key === 'Escape') setShowUrlInput(false) }}
                        />
                        <div className="flex gap-1">
                          <button
                            className="flex-1 py-1 rounded-lg text-xs"
                            style={{ background: `var(--accent)`, color: '#000', fontWeight: 600 }}
                            onClick={handleUrlConfirm}
                          >確認</button>
                          <button
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
                            onClick={() => setShowUrlInput(false)}
                          >取消</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showUrlInput && isEditMode && (
                    <div className="flex flex-col items-center gap-1.5 w-full" onMouseDown={block} onPointerDown={block}>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs w-full justify-center"
                        style={{ background: `var(--accent)25`, border: `1px solid var(--accent)50`, color: 'var(--accent)' }}
                        onClick={() => { setShowUrlInput(true); setError('') }}
                      >
                        <Link size={12} /> YouTube / 網址連結
                      </button>
                      {/* label 直接綁定 input，iOS Safari 相簿選擇器最可靠的方法 */}
                      <label
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs w-full justify-center cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)' }}
                      >
                        <Upload size={12} /> 從相簿上傳（&lt;{MAX_VIDEO_MB}MB）
                        {/* input 覆蓋整個 label 區域，opacity:0 觸碰即可選擇 */}
                        <input
                          type="file"
                          accept="video/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          style={{ fontSize: 0 }}
                          onChange={handleUpload}
                        />
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* 錯誤提示 */}
              {error && (
                <div className="flex items-start gap-1 mt-1 px-1" onMouseDown={block} onPointerDown={block}>
                  <AlertCircle size={11} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                  <span className="text-center" style={{ fontSize: 10, color: '#f87171', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 說明文字 ── */}
        <div className="px-2 py-1.5 flex-shrink-0" onMouseDown={block} onPointerDown={block}>
          {editingCaption ? (
            <input
              autoFocus
              className="w-full bg-transparent outline-none text-center"
              style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)' }}
              value={content.caption}
              onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
              onBlur={() => setEditingCaption(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)}
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
      </div>

    </BaseWidget>
  )
}

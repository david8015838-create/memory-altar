// ============================================================
// VideoWidget v3 - YouTube 黑膠動畫 + 上傳 fallback
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, Upload, RotateCcw, AlertCircle } from 'lucide-react'
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
const block = (e: React.SyntheticEvent) => e.stopPropagation()

// ── YouTube URL 解析 ────────────────────────────────────────
function parseYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1).split('?')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.has('v'))             id = u.searchParams.get('v')!
      else if (u.pathname.includes('/embed/')) id = u.pathname.split('/embed/')[1].split('?')[0]
      else if (u.pathname.includes('/shorts/'))id = u.pathname.split('/shorts/')[1].split('?')[0]
    }
    return id ? `https://www.youtube.com/embed/${id}?playsinline=1` : null
  } catch { return null }
}

function isYouTubeEmbed(url: string) { return url.includes('youtube.com/embed/') }

function getYouTubeWatchUrl(embedUrl: string) {
  const id = embedUrl.split('/embed/')[1]?.split('?')[0] || ''
  return `https://www.youtube.com/watch?v=${id}`
}

// ── 黑膠唱片元件 ────────────────────────────────────────────
function VinylRecord({ videoUrl }: { videoUrl: string }) {
  const [spinning, setSpinning] = useState(false)
  const watchUrl = getYouTubeWatchUrl(videoUrl)

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 p-2"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #050508 100%)' }}
    >
      {/* 唱片 */}
      <motion.div
        className="relative rounded-full flex-shrink-0 cursor-pointer"
        style={{
          width: 'min(68%, 150px)',
          aspectRatio: '1',
          background: [
            'radial-gradient(circle at 50% 50%,',
            '#3a3a3a 0%, #1a1a1a 15%,',
            '#0d0d0d 40%, #1c1c1c 55%,',
            '#0a0a0a 70%, #151515 85%, #050505 100%)',
          ].join(''),
          boxShadow: spinning
            ? '0 4px 40px rgba(167,139,250,0.35), 0 2px 12px rgba(0,0,0,0.9)'
            : '0 4px 24px rgba(0,0,0,0.9)',
        }}
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={spinning
          ? { duration: 2.5, repeat: Infinity, ease: 'linear' }
          : { type: 'spring', stiffness: 80, damping: 15 }
        }
        onClick={() => setSpinning(v => !v)}
        onMouseDown={block} onPointerDown={block}
      >
        {/* SVG 刻槽 */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
          {[14, 20, 26, 32, 37, 42, 47].map(r => (
            <circle key={r} cx="50" cy="50" r={r}
              fill="none" stroke="white" strokeWidth="0.5" opacity="0.07" />
          ))}
          {/* 反光 */}
          <ellipse cx="36" cy="36" rx="10" ry="6"
            fill="white" opacity="0.035" transform="rotate(-20 50 50)" />
        </svg>

        {/* 中央標籤 */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: '33%', height: '33%',
            top: '33.5%', left: '33.5%',
            background: 'radial-gradient(circle at 40% 38%, #cc1010, #770000)',
            boxShadow: '0 2px 10px rgba(180,0,0,0.5)',
          }}
        >
          {/* Play 三角形 */}
          <svg viewBox="0 0 24 24" width="45%" height="45%" fill="white" opacity="0.9">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* 中心軸孔 */}
        <div className="absolute rounded-full bg-black"
          style={{ width: '5.5%', height: '5.5%', top: '47.25%', left: '47.25%' }} />

        {/* 唱針（靜態，偏右） */}
        <div className="absolute pointer-events-none"
          style={{ top: '-4%', right: '-6%', width: '34%', height: '60%' }}>
          <div style={{
            width: 3, height: '100%',
            background: 'linear-gradient(to bottom, #aaa, #555)',
            borderRadius: 2,
            transform: 'rotate(18deg)',
            transformOrigin: 'top center',
            boxShadow: '1px 1px 4px rgba(0,0,0,0.6)',
          }} />
        </div>
      </motion.div>

      {/* 控制列 */}
      <div className="flex items-center gap-1.5" onMouseDown={block} onPointerDown={block}>
        <button
          className="px-3 py-1 rounded-full text-xs transition-all"
          style={{
            background: spinning ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
            border: spinning ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: spinning ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
          }}
          onClick={() => setSpinning(v => !v)}
        >
          {spinning ? '⏸ 停轉' : '▶ 轉動'}
        </button>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 rounded-full text-xs"
          style={{
            background: 'rgba(204,0,0,0.18)',
            border: '1px solid rgba(204,0,0,0.4)',
            color: '#ff8080',
            textDecoration: 'none',
          }}
          onClick={e => e.stopPropagation()}
        >
          ↗ YouTube
        </a>
      </div>
    </div>
  )
}

// ── 主元件 ──────────────────────────────────────────────────
export function VideoWidget({
  widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront
}: Props) {
  const content = widget.content as VideoContent

  const [uploading,    setUploading]    = useState(false)
  const [urlInput,     setUrlInput]     = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [error,        setError]        = useState('')
  const [editingCaption, setEditingCaption] = useState(false)

  // ── URL 確認 ───────────────────────────────────────────────
  const handleUrlConfirm = () => {
    const raw = urlInput.trim()
    if (!raw) return
    setError('')
    const ytEmbed = parseYouTubeEmbed(raw)
    if (ytEmbed) {
      onUpdate({ content: { ...content, videoUrl: ytEmbed } })
      setUrlInput(''); setShowUrlInput(false)
      return
    }
    try {
      new URL(raw)
      onUpdate({ content: { ...content, videoUrl: raw } })
      setUrlInput(''); setShowUrlInput(false)
    } catch { setError('無效的網址，請確認格式正確') }
  }

  // ── 檔案上傳 ───────────────────────────────────────────────
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
      if (!url) {
        // 雲端失敗 → fallback 本地 objectURL
        url = URL.createObjectURL(file)
        setError('雲端上傳失敗，已暫存本地（換裝置影片將消失，建議改用 YouTube）')
      }
    } else {
      url = URL.createObjectURL(file)
    }
    if (url) onUpdate({ content: { ...content, videoUrl: url } })
    setUploading(false)
    e.target.value = ''
  }

  const handleClear = () => {
    onUpdate({ content: { ...content, videoUrl: null } })
    setError(''); setUrlInput(''); setShowUrlInput(false)
  }

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={220} minHeight={200}>

      <div className="w-full h-full flex flex-col" style={{
        borderRadius: 12, overflow: 'hidden',
        background: '#050508',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>

        {/* ── 影片 / 黑膠 / 空白區 ── */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '72%' }}>
          {content.videoUrl ? (
            <>
              {isYouTubeEmbed(content.videoUrl) ? (
                <VinylRecord videoUrl={content.videoUrl} />
              ) : (
                <video
                  src={content.videoUrl}
                  controls playsInline preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  onMouseDown={block} onPointerDown={block}
                />
              )}

              {/* 編輯模式：更換按鈕 */}
              {isEditMode && isSelected && (
                <div className="absolute top-1 right-1 flex gap-1"
                  onMouseDown={block} onPointerDown={block}>
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
            /* ── 空白：輸入區 ── */
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <motion.div className="w-7 h-7 border-2 border-gray-600 border-t-white rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>上傳中…</span>
                </div>
              ) : (
                <>
                  {/* URL 輸入框 */}
                  <AnimatePresence>
                    {showUrlInput && (
                      <motion.div className="w-full flex flex-col gap-1.5"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        onMouseDown={block} onPointerDown={block}>
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
                          <button className="flex-1 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: 'var(--accent)', color: '#000' }}
                            onClick={handleUrlConfirm}>確認</button>
                          <button className="px-3 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
                            onClick={() => setShowUrlInput(false)}>取消</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showUrlInput && isEditMode && (
                    <div className="flex flex-col items-center gap-1.5 w-full"
                      onMouseDown={block} onPointerDown={block}>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs w-full justify-center"
                        style={{ background: `var(--accent)22`, border: `1px solid var(--accent)50`, color: 'var(--accent)' }}
                        onClick={() => { setShowUrlInput(true); setError('') }}
                      >
                        <Link size={12} /> YouTube / 網址連結
                      </button>

                      {/* 使用 label 覆蓋法，iOS Safari 相簿上傳最可靠 */}
                      <label
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs w-full justify-center cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)' }}
                      >
                        <Upload size={12} /> 從相簿上傳（&lt;{MAX_VIDEO_MB}MB）
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

              {error && (
                <div className="flex items-start gap-1 px-1" onMouseDown={block} onPointerDown={block}>
                  <AlertCircle size={11} style={{ color: '#fb923c', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 10, color: '#fb923c', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 說明 ── */}
        <div className="px-2 py-1.5 flex-shrink-0" onMouseDown={block} onPointerDown={block}>
          {editingCaption ? (
            <input autoFocus
              className="w-full bg-transparent outline-none text-center"
              style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'var(--text-secondary)' }}
              value={content.caption}
              onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
              onBlur={() => setEditingCaption(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)}
            />
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
  )
}

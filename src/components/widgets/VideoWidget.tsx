// ============================================================
// VideoWidget v5 - 完全無框 + 可拖曳 + base64 跨裝置同步
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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

const MAX_BASE64_MB    = 5     // 小於此大小時 base64 編碼同步到 DB
const block = (e: React.SyntheticEvent) => e.stopPropagation()

// ── File → data URL（base64 同步到 Supabase DB，跨裝置可用）
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Read error'))
    reader.readAsDataURL(file)
  })
}

// ── YouTube IFrame API 模組級狀態（多個實例共用）──────────
let _ytApiReady = false
const _ytQueue: Array<() => void> = []

function loadYouTubeAPI(onReady: () => void) {
  if (_ytApiReady && (window as any).YT?.Player) { onReady(); return }
  _ytQueue.push(onReady)
  if (!document.getElementById('yt-iframe-api')) {
    const prev = (window as any).onYouTubeIframeAPIReady as (() => void) | undefined
    ;(window as any).onYouTubeIframeAPIReady = () => {
      prev?.()
      _ytApiReady = true
      _ytQueue.splice(0).forEach(f => f())
    }
    const s = document.createElement('script')
    s.id = 'yt-iframe-api'
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  }
}

// ── YouTube URL 解析 ────────────────────────────────────────
function parseYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1).split('?')[0]
    } else if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.has('v'))              id = u.searchParams.get('v')!
      else if (u.pathname.includes('/embed/'))  id = u.pathname.split('/embed/')[1].split('?')[0]
      else if (u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1].split('?')[0]
    }
    return id ? `https://www.youtube.com/embed/${id}?playsinline=1` : null
  } catch { return null }
}

function isYouTubeEmbed(url: string) { return url.includes('youtube.com/embed/') }
function getVideoId(embedUrl: string) { return embedUrl.split('/embed/')[1]?.split('?')[0] || '' }

// ── 黑膠唱片（YouTube 背景音樂）────────────────────────────
function VinylRecord({ videoUrl }: { videoUrl: string }) {
  const [spinning, setSpinning] = useState(false)
  const playerRef = useRef<any>(null)
  const videoId   = getVideoId(videoUrl)
  const divId     = useRef(`yt-p-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    let destroyed = false
    loadYouTubeAPI(() => {
      if (destroyed) return
      const YT = (window as any).YT
      playerRef.current = new YT.Player(divId.current, {
        videoId,
        // loop:1 + playlist:videoId = YouTube 官方單曲循環設定
        playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1, loop: 1, playlist: videoId },
        events: {
          // onStateChange 備用：播放結束（state=0）時重播
          onStateChange: (ev: any) => { if (ev.data === 0) playerRef.current?.playVideo() },
          onError: (ev: any) => console.warn('YT error:', ev.data),
        },
      })
    })
    return () => {
      destroyed = true
      try { playerRef.current?.destroy() } catch { /**/ }
      playerRef.current = null
    }
  }, [videoId])

  const handleToggle = () => {
    const next = !spinning
    setSpinning(next)
    try { next ? playerRef.current?.playVideo() : playerRef.current?.pauseVideo() } catch { /**/ }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #050508 100%)' }}>

      {createPortal(
        <div id={divId.current} style={{ position: 'fixed', left: -9999, top: -9999, width: 320, height: 180, pointerEvents: 'none', opacity: 0 }} />,
        document.body
      )}

      {/* 唱片 */}
      <motion.div
        className="relative rounded-full flex-shrink-0 cursor-pointer"
        style={{
          width: 'min(68%, 150px)', aspectRatio: '1',
          background: 'radial-gradient(circle at 50% 50%, #3a3a3a 0%, #1a1a1a 15%, #0d0d0d 40%, #1c1c1c 55%, #0a0a0a 70%, #050505 100%)',
          boxShadow: spinning ? '0 4px 40px rgba(167,139,250,0.35), 0 2px 12px rgba(0,0,0,0.9)' : '0 4px 24px rgba(0,0,0,0.9)',
        }}
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={spinning ? { duration: 2.5, repeat: Infinity, ease: 'linear' } : { type: 'spring', stiffness: 80, damping: 15 }}
        onClick={handleToggle}
        onMouseDown={block} onPointerDown={block}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
          {[14, 20, 26, 32, 37, 42, 47].map(r => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="white" strokeWidth="0.5" opacity="0.07" />
          ))}
          <ellipse cx="36" cy="36" rx="10" ry="6" fill="white" opacity="0.035" transform="rotate(-20 50 50)" />
        </svg>
        <div className="absolute rounded-full flex items-center justify-center"
          style={{ width: '33%', height: '33%', top: '33.5%', left: '33.5%', background: 'radial-gradient(circle at 40% 38%, #cc1010, #770000)', boxShadow: '0 2px 10px rgba(180,0,0,0.5)' }}>
          <svg viewBox="0 0 24 24" width="45%" height="45%" fill="white" opacity="0.9">
            {spinning ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /> : <path d="M8 5v14l11-7z" />}
          </svg>
        </div>
        <div className="absolute rounded-full bg-black" style={{ width: '5.5%', height: '5.5%', top: '47.25%', left: '47.25%' }} />
        <div className="absolute pointer-events-none" style={{ top: '-4%', right: '-6%', width: '34%', height: '60%' }}>
          <div style={{ width: 3, height: '100%', background: 'linear-gradient(to bottom, #aaa, #555)', borderRadius: 2, transform: 'rotate(18deg)', transformOrigin: 'top center' }} />
        </div>
      </motion.div>

      {/* 控制列 */}
      <div className="flex items-center gap-1.5" onMouseDown={block} onPointerDown={block}>
        <button className="px-3 py-1 rounded-full text-xs transition-all"
          style={{
            background: spinning ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
            border: spinning ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: spinning ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
          }}
          onClick={handleToggle}>
          {spinning ? '⏸ 暫停' : '▶ 播放'}
        </button>
      </div>
    </div>
  )
}

// ── 主元件 ──────────────────────────────────────────────────
export function VideoWidget({
  widget, isEditMode, isSelected, onSelect, onDeselect, onUpdate, onBringToFront
}: Props) {
  const content = (widget.content ?? { videoUrl: null, caption: '' }) as VideoContent

  const [uploading,      setUploading]      = useState(false)
  const [urlInput,       setUrlInput]       = useState('')
  const [showUrlInput,   setShowUrlInput]   = useState(false)
  const [error,          setError]          = useState('')
  const [editingCaption, setEditingCaption] = useState(false)
  const [videoError,     setVideoError]     = useState(false)

  // A5: clear error when video URL changes
  useEffect(() => { setVideoError(false) }, [content.videoUrl])

  // ── URL 確認 ──────────────────────────────────────────────
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

  // ── 檔案上傳：Supabase Storage → base64（<5MB）→ 報錯 ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)

    let url: string | null = null

    if (isSupabaseConfigured) {
      // 嘗試上傳到 Supabase Storage（跨裝置最佳解）
      url = await uploadFile(file, widget.space_id, 'videos')

      if (!url) {
        // Storage 失敗：對小檔案改用 base64 存入 DB（仍可跨裝置同步）
        if (file.size <= MAX_BASE64_MB * 1024 * 1024) {
          try {
            url = await fileToDataUrl(file)
            setError(`雲端上傳失敗，已用 base64 暫存（${(file.size/1024/1024).toFixed(1)}MB）。建議改用 YouTube 以節省流量。`)
          } catch {
            setError('影片讀取失敗，請改用 YouTube 連結。')
          }
        } else {
          setError(`上傳失敗（${(file.size/1024/1024).toFixed(1)}MB）。請確認 Supabase Storage 設定，或改用 YouTube 連結。`)
        }
      }
    } else {
      // 未設定 Supabase：objectURL 暫存（僅限本裝置）
      url = URL.createObjectURL(file)
      setError('目前為本地模式，影片僅此裝置可見。')
    }

    if (url) onUpdate({ content: { ...content, videoUrl: url } })
    setUploading(false)
    e.target.value = ''
  }

  const handleClear = () => {
    // B8: revoke blob URL to free memory
    if (content.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(content.videoUrl)
    }
    onUpdate({ content: { ...content, videoUrl: null } })
    setError(''); setUrlInput(''); setShowUrlInput(false); setVideoError(false)
  }

  const hasVideo = Boolean(content.videoUrl)
  const isYT     = hasVideo && isYouTubeEmbed(content.videoUrl!)

  return (
    <BaseWidget widget={widget} isEditMode={isEditMode} isSelected={isSelected}
      onSelect={onSelect} onDeselect={onDeselect}
      onUpdate={onUpdate} onBringToFront={onBringToFront}
      minWidth={220} minHeight={160}>

      {hasVideo ? (
        /* ── 有影片：完全無框，直接顯示內容 ── */
        <>
          {isYT ? (
            /* YouTube 黑膠 */
            <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
              <VinylRecord videoUrl={content.videoUrl!} />
            </div>
          ) : (
            /* 上傳影片：始終顯示 controls（iOS Safari 需要 controls 才能渲染畫面）
               編輯模式用 pointerEvents:none 阻止操作，讓 BaseWidget 接管拖曳 */
            <>
              <video
                key={content.videoUrl}
                src={content.videoUrl!}
                playsInline
                preload="metadata"
                controls
                crossOrigin="anonymous"
                onError={() => setVideoError(true)}
                onLoadStart={() => setVideoError(false)}
                style={{
                  display: videoError ? 'none' : 'block',
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  background: 'transparent',
                  // edit mode: 停用讓 BaseWidget 接管拖曳；view mode: 啟用讓原生控制列可點
                  pointerEvents: isEditMode ? 'none' : 'auto',
                }}
              />
              {videoError && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 8,
                }}>
                  <span style={{ fontSize: 28 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: '#fb923c' }}>影片格式不支援</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0 12px' }}>
                    舊版上傳的影片需重新上傳
                  </span>
                  {isEditMode && (
                    <button
                      style={{ marginTop: 4, fontSize: 11, padding: '4px 12px', borderRadius: 8, background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); handleClear() }}
                    >重新上傳</button>
                  )}
                </div>
              )}
            </>
          )}

          {/* 更換按鈕（編輯 + 選中） */}
          {isEditMode && isSelected && (
            <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}
              onMouseDown={block} onPointerDown={block}>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
                onClick={e => { block(e); handleClear() }}>
                <RotateCcw size={10} /> 更換
              </button>
            </div>
          )}

          {/* 說明文字（底部漸層覆蓋）
              view mode 下 pointerEvents:none，讓點擊穿透到影片控制列 */}
          {(content.caption || (isEditMode && isSelected)) && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', pointerEvents: isEditMode ? 'auto' : 'none' }}
              onMouseDown={isEditMode ? block : undefined} onPointerDown={isEditMode ? block : undefined}>
              {editingCaption ? (
                <input autoFocus
                  className="w-full bg-transparent outline-none text-center"
                  style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}
                  value={content.caption}
                  onChange={e => onUpdate({ content: { ...content, caption: e.target.value } })}
                  onBlur={() => setEditingCaption(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingCaption(false)}
                />
              ) : (
                <p className="text-center truncate"
                  style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0, cursor: isEditMode ? 'text' : 'default' }}
                  onDoubleClick={() => isEditMode && setEditingCaption(true)}>
                  {content.caption || (isEditMode ? '雙擊輸入說明' : '')}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        /* ── 空白狀態：帶框輸入區 ── */
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: 12,
          background: '#050508',
          border: '1px solid var(--glass-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <motion.div className="w-7 h-7 border-2 border-gray-600 border-t-white rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>上傳中…</span>
            </div>
          ) : (
            <>
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
                    onClick={() => { setShowUrlInput(true); setError('') }}>
                    <Link size={12} /> YouTube / 網址連結
                  </button>
                  <label
                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs w-full justify-center cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)' }}>
                    <Upload size={12} /> 從相簿上傳
                    <input type="file" accept="video/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ fontSize: 0 }}
                      onChange={handleUpload} />
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
    </BaseWidget>
  )
}

// ============================================================
// DrawingCanvas - 手繪畫布 Modal
// 支援滑鼠和觸控，可選顏色/粗細/橡皮擦
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Undo2, Trash2, Check, Eraser, Pen } from 'lucide-react'
import type { Theme } from '../../types'
import { uploadFile } from '../../lib/supabase'

const COLORS = ['#ffffff', '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#000000']
const SIZES = [2, 5, 12, 24]

interface Props {
  theme: Theme
  spaceId: string
  onSave: (imageUrl: string) => void
  onClose: () => void
}

export function DrawingCanvas({ theme, spaceId, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#ffffff')
  const [size, setSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [saving, setSaving] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // 初始化黑色背景
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left), y: (touch.clientY - rect.top) }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    setHistory(prev => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [])

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    saveSnapshot()
    setIsDrawing(true)
    lastPos.current = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.arc(lastPos.current.x, lastPos.current.y, (isEraser ? size * 2 : size) / 2, 0, Math.PI * 2)
    ctx.fillStyle = isEraser ? '#1a1a2e' : color
    ctx.fill()
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !lastPos.current) return
    const pos = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = isEraser ? '#1a1a2e' : color
    ctx.lineWidth = isEraser ? size * 2 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => { setIsDrawing(false); lastPos.current = null }

  const undo = () => {
    if (history.length === 0) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const last = history[history.length - 1]
    ctx.putImageData(last, 0, 0)
    setHistory(prev => prev.slice(0, -1))
  }

  const clear = () => {
    saveSnapshot()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
  }

  const handleSave = async () => {
    setSaving(true)
    const canvas = canvasRef.current!
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'))
    let url: string | null = null
    url = await uploadFile(blob, spaceId, 'drawings')
    if (!url) {
      // fallback: data URL
      url = canvas.toDataURL('image/png')
    }
    onSave(url)
    setSaving(false)
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 5000, background: 'rgba(0,0,0,0.9)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* 頂部工具列 */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{
        background: theme.glassBackground, borderBottom: `1px solid ${theme.glassBorder}`
      }}>
        <button onClick={onClose}><X size={20} style={{ color: theme.textSecondary }} /></button>
        <span className="font-medium text-sm" style={{ color: theme.textPrimary, fontFamily: '"Noto Serif TC", serif' }}>
          手繪畫布
        </span>
        <div className="flex-1" />

        {/* 顏色 */}
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button key={c} className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: color === c && !isEraser ? '#fff' : 'transparent', flexShrink: 0 }}
              onClick={() => { setColor(c); setIsEraser(false) }} />
          ))}
        </div>

        {/* 筆刷粗細 */}
        <div className="flex gap-1 mx-2">
          {SIZES.map(s => (
            <button key={s} className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: size === s && !isEraser ? theme.accent : 'rgba(255,255,255,0.1)' }}
              onClick={() => { setSize(s); setIsEraser(false) }}>
              <div className="rounded-full bg-white" style={{ width: Math.min(s, 14), height: Math.min(s, 14) }} />
            </button>
          ))}
        </div>

        {/* 橡皮擦 */}
        <button className="p-1.5 rounded-lg"
          style={{ background: isEraser ? theme.accent : 'rgba(255,255,255,0.1)' }}
          onClick={() => setIsEraser(!isEraser)}>
          <Eraser size={16} style={{ color: '#fff' }} />
        </button>

        {/* 撤銷 */}
        <button className="p-1.5 rounded-lg hover:bg-white/10" onClick={undo}>
          <Undo2 size={16} style={{ color: theme.textSecondary }} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-white/10" onClick={clear}>
          <Trash2 size={16} style={{ color: theme.textSecondary }} />
        </button>

        {/* 儲存 */}
        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
          style={{ background: theme.accent, color: '#fff' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave} disabled={saving}
        >
          {saving ? (
            <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          ) : <><Check size={14} /> 完成</>}
        </motion.button>
      </div>

      {/* 畫布 */}
      <canvas ref={canvasRef}
        className="flex-1 w-full touch-none"
        style={{ cursor: isEraser ? 'cell' : 'crosshair', display: 'block' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />

      {/* 目前工具提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.6)', color: theme.textSecondary, fontSize: 12 }}>
        {isEraser ? <Eraser size={12} /> : <Pen size={12} />}
        <span>{isEraser ? '橡皮擦' : '畫筆'} · 粗細 {size}px</span>
      </div>
    </motion.div>
  )
}

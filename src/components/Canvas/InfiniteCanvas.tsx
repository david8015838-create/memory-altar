// ============================================================
// InfiniteCanvas - 支援拖動平移的無限畫布
// 容納所有 Memory Widget，支援滑鼠滾輪縮放
// ============================================================

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Widget, AppMode, Theme } from '../../types'
import { GridOverlay } from './GridOverlay'
import { PolaroidWidget } from '../widgets/PolaroidWidget'
import { StickerWidget } from '../widgets/StickerWidget'
import { TimerWidget } from '../widgets/TimerWidget'
import { WeatherWidget } from '../widgets/WeatherWidget'

interface Props {
  widgets: Widget[]
  mode: AppMode
  theme: Theme
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void
  onDeleteWidget: (id: string) => void
  onBringToFront: (id: string) => void
  // 取得畫布當前中心位置（用於新增 widget 時定位）
  onCanvasRef: (ref: HTMLDivElement | null) => void
}

export function InfiniteCanvas({
  widgets,
  mode,
  theme,
  onUpdateWidget,
  onDeleteWidget,
  onBringToFront,
  onCanvasRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ── 畫布平移（用滑鼠中鍵或右鍵拖動） ──────────
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panStartOffset = useRef({ x: 0, y: 0 })

  // 中鍵/空格鍵按住拖動
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 中鍵（button === 1）或 Alt + 左鍵觸發平移
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      panStartOffset.current = { ...canvasOffset }
    }
  }, [canvasOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setCanvasOffset({
      x: panStartOffset.current.x + dx,
      y: panStartOffset.current.y + dy,
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  // 滾輪縮放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(2, Math.max(0.3, prev * delta)))
  }, [])

  // Touch 平移（手機支援）
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 雙指捏合縮放
    if (e.touches.length === 2 && lastPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / lastPinchDist.current
      setScale(prev => Math.min(2, Math.max(0.3, prev * ratio)))
      lastPinchDist.current = dist
      return
    }

    // 單指不平移（讓 widget 拖動處理）
    lastTouch.current = null
  }, [])

  const isEditMode = mode === 'edit'

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        cursor: isPanning.current ? 'grabbing' : 'default',
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* 畫布本體（平移 + 縮放） */}
      <motion.div
        className="absolute"
        ref={onCanvasRef}
        style={{
          width: '4000px',
          height: '4000px',
          left: `calc(50% - 2000px + ${canvasOffset.x}px)`,
          top: `calc(50% - 2000px + ${canvasOffset.y}px)`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 格線（編輯模式） */}
        <GridOverlay isVisible={isEditMode} accentColor={theme.accent} />

        {/* 所有 Widgets */}
        {widgets.map(widget => {
          const commonProps = {
            key: widget.id,
            widget,
            isEditMode,
            onUpdate: (changes: Partial<Widget>) => onUpdateWidget(widget.id, changes),
            onDelete: () => onDeleteWidget(widget.id),
            onBringToFront: () => onBringToFront(widget.id),
          }

          switch (widget.type) {
            case 'polaroid': return <PolaroidWidget {...commonProps} />
            case 'sticker':  return <StickerWidget  {...commonProps} />
            case 'timer':    return <TimerWidget     {...commonProps} />
            case 'weather':  return <WeatherWidget   {...commonProps} />
            default:         return null
          }
        })}
      </motion.div>

      {/* 縮放指示器 */}
      {isEditMode && scale !== 1 && (
        <div
          className="fixed bottom-20 right-4 text-xs px-2 py-1 rounded-full"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}

// ============================================================
// InfiniteCanvas v2 - 支援選取模式 + 新 Widget 類型
// ============================================================

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Widget, AppMode, Theme } from '../../types'
import { GridOverlay } from './GridOverlay'
import { PhotoWidget } from '../widgets/PhotoWidget'
import { StickerWidget } from '../widgets/StickerWidget'
import { TimerWidget } from '../widgets/TimerWidget'
import { WeatherWidget } from '../widgets/WeatherWidget'
import { VideoWidget } from '../widgets/VideoWidget'
import { DrawingWidget } from '../widgets/DrawingWidget'
import { WidgetActionBar } from '../ui/WidgetActionBar'

interface Props {
  widgets: Widget[]; mode: AppMode; theme: Theme
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void
  onDeleteWidget: (id: string) => void
  onDuplicateWidget: (id: string) => void
  onBringToFront: (id: string) => void
  onCanvasRef: (ref: HTMLDivElement | null) => void
}

export function InfiniteCanvas({ widgets, mode, theme, onUpdateWidget, onDeleteWidget, onDuplicateWidget, onBringToFront, onCanvasRef }: Props) {
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panStartOffset = useRef({ x: 0, y: 0 })
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist = useRef<number | null>(null)

  const selectedWidget = widgets.find(w => w.id === selectedId) || null
  const isEditMode = mode === 'edit'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      panStartOffset.current = { ...canvasOffset }
    }
    // 點擊空白區取消選取
    if (e.button === 0 && !e.altKey) setSelectedId(null)
  }, [canvasOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    setCanvasOffset({ x: panStartOffset.current.x + (e.clientX - panStart.current.x), y: panStartOffset.current.y + (e.clientY - panStart.current.y) })
  }, [])

  const handleMouseUp = useCallback(() => { isPanning.current = false }, [])
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(prev => Math.min(2, Math.max(0.3, prev * (e.deltaY > 0 ? 0.9 : 1.1))))
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setScale(prev => Math.min(2, Math.max(0.3, prev * dist / lastPinchDist.current!)))
      lastPinchDist.current = dist
    }
  }, [])

  const commonProps = (w: Widget) => ({
    widget: w,
    isEditMode,
    isSelected: selectedId === w.id,
    onSelect: () => setSelectedId(w.id),
    onDeselect: () => setSelectedId(null),
    onUpdate: (changes: Partial<Widget>) => onUpdateWidget(w.id, changes),
    onBringToFront: () => onBringToFront(w.id),
  })

  return (
    <>
      <div className="fixed inset-0 overflow-hidden select-none" style={{ zIndex: 1, cursor: isPanning.current ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>

        <motion.div ref={onCanvasRef} className="absolute"
          style={{
            width: 4000, height: 4000,
            left: `calc(50% - 2000px + ${canvasOffset.x}px)`,
            top: `calc(50% - 2000px + ${canvasOffset.y}px)`,
            transform: `scale(${scale})`, transformOrigin: 'center center',
          }}>
          <GridOverlay isVisible={isEditMode} accentColor={theme.accent} />

          {[...widgets].sort((a, b) => a.zIndex - b.zIndex).map(w => {
            const p = commonProps(w)
            switch (w.type) {
              case 'photo':   return <PhotoWidget   key={w.id} {...p} />
              case 'sticker': return <StickerWidget key={w.id} {...p} />
              case 'timer':   return <TimerWidget   key={w.id} {...p} />
              case 'weather': return <WeatherWidget key={w.id} {...p} />
              case 'video':   return <VideoWidget   key={w.id} {...p} />
              case 'drawing': return <DrawingWidget key={w.id} {...p} />
              default:        return null
            }
          })}
        </motion.div>
      </div>

      {/* 選取操作列 */}
      {isEditMode && (
        <WidgetActionBar
          selectedWidget={selectedWidget}
          theme={theme}
          onDelete={() => { if (selectedWidget) { onDeleteWidget(selectedWidget.id); setSelectedId(null) } }}
          onRotateLeft={() => selectedWidget && onUpdateWidget(selectedWidget.id, { rotation: selectedWidget.rotation - 15 })}
          onRotateRight={() => selectedWidget && onUpdateWidget(selectedWidget.id, { rotation: selectedWidget.rotation + 15 })}
          onDuplicate={() => { if (selectedWidget) { onDuplicateWidget(selectedWidget.id); setSelectedId(null) } }}
          onDeselect={() => setSelectedId(null)}
        />
      )}

      {/* 縮放指示 */}
      {isEditMode && Math.abs(scale - 1) > 0.05 && (
        <div className="fixed bottom-20 right-4 text-xs px-2 py-1 rounded-full"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', backdropFilter: 'blur(8px)', zIndex: 100 }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </>
  )
}

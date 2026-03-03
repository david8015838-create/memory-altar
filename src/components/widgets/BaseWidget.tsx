// ============================================================
// BaseWidget v3 - 手動 Pointer 事件拖曳（修正滑鼠黏住 bug）
// 移除 Framer Motion drag prop，改用 onPointerDown/Move/Up
// 這樣子元素 button 的 click 不會觸發拖曳
// ============================================================

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Widget } from '../../types'
import { useCanvasScale } from '../../contexts/CanvasContext'

interface Props {
  widget: Widget
  isEditMode: boolean
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onUpdate: (changes: Partial<Widget>) => void
  onBringToFront: () => void
  children: React.ReactNode
  className?: string
  minWidth?: number
  minHeight?: number
}

export function BaseWidget({
  widget, isEditMode, isSelected, onSelect, onDeselect,
  onUpdate, onBringToFront, children, className = '',
  minWidth = 120, minHeight = 80,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)

  // 讀取畫布縮放比，拖曳時換算螢幕位移 → 畫布位移
  const canvasScale = useCanvasScale()
  const canvasScaleRef = useRef(canvasScale)
  useEffect(() => { canvasScaleRef.current = canvasScale }, [canvasScale])

  const isDraggingRef = useRef(false)       // 當前是否正在拖曳
  const downOnInteractive = useRef(false)    // 按下時是否在 button/input 等上
  const didDrag = useRef(false)              // 是否真的移動了（區分點擊 vs 拖曳）
  const pointerStart = useRef({ x: 0, y: 0 })
  const widgetStart = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return

    // 若按下位置在互動元素上，記錄並跳過拖曳
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, select, [data-no-drag]')) {
      downOnInteractive.current = true
      return
    }

    downOnInteractive.current = false
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    isDraggingRef.current = true
    didDrag.current = false
    setIsDragging(true)
    onBringToFront()

    pointerStart.current = { x: e.clientX, y: e.clientY }
    widgetStart.current = { x: widget.x, y: widget.y }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    didDrag.current = true
    // 除以 canvasScale，確保在縮放後拖曳速度與手指移動一致
    const s = canvasScaleRef.current
    onUpdate({
      x: widgetStart.current.x + (e.clientX - pointerStart.current.x) / s,
      y: widgetStart.current.y + (e.clientY - pointerStart.current.y) / s,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasDragging = isDraggingRef.current
    isDraggingRef.current = false

    if (wasDragging) {
      setIsDragging(false)
      try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /**/ }
    }

    // 沒有移動 + 不是按在互動元素上 → 切換選取
    if (!didDrag.current && isEditMode && !downOnInteractive.current) {
      isSelected ? onDeselect() : onSelect()
    }

    didDrag.current = false
    downOnInteractive.current = false
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsDragging(false)
      try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /**/ }
    }
    didDrag.current = false
    downOnInteractive.current = false
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: widget.x, top: widget.y,
        width: widget.width, height: widget.height,
        rotate: widget.rotation,
        zIndex: isSelected ? 9000 : widget.zIndex,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isEditMode ? 'none' : 'auto',
      }}
      // 阻止 mousedown 冒泡到 InfiniteCanvas（否則每次點 widget 都 deselect）
      onMouseDown={(e) => { if (isEditMode) e.stopPropagation() }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      animate={{
        scale: isDragging ? 1.04 : 1,
        outline: isSelected && isEditMode ? `2px solid var(--accent)` : '2px solid transparent',
        outlineOffset: 2,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Widget 內容 */}
      <div className={`w-full h-full ${className}`}>
        {children}
      </div>

      {/* 縮放把手（選取時顯示） */}
      {isEditMode && isSelected && (
        <div
          data-no-drag
          className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center cursor-se-resize rounded-tl-lg"
          style={{ background: 'var(--accent)', zIndex: 10 }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const startX = e.clientX, startY = e.clientY
            const startW = widget.width, startH = widget.height
            const onMove = (me: PointerEvent) => {
              onUpdate({
                width: Math.max(minWidth, startW + (me.clientX - startX)),
                height: Math.max(minHeight, startH + (me.clientY - startY)),
              })
            }
            const onUp = () => {
              window.removeEventListener('pointermove', onMove)
              window.removeEventListener('pointerup', onUp)
            }
            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp)
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 9L9 1M5 9L9 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </motion.div>
  )
}

// ============================================================
// BaseWidget v7 - B1 事件洩漏修正 + F1 長按選取 + F3 鎖定
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react'
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
  onLongPress?: () => void   // F1: 長按 → 進入編輯並選取
  children: React.ReactNode
  className?: string
  minWidth?: number
  minHeight?: number
}

export function BaseWidget({
  widget, isEditMode, isSelected, onSelect, onDeselect,
  onUpdate, onBringToFront, onLongPress, children, className = '',
  minWidth = 120, minHeight = 80,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)

  const canvasScale    = useCanvasScale()
  const canvasScaleRef = useRef(canvasScale)
  useEffect(() => { canvasScaleRef.current = canvasScale }, [canvasScale])

  const isDraggingRef     = useRef(false)
  const downOnInteractive = useRef(false)
  const didDrag           = useRef(false)
  const pointerStart      = useRef({ x: 0, y: 0 })
  const widgetStart       = useRef({ x: 0, y: 0 })

  // 雙指捏合縮放狀態
  const pinchInitDist = useRef<number | null>(null)
  const pinchInitSize = useRef({ w: 0, h: 0 })

  // F1: 長按 timer（view mode 使用）
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressStartPos = useRef({ x: 0, y: 0 })

  // B1: 追蹤 window listener 以便 cleanup（旋轉 + 縮放把手）
  const rotateListeners = useRef<{ onMove: (e: PointerEvent) => void; onUp: () => void } | null>(null)
  const resizeListeners = useRef<{ onMove: (e: PointerEvent) => void; onUp: () => void } | null>(null)

  // B1: 組件 unmount 時清理所有 window listeners
  useEffect(() => {
    return () => {
      if (rotateListeners.current) {
        window.removeEventListener('pointermove', rotateListeners.current.onMove)
        window.removeEventListener('pointerup',   rotateListeners.current.onUp)
        rotateListeners.current = null
      }
      if (resizeListeners.current) {
        window.removeEventListener('pointermove', resizeListeners.current.onMove)
        window.removeEventListener('pointerup',   resizeListeners.current.onUp)
        resizeListeners.current = null
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  // F3: 鎖定時，在 edit mode 中跳過拖曳但允許選取（以便解鎖）
  const isLocked = Boolean(widget.locked)

  // ── Pointer 拖曳 ────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return
    const target = e.target as HTMLElement
    if (target.closest('button, input, textarea, select, a, [data-no-drag]')) {
      downOnInteractive.current = true
      return
    }
    downOnInteractive.current = false
    if (!isLocked) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      isDraggingRef.current = true
      didDrag.current = false
      setIsDragging(true)
      onBringToFront()
      pointerStart.current = { x: e.clientX, y: e.clientY }
      widgetStart.current  = { x: widget.x,  y: widget.y  }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || pinchInitDist.current !== null) return
    didDrag.current = true
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
    pinchInitDist.current = null
    didDrag.current = false
    downOnInteractive.current = false
  }

  // ── Touch 事件：edit mode 全面截斷冒泡 ──────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditMode) return
    e.stopPropagation()
    if (e.targetTouches.length >= 2 && !isLocked) {
      const t1 = e.targetTouches[0], t2 = e.targetTouches[1]
      pinchInitDist.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      pinchInitSize.current = { w: widget.width, h: widget.height }
      if (isDraggingRef.current) { isDraggingRef.current = false; setIsDragging(false) }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditMode) return
    e.stopPropagation()
    if (e.targetTouches.length >= 2 && pinchInitDist.current !== null && !isLocked) {
      const t1 = e.targetTouches[0], t2 = e.targetTouches[1]
      const ratio = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY) / pinchInitDist.current
      onUpdate({
        width:  Math.max(minWidth,  pinchInitSize.current.w * ratio),
        height: Math.max(minHeight, pinchInitSize.current.h * ratio),
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isEditMode) return
    e.stopPropagation()
    if (e.targetTouches.length < 2) pinchInitDist.current = null
  }

  // ── F1: 長按（view mode）→ 進入編輯並選取 ───────────────
  const handleViewTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isEditMode || !onLongPress) return
    const touch = e.touches[0]
    longPressStartPos.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      onLongPress()
      onSelect()
    }, 500)
  }, [isEditMode, onLongPress, onSelect])

  const handleViewTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isEditMode || !longPressTimer.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - longPressStartPos.current.x
    const dy = touch.clientY - longPressStartPos.current.y
    if (Math.hypot(dx, dy) > 8) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [isEditMode])

  const handleViewTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // ── 旋轉把手 ────────────────────────────────────────────
  const handleRotatePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget as HTMLDivElement
    el.setPointerCapture(e.pointerId)
    const rect = (el.parentElement!).getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    const onMove = (me: PointerEvent) => {
      const angle = Math.atan2(me.clientY - cy, me.clientX - cx) * (180 / Math.PI) + 90
      onUpdate({ rotation: angle })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
      rotateListeners.current = null
    }
    // B1: 先清理舊的 listener
    if (rotateListeners.current) {
      window.removeEventListener('pointermove', rotateListeners.current.onMove)
      window.removeEventListener('pointerup',   rotateListeners.current.onUp)
    }
    rotateListeners.current = { onMove, onUp }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: widget.x, top: widget.y,
        width: widget.width, height: widget.height,
        rotate: widget.rotation,
        zIndex: isSelected ? 9000 : widget.zIndex,
        cursor: isEditMode ? (isLocked ? 'default' : isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isEditMode ? 'none' : 'auto',
      }}
      onMouseDown={(e) => { if (isEditMode) e.stopPropagation() }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTouchStart={isEditMode ? handleTouchStart : handleViewTouchStart}
      onTouchMove={isEditMode ? handleTouchMove : handleViewTouchMove}
      onTouchEnd={isEditMode ? handleTouchEnd : handleViewTouchEnd}
      animate={{
        scale:   isDragging ? 1.04 : 1,
        outline: isSelected && isEditMode ? `2px solid var(--accent)` : '2px solid transparent',
        outlineOffset: 2,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* children wrapper */}
      <div className={`w-full h-full relative ${className}`}>
        {children}
      </div>

      {/* F3: 鎖定指示（左上角小鎖） */}
      {isEditMode && isLocked && (
        <div
          data-no-drag
          style={{
            position: 'absolute', top: -8, left: -8,
            width: 20, height: 20, borderRadius: '50%',
            background: 'rgba(251,146,60,0.9)', // orange
            zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="white">
            <path d="M17 11H7V7a5 5 0 0 1 10 0v4zm-5 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6-9V7A6 6 0 0 0 6 7v4H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1z" />
          </svg>
        </div>
      )}

      {/* ── 編輯把手（選取後且未鎖定才顯示）── */}
      {isEditMode && isSelected && !isLocked && (
        <>
          {/* 旋轉把手（正上方） */}
          <div data-no-drag style={{ position: 'absolute', top: -28, left: 'calc(50% - 0.5px)', width: 1, height: 28, background: 'var(--accent)', opacity: 0.5, pointerEvents: 'none', zIndex: 11 }} />
          <div
            data-no-drag
            style={{
              position: 'absolute', top: -54, left: '50%', transform: 'translateX(-50%)',
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', zIndex: 12, cursor: 'grab',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.5)', touchAction: 'none',
            }}
            onPointerDown={handleRotatePointerDown}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9" /><polyline points="3 4 3 12 11 12" />
            </svg>
          </div>

          {/* 縮放把手（右下角） */}
          <div
            data-no-drag
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: '10px 0 0 0',
              background: 'var(--accent)', zIndex: 12, cursor: 'se-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'none',
            }}
            onPointerDown={(e) => {
              e.stopPropagation(); e.preventDefault()
              const el = e.currentTarget as HTMLDivElement
              el.setPointerCapture(e.pointerId)
              const startX = e.clientX, startY = e.clientY
              const startW = widget.width,  startH = widget.height
              const onMove = (me: PointerEvent) => {
                const s = canvasScaleRef.current
                onUpdate({
                  width:  Math.max(minWidth,  startW + (me.clientX - startX) / s),
                  height: Math.max(minHeight, startH + (me.clientY - startY) / s),
                })
              }
              const onUp = () => {
                window.removeEventListener('pointermove', onMove)
                window.removeEventListener('pointerup',   onUp)
                resizeListeners.current = null
              }
              // B1: 先清理舊的 listener
              if (resizeListeners.current) {
                window.removeEventListener('pointermove', resizeListeners.current.onMove)
                window.removeEventListener('pointerup',   resizeListeners.current.onUp)
              }
              resizeListeners.current = { onMove, onUp }
              window.addEventListener('pointermove', onMove)
              window.addEventListener('pointerup',   onUp)
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 9L9 1M5 9L9 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </>
      )}
    </motion.div>
  )
}

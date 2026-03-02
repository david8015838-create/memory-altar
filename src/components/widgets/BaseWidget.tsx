// ============================================================
// BaseWidget v2 - 選取模式（解決手機/桌面刪除問題）
// 點擊選取 → 底部操作列出現 → 明確的刪除/旋轉按鈕
// ============================================================

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Widget } from '../../types'

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
  const dragStartPos = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)  // 區分點擊 vs 拖動

  return (
    <motion.div
      drag={isEditMode}
      dragMomentum={false}
      dragElastic={0}
      initial={false}
      style={{
        position: 'absolute',
        left: widget.x, top: widget.y,
        width: widget.width, height: widget.height,
        rotate: widget.rotation,
        zIndex: isSelected ? 9000 : widget.zIndex,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isEditMode ? 'none' : 'auto',
      }}
      // 阻止 mousedown 冒泡到 InfiniteCanvas 的 handleMouseDown（否則每次點擊 widget 都會觸發 setSelectedId(null)）
      onMouseDown={(e) => { if (isEditMode) e.stopPropagation() }}
      onDragStart={() => {
        setIsDragging(true)
        didDrag.current = false
        onBringToFront()
        dragStartPos.current = { x: widget.x, y: widget.y }
      }}
      onDrag={() => { didDrag.current = true }}
      onDragEnd={(_, info) => {
        setIsDragging(false)
        if (didDrag.current) {
          onUpdate({
            x: dragStartPos.current.x + info.offset.x,
            y: dragStartPos.current.y + info.offset.y,
          })
        }
      }}
      // 點擊選取（未拖動才觸發，且事件來源必須是 widget 本身）
      onPointerUp={(e) => {
        // 如果點擊來源不是這個 div 本身（是子元素冒泡上來），忽略
        if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button, input, textarea, select')) {
          didDrag.current = false
          return
        }
        if (!didDrag.current && isEditMode) {
          isSelected ? onDeselect() : onSelect()
        }
        didDrag.current = false
      }}
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
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
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

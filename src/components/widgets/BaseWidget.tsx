// ============================================================
// BaseWidget - 所有 Widget 的拖拽/旋轉/縮放外殼
// 使用 Framer Motion drag 實現絲滑拖動
// ============================================================

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, RotateCcw, GripHorizontal } from 'lucide-react'
import type { Widget } from '../../types'

interface Props {
  widget: Widget
  isEditMode: boolean
  onUpdate: (changes: Partial<Widget>) => void
  onDelete: () => void
  onBringToFront: () => void
  children: React.ReactNode
  // 額外 className（各 widget 自訂樣式）
  className?: string
  // 最小尺寸限制
  minWidth?: number
  minHeight?: number
}

export function BaseWidget({
  widget,
  isEditMode,
  onUpdate,
  onDelete,
  onBringToFront,
  children,
  className = '',
  minWidth = 120,
  minHeight = 80,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  // 控制列只在 editMode + hover 時顯示
  const showControls = isEditMode && (isHovered || isDragging)

  return (
    <motion.div
      // ─── Framer Motion 拖拽設定 ───
      drag={isEditMode}
      dragMomentum={false}  // 關閉慣性，精準控制
      dragElastic={0}
      // 初始位置
      initial={false}
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        rotate: widget.rotation,
        zIndex: widget.zIndex,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isEditMode ? 'none' : 'auto',
      }}
      // 拖拽開始：記錄起始位置，置頂
      onDragStart={() => {
        setIsDragging(true)
        onBringToFront()
        dragStartPos.current = { x: widget.x, y: widget.y }
      }}
      // 拖拽結束：更新位置到 state
      onDragEnd={(_, info) => {
        setIsDragging(false)
        onUpdate({
          x: dragStartPos.current.x + info.offset.x,
          y: dragStartPos.current.y + info.offset.y,
        })
      }}
      // 懸停效果
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      // 拖拽中浮起效果
      animate={{
        scale: isDragging ? 1.04 : 1,
        boxShadow: isDragging
          ? '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(167,139,250,0.3)'
          : 'none',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* ─── 控制列（編輯模式 hover 顯示） ─── */}
      {showControls && (
        <motion.div
          className="absolute -top-8 left-0 right-0 flex items-center justify-between px-1"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ zIndex: 10 }}
        >
          {/* 拖動把手 */}
          <div className="flex items-center gap-1">
            <GripHorizontal
              size={14}
              className="opacity-60"
              style={{ color: 'var(--text-secondary)' }}
            />
          </div>

          {/* 旋轉按鈕 */}
          <button
            className="p-1 rounded-full transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ rotation: (widget.rotation + 15) % 360 })
            }}
            title="旋轉 15°"
          >
            <RotateCcw size={12} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* 刪除按鈕 */}
          <button
            className="p-1 rounded-full transition-colors hover:bg-red-500/40"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="刪除"
          >
            <X size={12} className="text-red-400" />
          </button>
        </motion.div>
      )}

      {/* ─── Widget 內容 ─── */}
      <div className={`w-full h-full ${className}`}>
        {children}
      </div>

      {/* ─── 縮放把手（右下角，編輯模式顯示） ─── */}
      {isEditMode && (
        <motion.div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()

            const startX = e.clientX
            const startY = e.clientY
            const startW = widget.width
            const startH = widget.height

            const onMove = (me: PointerEvent) => {
              const newW = Math.max(minWidth, startW + (me.clientX - startX))
              const newH = Math.max(minHeight, startH + (me.clientY - startY))
              onUpdate({ width: newW, height: newH })
            }

            const onUp = () => {
              window.removeEventListener('pointermove', onMove)
              window.removeEventListener('pointerup', onUp)
            }

            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp)
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 10L10 2M6 10L10 6M10 10V10"
              stroke="var(--text-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  )
}

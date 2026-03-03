// ============================================================
// InfiniteCanvas v4 - 正確 pinch-to-zoom（繞捏合中心縮放）
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react'
import type { Widget, AppMode, Theme } from '../../types'
import { CanvasScaleContext } from '../../contexts/CanvasContext'
import { GridOverlay } from './GridOverlay'
import { PhotoWidget }   from '../widgets/PhotoWidget'
import { StickerWidget } from '../widgets/StickerWidget'
import { TimerWidget }   from '../widgets/TimerWidget'
import { WeatherWidget } from '../widgets/WeatherWidget'
import { VideoWidget }   from '../widgets/VideoWidget'
import { DrawingWidget } from '../widgets/DrawingWidget'
import { WidgetActionBar } from '../ui/WidgetActionBar'

interface Transform { viewX: number; viewY: number; scale: number }
interface Props {
  widgets: Widget[]; mode: AppMode; theme: Theme
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void
  onDeleteWidget: (id: string) => void
  onDuplicateWidget: (id: string) => void
  onBringToFront: (id: string) => void
  onCanvasRef: (ref: HTMLDivElement | null) => void
  onRegisterReset?: (fn: () => void) => void  // C2
}

const SCALE_MIN = 0.25
const SCALE_MAX = 3

export function InfiniteCanvas({
  widgets, mode, theme,
  onUpdateWidget, onDeleteWidget, onDuplicateWidget, onBringToFront, onCanvasRef, onRegisterReset,
}: Props) {
  // ── Transform state ──────────────────────────────────────
  // viewX/viewY = 畫布左上角 (0,0) 在螢幕座標的位置
  // 初始讓畫布中心 (2000,2000) 對齊螢幕中心
  const initT = (): Transform => ({
    viewX: window.innerWidth  / 2 - 2000,
    viewY: window.innerHeight / 2 - 2000,
    scale: 1,
  })
  const tRef = useRef<Transform>(initT())           // 永遠是最新值，給事件 handler 讀取
  const [t, setT] = useState<Transform>(tRef.current) // React 渲染用

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Refs ─────────────────────────────────────────────────
  const isPanning      = useRef(false)
  const panStart       = useRef({ x: 0, y: 0 })
  const panStartT      = useRef<Transform>(tRef.current)
  const lastTouch      = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist  = useRef<number | null>(null)
  const lastPinchMid   = useRef<{ x: number; y: number } | null>(null)

  const selectedWidget = widgets.find(w => w.id === selectedId) || null
  const isEditMode     = mode === 'edit'

  // C2: reset viewport — fit all widgets or go to canvas center
  useEffect(() => {
    if (!onRegisterReset) return
    onRegisterReset(() => {
      if (widgets.length === 0) {
        const fresh: Transform = { viewX: window.innerWidth / 2 - 2000, viewY: window.innerHeight / 2 - 2000, scale: 1 }
        tRef.current = fresh; setT(fresh); return
      }
      const xs = widgets.map(w => w.x), ys = widgets.map(w => w.y)
      const ws = widgets.map(w => w.x + w.width), hs = widgets.map(w => w.y + w.height)
      const minX = Math.min(...xs), minY = Math.min(...ys)
      const maxX = Math.max(...ws), maxY = Math.max(...hs)
      const padX = 80, padY = 120
      const scaleX = (window.innerWidth  - padX * 2) / (maxX - minX)
      const scaleY = (window.innerHeight - padY * 2) / (maxY - minY)
      const scale  = Math.min(Math.max(Math.min(scaleX, scaleY), SCALE_MIN), 1)
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      const fresh: Transform = {
        viewX: window.innerWidth  / 2 - cx * scale,
        viewY: window.innerHeight / 2 - cy * scale,
        scale,
      }
      tRef.current = fresh; setT(fresh)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterReset, widgets])

  // C1: keyboard shortcuts — Delete/Backspace to delete, Escape to deselect
  useEffect(() => {
    if (!isEditMode) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        onDeleteWidget(selectedId)
        setSelectedId(null)
      }
      if (e.key === 'Escape' && selectedId) {
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isEditMode, selectedId, onDeleteWidget])

  // ── Helpers ───────────────────────────────────────────────
  /** 繞螢幕點 (ox, oy) 縮放 ratio 倍 */
  const applyZoom = useCallback((ratio: number, ox: number, oy: number) => {
    const prev = tRef.current
    const newScale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, prev.scale * ratio))
    const k = newScale / prev.scale
    const next: Transform = {
      viewX:  ox - (ox - prev.viewX) * k,
      viewY:  oy - (oy - prev.viewY) * k,
      scale:  newScale,
    }
    tRef.current = next
    setT(next)
  }, [])

  const applyPan = useCallback((dx: number, dy: number) => {
    const prev = tRef.current
    const next: Transform = { viewX: prev.viewX + dx, viewY: prev.viewY + dy, scale: prev.scale }
    tRef.current = next
    setT(next)
  }, [])

  // ── 滑鼠事件 ─────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      panStart.current  = { x: e.clientX, y: e.clientY }
      panStartT.current = { ...tRef.current }
    }
    if (e.button === 0 && !e.altKey) setSelectedId(null)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    const base = panStartT.current
    const next: Transform = { viewX: base.viewX + dx, viewY: base.viewY + dy, scale: base.scale }
    tRef.current = next
    setT(next)
  }, [])

  const handleMouseUp  = useCallback(() => { isPanning.current = false }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const ratio = e.deltaY > 0 ? 0.9 : 1.1
    applyZoom(ratio, e.clientX, e.clientY)
  }, [applyZoom])

  // ── 觸控事件 ─────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current     = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
      lastPinchMid.current  = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
      lastPinchMid.current  = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
      lastTouch.current = null
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null && lastPinchMid.current !== null) {
      // 雙指：繞捏合中心縮放 + 同時支援平移
      const dx  = e.touches[0].clientX - e.touches[1].clientX
      const dy  = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2

      // 捏合縮放（繞當前捏合中心）
      const ratio = dist / lastPinchDist.current
      applyZoom(ratio, midX, midY)

      // 捏合平移（兩指中心的移動量）
      const panDx = midX - lastPinchMid.current.x
      const panDy = midY - lastPinchMid.current.y
      if (Math.abs(panDx) + Math.abs(panDy) > 0.5) applyPan(panDx, panDy)

      lastPinchDist.current = dist
      lastPinchMid.current  = { x: midX, y: midY }

    } else if (e.touches.length === 1 && lastTouch.current !== null) {
      // 單指平移
      const panDx = e.touches[0].clientX - lastTouch.current.x
      const panDy = e.touches[0].clientY - lastTouch.current.y
      applyPan(panDx, panDy)
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [applyZoom, applyPan])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current     = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
      lastPinchMid.current  = null
    } else if (e.touches.length === 0) {
      lastTouch.current     = null
      lastPinchDist.current = null
      lastPinchMid.current  = null
    }
  }, [])

  const commonProps = (w: Widget) => ({
    widget: w,
    isEditMode,
    isSelected:    selectedId === w.id,
    onSelect:      () => setSelectedId(w.id),
    onDeselect:    () => setSelectedId(null),
    onUpdate:      (changes: Partial<Widget>) => onUpdateWidget(w.id, changes),
    onBringToFront: () => onBringToFront(w.id),
  })

  return (
    <>
      <div
        className="fixed inset-0 overflow-hidden select-none"
        style={{ zIndex: 1, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={onCanvasRef}
          className="absolute"
          style={{
            width: 4000,
            height: 4000,
            transform: `translate(${t.viewX}px, ${t.viewY}px) scale(${t.scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <GridOverlay isVisible={isEditMode} accentColor={theme.accent} />

          {/* 將 scale 注入 Context，讓 BaseWidget 換算拖曳位移 */}
          <CanvasScaleContext.Provider value={t.scale}>
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
          </CanvasScaleContext.Provider>
        </div>
      </div>

      {isEditMode && (
        <WidgetActionBar
          selectedWidget={selectedWidget}
          theme={theme}
          onDelete={() => { if (selectedWidget) { onDeleteWidget(selectedWidget.id); setSelectedId(null) } }}
          onRotateLeft ={() => selectedWidget && onUpdateWidget(selectedWidget.id, { rotation: selectedWidget.rotation - 15 })}
          onRotateRight={() => selectedWidget && onUpdateWidget(selectedWidget.id, { rotation: selectedWidget.rotation + 15 })}
          onDuplicate  ={() => { if (selectedWidget) { onDuplicateWidget(selectedWidget.id); setSelectedId(null) } }}
          onDeselect   ={() => setSelectedId(null)}
          onToggleLock ={() => selectedWidget && onUpdateWidget(selectedWidget.id, { locked: !selectedWidget.locked })}
        />
      )}

      {isEditMode && Math.abs(t.scale - 1) > 0.05 && (
        <div
          className="fixed bottom-20 right-4 text-xs px-2 py-1 rounded-full"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', zIndex: 100 }}
        >
          {Math.round(t.scale * 100)}%
        </div>
      )}
    </>
  )
}

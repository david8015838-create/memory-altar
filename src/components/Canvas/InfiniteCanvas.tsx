// ============================================================
// InfiniteCanvas v5 - Better UX: left-click drag pan + touch inertia
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
import { DrawingWidget }   from '../widgets/DrawingWidget'
import { LoveNoteWidget } from '../widgets/LoveNoteWidget'
import { WidgetActionBar } from '../ui/WidgetActionBar'
import { WidgetErrorBoundary } from '../widgets/WidgetErrorBoundary'

interface Transform { viewX: number; viewY: number; scale: number }
interface Props {
  widgets: Widget[]; mode: AppMode; theme: Theme
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void
  onDeleteWidget: (id: string) => void
  onDuplicateWidget: (id: string) => void
  onBringToFront: (id: string) => void
  onCanvasRef: (ref: HTMLDivElement | null) => void
  onRegisterReset?: (fn: () => void) => void
  initialTransform?: { viewX: number; viewY: number; scale: number }
  onRegisterGetCenter?: (fn: () => { x: number; y: number }) => void
  onRegisterGetViewport?: (fn: () => { viewX: number; viewY: number; scale: number }) => void
}

const SCALE_MIN = 0.25
const SCALE_MAX = 3
const PAN_THRESHOLD = 5 // px before left-click becomes a pan

export function InfiniteCanvas({
  widgets, mode, theme,
  onUpdateWidget, onDeleteWidget, onDuplicateWidget, onBringToFront, onCanvasRef, onRegisterReset,
  initialTransform, onRegisterGetCenter, onRegisterGetViewport,
}: Props) {
  // ── Transform state ──────────────────────────────────────
  const initT = (): Transform => initialTransform ?? ({
    viewX: window.innerWidth  / 2 - 2000,
    viewY: window.innerHeight / 2 - 2000,
    scale: 1,
  })
  const tRef = useRef<Transform>(initT())
  const [t, setT] = useState<Transform>(tRef.current)
  const [isMousePanning, setIsMousePanning] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Refs ─────────────────────────────────────────────────
  const containerRef      = useRef<HTMLDivElement | null>(null)
  const isPanning         = useRef(false)
  const leftClickMayPan   = useRef(false)   // left-drag pan pending threshold
  const panStart          = useRef({ x: 0, y: 0 })
  const panStartT         = useRef<Transform>(tRef.current)
  const lastTouch         = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist     = useRef<number | null>(null)
  const lastPinchMid      = useRef<{ x: number; y: number } | null>(null)
  // Touch inertia
  const touchVel          = useRef({ x: 0, y: 0 })
  const touchVelTime      = useRef(0)
  const inertiaRaf        = useRef<number | null>(null)

  const selectedWidget = widgets.find(w => w.id === selectedId) || null
  const isEditMode     = mode === 'edit'

  // Cleanup inertia on unmount
  useEffect(() => {
    return () => { if (inertiaRaf.current) cancelAnimationFrame(inertiaRaf.current) }
  }, [])

  // ref to latest applyZoom (set after it's defined below)
  const applyZoomRef = useRef<(ratio: number, ox: number, oy: number) => void>(() => {})

  // Expose live viewport center in canvas coords (for widget spawn position)
  useEffect(() => {
    if (!onRegisterGetCenter) return
    onRegisterGetCenter(() => {
      const { viewX, viewY, scale } = tRef.current
      return {
        x: (window.innerWidth  / 2 - viewX) / scale,
        y: (window.innerHeight / 2 - viewY) / scale,
      }
    })
  }, [onRegisterGetCenter])

  // Expose current transform (for "set home view" feature)
  useEffect(() => {
    if (!onRegisterGetViewport) return
    onRegisterGetViewport(() => ({ ...tRef.current }))
  }, [onRegisterGetViewport])

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

  // Keep ref up to date so the wheel listener always uses latest applyZoom
  useEffect(() => { applyZoomRef.current = applyZoom }, [applyZoom])

  // Non-passive wheel listener (React onWheel is passive → preventDefault ignored)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const ratio = e.deltaY > 0 ? 0.9 : 1.1
      applyZoomRef.current(ratio, e.clientX, e.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])  // only mount/unmount — applyZoomRef stays current

  const applyPan = useCallback((dx: number, dy: number) => {
    const prev = tRef.current
    const next: Transform = { viewX: prev.viewX + dx, viewY: prev.viewY + dy, scale: prev.scale }
    tRef.current = next
    setT(next)
  }, [])

  // ── 滑鼠事件 ─────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+left: start panning immediately
      e.preventDefault()
      isPanning.current = true
      setIsMousePanning(true)
      panStart.current  = { x: e.clientX, y: e.clientY }
      panStartT.current = { ...tRef.current }
    } else if (e.button === 0 && !e.altKey) {
      // Left click: record potential pan start (activates after threshold)
      leftClickMayPan.current = true
      panStart.current  = { x: e.clientX, y: e.clientY }
      panStartT.current = { ...tRef.current }
      setSelectedId(null)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const base = panStartT.current
      const next: Transform = { viewX: base.viewX + dx, viewY: base.viewY + dy, scale: base.scale }
      tRef.current = next
      setT(next)
    } else if (leftClickMayPan.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      if (Math.hypot(dx, dy) > PAN_THRESHOLD) {
        // Threshold crossed: upgrade to active pan
        isPanning.current = true
        leftClickMayPan.current = false
        setIsMousePanning(true)
      }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    leftClickMayPan.current = false
    setIsMousePanning(false)
  }, [])

  // ── 觸控事件 ─────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Cancel any running inertia when a new touch begins
    if (inertiaRaf.current) {
      cancelAnimationFrame(inertiaRaf.current)
      inertiaRaf.current = null
    }
    touchVel.current = { x: 0, y: 0 }
    touchVelTime.current = performance.now()

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

      const ratio = dist / lastPinchDist.current
      applyZoom(ratio, midX, midY)

      const panDx = midX - lastPinchMid.current.x
      const panDy = midY - lastPinchMid.current.y
      if (Math.abs(panDx) + Math.abs(panDy) > 0.5) applyPan(panDx, panDy)

      lastPinchDist.current = dist
      lastPinchMid.current  = { x: midX, y: midY }
      touchVel.current = { x: 0, y: 0 } // reset velocity during pinch

    } else if (e.touches.length === 1 && lastTouch.current !== null) {
      // 單指平移 + 速度追蹤（慣性用）
      const panDx = e.touches[0].clientX - lastTouch.current.x
      const panDy = e.touches[0].clientY - lastTouch.current.y
      applyPan(panDx, panDy)

      // Track velocity for inertia (exponential moving average)
      const now = performance.now()
      const dt = now - touchVelTime.current
      if (dt > 0 && dt < 100) {
        const alpha = 0.6
        touchVel.current = {
          x: touchVel.current.x * (1 - alpha) + (panDx / dt * 16) * alpha,
          y: touchVel.current.y * (1 - alpha) + (panDy / dt * 16) * alpha,
        }
      }
      touchVelTime.current = now
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [applyZoom, applyPan])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current     = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
      lastPinchMid.current  = null
    } else if (e.touches.length === 0) {
      // All fingers lifted: start inertia if velocity is significant
      const vel = touchVel.current
      const speed = Math.hypot(vel.x, vel.y)
      if (speed > 1) {
        const decay = 0.93
        const inertiaFn = () => {
          touchVel.current = {
            x: touchVel.current.x * decay,
            y: touchVel.current.y * decay,
          }
          if (Math.hypot(touchVel.current.x, touchVel.current.y) < 0.3) {
            inertiaRaf.current = null
            return
          }
          applyPan(touchVel.current.x, touchVel.current.y)
          inertiaRaf.current = requestAnimationFrame(inertiaFn)
        }
        inertiaRaf.current = requestAnimationFrame(inertiaFn)
      }
      touchVel.current      = { x: 0, y: 0 }
      lastTouch.current     = null
      lastPinchDist.current = null
      lastPinchMid.current  = null
    }
  }, [applyPan])

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
        ref={containerRef}
        className="fixed inset-0 overflow-hidden select-none"
        style={{
          zIndex: 1,
          touchAction: 'none',
          cursor: isMousePanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

          <CanvasScaleContext.Provider value={t.scale}>
            {[...widgets].sort((a, b) => a.zIndex - b.zIndex).map(w => {
              const p = commonProps(w)
              let child: React.ReactNode = null
              switch (w.type) {
                case 'photo':     child = <PhotoWidget    {...p} />; break
                case 'sticker':   child = <StickerWidget  {...p} />; break
                case 'timer':     child = <TimerWidget    {...p} />; break
                case 'weather':   child = <WeatherWidget  {...p} />; break
                case 'video':     child = <VideoWidget    {...p} />; break
                case 'drawing':   child = <DrawingWidget  {...p} />; break
                case 'love-note': child = <LoveNoteWidget {...p} />; break
                default:          return null
              }
              return (
                <WidgetErrorBoundary key={w.id} widgetId={w.id}>
                  {child}
                </WidgetErrorBoundary>
              )
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

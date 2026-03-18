// ============================================================
// ViewFeed — 瀏覽模式的垂直滑動 Feed（類 Facebook 捲動體驗）
// 將當前頁面所有 widget 依 Y 軸排序，以原生 overflow-y scroll 呈現
// ============================================================

import type { Widget, Theme } from '../../types'
import { CanvasScaleContext } from '../../contexts/CanvasContext'
import { PhotoWidget }    from '../widgets/PhotoWidget'
import { StickerWidget }  from '../widgets/StickerWidget'
import { TimerWidget }    from '../widgets/TimerWidget'
import { WeatherWidget }  from '../widgets/WeatherWidget'
import { VideoWidget }    from '../widgets/VideoWidget'
import { DrawingWidget }  from '../widgets/DrawingWidget'
import { LoveNoteWidget } from '../widgets/LoveNoteWidget'
import { WidgetErrorBoundary } from '../widgets/WidgetErrorBoundary'

interface Props {
  widgets: Widget[]
  theme: Theme
  onUpdateWidget: (id: string, changes: Partial<Widget>) => void
  onBringToFront: (id: string) => void
}

// 最大卡片寬（iPhone 15 Pro = 393px），留 32px 左右 padding
const MAX_CARD_W = 360

export function ViewFeed({ widgets, onUpdateWidget, onBringToFront }: Props) {
  if (widgets.length === 0) return null

  // 依 Y 軸（由上到下）排序，Y 相同再依 X 排
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)

  // 螢幕可用寬（限制最大值，桌面也好看）
  const cardMaxW = Math.min(MAX_CARD_W, window.innerWidth - 32)

  return (
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden"
      style={{
        zIndex: 1,
        // 原生 iOS momentum scroll
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
        // 避免過衝後出現白底
        background: 'transparent',
        // 上下留白：頂部給「返回編輯」按鈕，底部給分頁 tabs
        paddingTop:    'max(56px, calc(env(safe-area-inset-top, 0px) + 56px))',
        paddingBottom: 'max(72px, calc(env(safe-area-inset-bottom, 0px) + 72px))',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: '8px 16px',
        }}
      >
        {sorted.map(w => {
          // 等比縮放到螢幕寬度
          const scale = Math.min(1, cardMaxW / w.width)
          const dw = Math.round(w.width  * scale)
          const dh = Math.round(w.height * scale)

          // 將 widget 的座標重置為 (0,0) 以適應 feed 佈局
          const feedWidget: Widget = { ...w, x: 0, y: 0, width: dw, height: dh, rotation: 0 }

          const commonProps = {
            widget:        feedWidget,
            isEditMode:    false,
            isSelected:    false,
            onSelect:      () => {},
            onDeselect:    () => {},
            onUpdate:      (changes: Partial<Widget>) => onUpdateWidget(w.id, changes),
            onBringToFront: () => onBringToFront(w.id),
          }

          return (
            <WidgetErrorBoundary key={w.id} widgetId={w.id}>
              <CanvasScaleContext.Provider value={scale}>
                {/* 外層 div 控制尺寸，內層讓 BaseWidget absolute 定位到 (0,0) */}
                <div
                  style={{
                    position: 'relative',
                    width:  dw,
                    height: dh,
                    flexShrink: 0,
                    borderRadius: 16,
                    overflow: 'hidden',
                    // 淡淡陰影讓每張卡有層次感
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  {w.type === 'photo'     && <PhotoWidget    {...commonProps} />}
                  {w.type === 'sticker'   && <StickerWidget  {...commonProps} />}
                  {w.type === 'timer'     && <TimerWidget    {...commonProps} />}
                  {w.type === 'weather'   && <WeatherWidget  {...commonProps} />}
                  {w.type === 'video'     && <VideoWidget    {...commonProps} />}
                  {w.type === 'drawing'   && <DrawingWidget  {...commonProps} />}
                  {w.type === 'love-note' && <LoveNoteWidget {...commonProps} />}
                </div>
              </CanvasScaleContext.Provider>
            </WidgetErrorBoundary>
          )
        })}
      </div>
    </div>
  )
}

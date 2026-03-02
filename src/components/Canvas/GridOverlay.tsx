// ============================================================
// GridOverlay - 編輯模式下的格線導引
// 細點陣列，幫助對齊 Widget
// ============================================================

interface Props {
  isVisible: boolean
  accentColor: string
}

export function GridOverlay({ isVisible, accentColor }: Props) {
  if (!isVisible) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        // 使用 CSS background-image 繪製點陣格線
        backgroundImage: `radial-gradient(circle, ${accentColor}30 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        zIndex: 1,
      }}
    />
  )
}

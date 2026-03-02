// ============================================================
// FloatingBackground - 緩慢流動的光暈背景
// 使用 Framer Motion 動畫，配合主題色調
// ============================================================

import { motion } from 'framer-motion'
import type { Theme } from '../../types'

interface Props {
  theme: Theme
}

export function FloatingBackground({ theme }: Props) {
  const orbs = theme.orbColors.map((color, i) => ({
    color,
    // 每個光球的不同初始位置與動畫參數
    x: [20 + i * 20, 60 + i * 10, 30 + i * 15, 20 + i * 20],
    y: [10 + i * 15, 50 + i * 10, 70 - i * 5, 10 + i * 15],
    scale: [1, 1.2 + i * 0.1, 0.9, 1],
    duration: 15 + i * 5,
    delay: i * 3,
    size: 300 + i * 80,
    blur: 80 + i * 20,
    opacity: 0.15 + i * 0.02,
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
          }}
          animate={{
            x: orb.x.map(v => `${v}vw`),
            y: orb.y.map(v => `${v}vh`),
            scale: orb.scale,
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 星星粒子層 */}
      <StarField />
    </div>
  )
}

// 細小閃爍星點
function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 5,
  }))

  return (
    <>
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}

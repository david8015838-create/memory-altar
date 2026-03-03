// ============================================================
// FloatingBackground - 緩慢流動的光暈背景（手機版大幅簡化）
// ============================================================

import { motion } from 'framer-motion'
import type { Theme } from '../../types'

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth <= 768

interface Props { theme: Theme }

export function FloatingBackground({ theme }: Props) {
  // 手機只用前 2 個 orb，桌面用全部 4 個
  const orbCount = IS_MOBILE ? 2 : 4
  const orbs = theme.orbColors.slice(0, orbCount).map((color, i) => ({
    color,
    x: [20 + i * 20, 60 + i * 10, 30 + i * 15, 20 + i * 20],
    y: [10 + i * 15, 50 + i * 10, 70 - i * 5, 10 + i * 15],
    scale: [1, 1.2 + i * 0.1, 0.9, 1],
    // 手機用更長週期（CPU 負擔更低）
    duration: IS_MOBILE ? 30 + i * 10 : 15 + i * 5,
    delay: i * 3,
    size: IS_MOBILE ? 250 + i * 60 : 300 + i * 80,
    blur: IS_MOBILE ? 60 + i * 15 : 80 + i * 20,
    opacity: 0.18 + i * 0.02,
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
            willChange: 'transform',
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

      {/* 星星粒子：手機不顯示 */}
      {!IS_MOBILE && <StarField />}
    </div>
  )
}

function StarField() {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 5,
  }))

  return (
    <>
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{ opacity: [0.1, 0.7, 0.1] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

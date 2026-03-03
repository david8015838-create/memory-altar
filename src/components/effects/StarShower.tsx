// ============================================================
// StarShower - ⭐ 星光雨（持續循環）
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Star {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  emoji: string
  drift: number
}

const STAR_EMOJIS = ['⭐', '✨', '💫', '🌟', '✨', '⭐', '💫']
const sidRef = { current: 0 }

function createStars(count = 40): Star[] {
  return Array.from({ length: count }, () => ({
    id: sidRef.current++,
    x: Math.random() * 98 + 1,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 3,
    size: 12 + Math.random() * 16,
    emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
    drift: (Math.random() - 0.5) * 120,
  }))
}

interface Props {
  isActive: boolean
}

export function StarShower({ isActive }: Props) {
  const [stars, setStars] = useState<Star[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setStars([])
      return
    }
    setStars(createStars(40))
    intervalRef.current = setInterval(() => setStars(createStars(40)), 5500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9995 }}>
      <AnimatePresence>
        {stars.map(s => (
          <motion.div
            key={s.id}
            className="absolute select-none"
            style={{ left: `${s.x}%`, top: -50, fontSize: s.size }}
            animate={{
              y: ['0vh', '108vh'],
              x: [0, s.drift],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 0.8, 0.3],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { times: [0, 0.1, 0.85, 1], duration: s.duration, delay: s.delay },
              scale: { times: [0, 0.3, 0.7, 1], duration: s.duration, delay: s.delay },
            }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            {s.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

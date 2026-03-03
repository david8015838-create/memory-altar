// ============================================================
// SnowFall - ❄️ 飄雪（持續循環，輕柔飄落）
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Snowflake {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  drift: number
  opacity: number
}

const nidRef = { current: 0 }

function createSnowflakes(count = 45): Snowflake[] {
  return Array.from({ length: count }, () => ({
    id: nidRef.current++,
    x: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 7 + Math.random() * 8,
    size: 10 + Math.random() * 18,
    drift: (Math.random() - 0.5) * 180,
    opacity: 0.5 + Math.random() * 0.5,
  }))
}

interface Props {
  isActive: boolean
}

export function SnowFall({ isActive }: Props) {
  const [flakes, setFlakes] = useState<Snowflake[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setFlakes([])
      return
    }
    setFlakes(createSnowflakes(45))
    intervalRef.current = setInterval(() => setFlakes(createSnowflakes(45)), 12000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9994 }}>
      <AnimatePresence>
        {flakes.map(f => (
          <motion.div
            key={f.id}
            className="absolute select-none"
            style={{
              left: `${f.x}%`,
              top: -40,
              fontSize: f.size,
              opacity: f.opacity,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, f.drift, f.drift * 0.5, f.drift * 1.2],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              ease: 'linear',
              x: { duration: f.duration, delay: f.delay, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] },
              rotate: { duration: f.duration * 0.8, delay: f.delay, repeat: Infinity, ease: 'linear' },
            }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            ❄️
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

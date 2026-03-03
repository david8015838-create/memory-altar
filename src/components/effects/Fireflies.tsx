// ============================================================
// Fireflies - 🌟 螢火蟲（飄浮發光，持續循環）
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Firefly {
  id: number
  startX: number
  endX: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}

const FIREFLY_COLORS = [
  '#fbbf24', '#34d399', '#60a5fa', '#a78bfa',
  '#f472b6', '#6ee7b7', '#fcd34d', '#c4b5fd',
]
const fidRef = { current: 0 }

function createFireflies(count = 25): Firefly[] {
  return Array.from({ length: count }, () => ({
    id: fidRef.current++,
    startX: Math.random() * 95 + 2,
    endX: Math.random() * 95 + 2,
    y: 20 + Math.random() * 70,     // 分散在螢幕中段
    size: 6 + Math.random() * 8,
    duration: 5 + Math.random() * 7,
    delay: Math.random() * 5,
    color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
  }))
}

interface Props {
  isActive: boolean
}

export function Fireflies({ isActive }: Props) {
  const [flies, setFlies] = useState<Firefly[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setFlies([])
      return
    }
    setFlies(createFireflies(25))
    intervalRef.current = setInterval(() => setFlies(createFireflies(25)), 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9993 }}>
      <AnimatePresence>
        {flies.map(f => (
          <motion.div
            key={f.id}
            className="absolute rounded-full"
            style={{
              top: `${f.y}vh`,
              left: `${f.startX}%`,
              width: f.size,
              height: f.size,
              background: f.color,
              boxShadow: `0 0 ${f.size * 2}px ${f.color}, 0 0 ${f.size * 4}px ${f.color}60`,
            }}
            animate={{
              left: [`${f.startX}%`, `${f.endX}%`],
              top: [`${f.y}vh`, `${f.y - 15 + Math.random() * 30}vh`],
              opacity: [0, 0.9, 0.6, 0.9, 0],
              scale: [0.5, 1.2, 0.8, 1.2, 0.5],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              ease: 'easeInOut',
              opacity: { times: [0, 0.15, 0.5, 0.85, 1] },
              scale: { times: [0, 0.15, 0.5, 0.85, 1] },
            }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.5 } }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

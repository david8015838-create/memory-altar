// ============================================================
// PetalRain v2 - 花瓣雨（持續循環，點按停止）
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Petal {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  rotation: number
  emoji: string
  drift: number
}

const PETAL_EMOJIS = ['🌸', '🌸', '🌸', '🌺', '🌷', '🪷', '🌹']
const idRef = { current: 0 }

function createPetals(count = 35): Petal[] {
  return Array.from({ length: count }, () => ({
    id: idRef.current++,
    x: Math.random() * 95 + 2,
    delay: Math.random() * 4,
    duration: 4 + Math.random() * 4,
    size: 16 + Math.random() * 18,
    rotation: Math.random() * 360,
    emoji: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
    drift: (Math.random() - 0.5) * 250,
  }))
}

interface Props {
  isActive: boolean
}

export function PetalRain({ isActive }: Props) {
  const [petals, setPetals] = useState<Petal[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPetals([])
      return
    }
    setPetals(createPetals(35))
    intervalRef.current = setInterval(() => setPetals(createPetals(35)), 7500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9997 }}>
      <AnimatePresence>
        {petals.map(p => (
          <motion.div
            key={p.id}
            className="absolute select-none"
            style={{ left: `${p.x}%`, top: -60, fontSize: p.size }}
            animate={{
              y: ['0vh', '112vh'],
              x: [0, p.drift],
              rotate: [p.rotation, p.rotation + 720],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeIn',
              opacity: { times: [0, 0.08, 0.82, 1], duration: p.duration, delay: p.delay },
            }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

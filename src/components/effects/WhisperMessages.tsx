// ============================================================
// WhisperMessages v2 - 悄悄話（持續循環，點按停止）
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHISPER_MESSAGES } from '../../constants/themes'

interface Whisper {
  id: number
  message: string
  y: number
  delay: number
  duration: number
  fontSize: number
}

const widRef = { current: 0 }

function createWhispers(): Whisper[] {
  const count = 6 + Math.floor(Math.random() * 3)
  const shuffled = [...WHISPER_MESSAGES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((msg, i) => ({
    id: widRef.current++,
    message: msg,
    y: 8 + i * 11 + Math.random() * 5,
    delay: i * 0.7,
    duration: 6 + Math.random() * 3,
    fontSize: 14 + Math.random() * 8,
  }))
}

interface Props {
  isActive: boolean
  accentColor: string
}

export function WhisperMessages({ isActive, accentColor }: Props) {
  const [whispers, setWhispers] = useState<Whisper[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setWhispers([])
      return
    }
    setWhispers(createWhispers())
    intervalRef.current = setInterval(() => setWhispers(createWhispers()), 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9996 }}>
      <AnimatePresence>
        {whispers.map(w => (
          <motion.div
            key={w.id}
            className="absolute whitespace-nowrap font-medium"
            style={{
              top: `${w.y}vh`,
              right: -500,
              fontSize: w.fontSize,
              color: '#ffffff',
              textShadow: `0 0 20px ${accentColor}, 0 0 40px ${accentColor}80`,
              fontFamily: '"Noto Serif TC", serif',
            }}
            animate={{
              x: [0, -(window.innerWidth + 500)],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: w.duration,
              delay: w.delay,
              ease: 'linear',
              opacity: { times: [0, 0.08, 0.82, 1], duration: w.duration, delay: w.delay },
            }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            ✦ {w.message} ✦
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

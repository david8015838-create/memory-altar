// ============================================================
// WhisperMessages - ✨ 彩蛋二：悄悄話星球
// 點擊隱藏按鈕後，愛語像流星一樣劃過螢幕
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WHISPER_MESSAGES } from '../../constants/themes'

interface Whisper {
  id: number
  message: string
  y: number        // 起始垂直位置 (vh)
  delay: number    // 延遲 (s)
  duration: number // 飄過時長
  fontSize: number
}

function createWhispers(): Whisper[] {
  // 隨機選 6-8 條訊息
  const count = 6 + Math.floor(Math.random() * 3)
  const shuffled = [...WHISPER_MESSAGES].sort(() => Math.random() - 0.5)

  return shuffled.slice(0, count).map((msg, i) => ({
    id: i,
    message: msg,
    y: 10 + i * 12 + Math.random() * 5, // 分散在螢幕不同高度
    delay: i * 0.6,
    duration: 5 + Math.random() * 3,
    fontSize: 14 + Math.random() * 8,
  }))
}

interface Props {
  isActive: boolean
  onComplete: () => void
  accentColor: string
}

export function WhisperMessages({ isActive, onComplete, accentColor }: Props) {
  const [whispers, setWhispers] = useState<Whisper[]>([])

  useEffect(() => {
    if (isActive) {
      setWhispers(createWhispers())

      const timer = setTimeout(() => {
        setWhispers([])
        onComplete()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9998 }}>
      <AnimatePresence>
        {whispers.map(whisper => (
          <motion.div
            key={whisper.id}
            className="absolute whitespace-nowrap font-handwriting font-medium"
            style={{
              top: `${whisper.y}vh`,
              right: -400,
              fontSize: whisper.fontSize,
              // 文字發光效果
              color: '#ffffff',
              textShadow: `0 0 20px ${accentColor}, 0 0 40px ${accentColor}80`,
            }}
            initial={{ x: 0, opacity: 0 }}
            animate={{
              x: [0, -window.innerWidth - 400],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: whisper.duration,
              delay: whisper.delay,
              ease: 'linear',
              opacity: {
                times: [0, 0.1, 0.8, 1],
                duration: whisper.duration,
                delay: whisper.delay,
              },
            }}
            exit={{ opacity: 0 }}
          >
            ✦ {whisper.message} ✦
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

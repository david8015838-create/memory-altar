// ============================================================
// PetalRain - 🌸 彩蛋一：花瓣雨特效
// 點擊隱藏按鈕後，30 片花瓣從頂部飄落
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Petal {
  id: number
  x: number        // 水平起始位置 (vw)
  delay: number    // 動畫延遲 (s)
  duration: number // 飄落時長 (s)
  size: number     // 花瓣大小 (px)
  rotation: number // 初始旋轉
  emoji: string    // 花瓣 emoji（隨機選一個）
}

const PETAL_EMOJIS = ['🌸', '🌸', '🌸', '🌺', '🌷', '🪷', '🌹']

function createPetals(count = 30): Petal[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    size: 16 + Math.random() * 16,
    rotation: Math.random() * 360,
    emoji: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
  }))
}

interface Props {
  isActive: boolean
  onComplete: () => void
}

export function PetalRain({ isActive, onComplete }: Props) {
  const [petals, setPetals] = useState<Petal[]>([])

  useEffect(() => {
    if (isActive) {
      setPetals(createPetals(30))

      // 7 秒後清除
      const timer = setTimeout(() => {
        setPetals([])
        onComplete()
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        {petals.map(petal => (
          <motion.div
            key={petal.id}
            className="absolute select-none"
            style={{
              left: `${petal.x}%`,
              top: -50,
              fontSize: petal.size,
              rotate: petal.rotation,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [petal.rotation, petal.rotation + 720],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              ease: 'easeIn',
              opacity: {
                times: [0, 0.1, 0.8, 1],
                duration: petal.duration,
                delay: petal.delay,
              },
            }}
            exit={{ opacity: 0 }}
          >
            {petal.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

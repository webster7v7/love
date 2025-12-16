'use client'

import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
import { useState, useEffect } from 'react'

interface Star {
  id: number
  left: string
  size: number
  duration: number
  delay: number
  opacity: number
  rotation: number
}

export default function FloatingStars() {
  const [stars, setStars] = useState<Star[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 确保只在客户端运行
    setIsClient(true)
    
    // 生成随机星星配置
    const newStars = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 15 + 15, // 15-30px
      duration: Math.random() * 6 + 6, // 6-12秒
      delay: Math.random() * 6, // 0-6秒延迟
      opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7透明度
      rotation: Math.random() * 360, // 随机初始旋转
    }))
    
    setStars(newStars)
  }, [])

  // 在服务端或客户端初始化之前不渲染任何内容
  if (!isClient) {
    return <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" />
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{ 
            left: star.left, 
            top: '-50px',
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [star.rotation, star.rotation + 360],
            opacity: [0, star.opacity, star.opacity, 0],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'linear',
            opacity: {
              times: [0, 0.1, 0.9, 1],
              duration: star.duration,
            }
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <FaStar 
              style={{ 
                fontSize: `${star.size}px`,
                color: '#FFD700',
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
              }} 
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}


'use client'

import { motion } from 'framer-motion'
import { FaHeart } from 'react-icons/fa'
import { useState, useEffect } from 'react'

interface Heart {
  id: number
  left: string
  size: number
  duration: number
  delay: number
  opacity: number
}

export default function FloatingHearts() {
  const [hearts, setHearts] = useState<Heart[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 使用 setTimeout 避免直接在 effect 中调用 setState
    const timer = setTimeout(() => {
      setIsClient(true)
      
      // 生成随机爱心配置
      const newHearts = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 20 + 20, // 20-40px
        duration: Math.random() * 5 + 5, // 5-10秒
        delay: Math.random() * 5, // 0-5秒延迟
        opacity: Math.random() * 0.3 + 0.3, // 0.3-0.6透明度
      }))
      
      setHearts(newHearts)
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  // 在服务端或客户端初始化之前不渲染任何内容
  if (!isClient) {
    return <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" />
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute"
          style={{
            left: heart.left,
            top: '-50px',
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, 360],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <FaHeart
            style={{
              fontSize: `${heart.size}px`,
              opacity: heart.opacity,
              color: '#FF69B4',
              filter: 'drop-shadow(0 2px 4px rgba(255, 105, 180, 0.3))',
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}


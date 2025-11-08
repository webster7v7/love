'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
}

const COLORS = ['#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB', '#FF6EC7', '#FFD700']
const MAX_PARTICLES = 50

export default function MouseParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)
  const lastEmitTime = useRef(0)

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now()
    // 限流：每50ms最多生成一个粒子
    if (now - lastEmitTime.current < 50) return
    lastEmitTime.current = now

    setParticles((prev) => {
      // 限制粒子总数
      if (prev.length >= MAX_PARTICLES) {
        return prev.slice(1)
      }

      const newParticle: Particle = {
        id: particleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 6 + 4, // 4-10px
      }

      return [...prev, newParticle]
    })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [1, 1.5, 0],
              opacity: [1, 0.8, 0],
              y: [0, -30],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 1.2,
              ease: 'easeOut',
            }}
            onAnimationComplete={() => removeParticle(particle.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}


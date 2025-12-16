'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, memo } from 'react'

interface TimeState {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const START_DATE = new Date('2025-02-04T20:05:00').getTime()

// 单个数字位组件 - 独立动画
const SingleDigit = memo(({ 
  digit, 
  shouldAnimate 
}: { 
  digit: string
  shouldAnimate: boolean
}) => {
  return (
    <span className="inline-block relative gradient-text" style={{ minWidth: '1ch' }}>
      <AnimatePresence mode="popLayout">
        {shouldAnimate ? (
          <motion.span
            key={digit}
            initial={{ y: -20, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.5 }}
            transition={{ 
              type: 'spring',
              stiffness: 500,
              damping: 28,
              mass: 0.6,
              velocity: 2
            }}
            className="inline-block"
          >
            {digit}
          </motion.span>
        ) : (
          <span 
            key={digit} 
            className="inline-block"
          >
            {digit}
          </span>
        )}
      </AnimatePresence>
    </span>
  )
})

SingleDigit.displayName = 'SingleDigit'

// 使用memo优化的TimeCard组件 - 支持单个数字位动画
const TimeCard = memo(({ 
  value, 
  prevValue,
  label, 
  shouldAnimate 
}: { 
  value: number
  prevValue: number
  label: string
  shouldAnimate: boolean
}) => {
  // 将数字拆分为独立的数字位（处理 undefined 情况）
  const digits = value.toString().padStart(2, '0').split('')
  const prevDigits = (prevValue || 0).toString().padStart(2, '0').split('')

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 min-w-[100px] flex flex-col items-center justify-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div 
        className="text-4xl md:text-5xl font-bold mb-2 min-h-[3rem] flex items-center justify-center"
      >
        <div className="flex items-center">
          {digits.map((digit, index) => (
            <SingleDigit
              key={`pos-${index}`}
              digit={digit}
              shouldAnimate={shouldAnimate && prevDigits[index] !== digit}
            />
          ))}
        </div>
      </div>
      <div className="text-sm md:text-base text-gray-600 font-medium">
        {label}
      </div>
    </motion.div>
  )
})

TimeCard.displayName = 'TimeCard'

export default function CountdownTimer() {
  const [time, setTime] = useState<TimeState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  
  const [prevTime, setPrevTime] = useState<TimeState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 确保只在客户端运行
    setIsClient(true)
    
    const calculateTime = () => {
      const now = new Date().getTime()
      const diff = now - START_DATE

      const newTime = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      }

      setTime((prevState) => {
        setPrevTime(prevState)
        return newTime
      })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // 在服务端或客户端初始化之前显示占位符
  if (!isClient) {
    return (
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {['天', '小时', '分钟', '秒'].map((label, index) => (
          <div
            key={label}
            className="glass-card rounded-2xl p-6 min-w-[100px] flex flex-col items-center justify-center"
          >
            <div className="text-4xl md:text-5xl font-bold mb-2 min-h-[3rem] flex items-center justify-center gradient-text">
              00
            </div>
            <div className="text-sm md:text-base text-gray-600 font-medium">
              {label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        <TimeCard 
          value={time.days}
          prevValue={prevTime.days}
          label="天" 
          shouldAnimate={prevTime.days !== time.days}
        />
        <TimeCard 
          value={time.hours}
          prevValue={prevTime.hours}
          label="小时" 
          shouldAnimate={prevTime.hours !== time.hours}
        />
        <TimeCard 
          value={time.minutes}
          prevValue={prevTime.minutes}
          label="分钟" 
          shouldAnimate={prevTime.minutes !== time.minutes}
        />
        <TimeCard 
          value={time.seconds}
          prevValue={prevTime.seconds}
          label="秒" 
          shouldAnimate={prevTime.seconds !== time.seconds}
        />
      </div>
    </div>
  )
}

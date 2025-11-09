'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaEye } from 'react-icons/fa'
import { recordVisit, getVisitStats, VisitStats } from '../utils/visitCounter'

interface StatCardProps {
  label: string
  value: number
  delay: number
}

function StatCard({ label, value, delay }: StatCardProps) {
  return (
    <motion.div
      className="glass-card rounded-2xl p-6 min-w-[120px] flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-3xl md:text-4xl font-bold mb-2 gradient-text">
        {value.toLocaleString()}
      </div>
      <div className="text-sm md:text-base text-gray-600 font-medium">
        {label}
      </div>
    </motion.div>
  )
}

export default function VisitCounter() {
  const [stats, setStats] = useState<VisitStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // 记录访问
    recordVisit()
    
    // 更新统计
    setStats(getVisitStats())
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[150px]">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <motion.section
      className="flex flex-col items-center gap-8 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex items-center gap-3">
        <FaEye className="text-2xl text-pink-500" />
        <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">
          访问统计
        </h3>
        <FaEye className="text-2xl text-pink-500" />
      </div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
        <StatCard label="今日" value={stats.daily} delay={0} />
        <StatCard label="本周" value={stats.weekly} delay={0.1} />
        <StatCard label="本月" value={stats.monthly} delay={0.2} />
        <StatCard label="总计" value={stats.total} delay={0.3} />
      </div>
    </motion.section>
  )
}


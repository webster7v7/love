'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaEye } from 'react-icons/fa'
import { recordVisit, getVisitStatsWithCache } from '../actions/visits'

interface VisitStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

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
    const timer = setTimeout(() => {
      setIsClient(true)
    }, 0)
    
    // 优化：先显示缓存数据，再异步更新
    const initializeVisitTracking = async () => {
      try {
        // 先快速获取缓存的统计数据
        const cachedStats = await getVisitStatsWithCache()
        setStats(cachedStats)
        
        // 异步记录访问（不阻塞UI）
        recordVisit().catch(error => {
          console.error('Failed to record visit:', error)
        })
        
        // 延迟获取最新统计（避免阻塞初始渲染）
        setTimeout(async () => {
          try {
            const freshStats = await getVisitStatsWithCache()
            setStats(freshStats)
          } catch (error) {
            console.error('Failed to refresh stats:', error)
          }
        }, 1000)
        
      } catch (error) {
        console.error('Failed to initialize visit tracking:', error)
      }
    }
    
    initializeVisitTracking()
    
    return () => clearTimeout(timer)
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


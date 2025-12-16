'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEye, FaSync, FaWifi, FaWifiSlash } from 'react-icons/fa'
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
  previousValue: number
  delay: number
}

function StatCard({ label, value, previousValue, delay }: StatCardProps) {
  const hasIncreased = value > previousValue
  
  return (
    <motion.div
      className="glass-card rounded-2xl p-6 min-w-[120px] flex flex-col items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* 增长动画效果 */}
      <AnimatePresence>
        {hasIncreased && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="text-3xl md:text-4xl font-bold mb-2 gradient-text relative z-10"
        key={value}
        initial={{ scale: hasIncreased ? 1.2 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.div>
      
      <div className="text-sm md:text-base text-gray-600 font-medium relative z-10">
        {label}
      </div>

      {/* 增长指示器 */}
      <AnimatePresence>
        {hasIncreased && (
          <motion.div
            className="absolute top-2 right-2 text-green-500 text-xs"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            +{value - previousValue}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function RealTimeVisitCounter() {
  const [stats, setStats] = useState<VisitStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0
  })
  
  const [previousStats, setPreviousStats] = useState<VisitStats>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0
  })
  
  const [isClient, setIsClient] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasRecordedVisit = useRef(false)

  // 获取统计数据
  const fetchStats = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      
      const newStats = await getVisitStatsWithCache()
      
      // 保存之前的数据用于动画
      setPreviousStats(stats)
      setStats(newStats)
      setLastUpdate(new Date())
      setIsOnline(true)
      
    } catch (error) {
      console.error('Failed to fetch visit stats:', error)
      setIsOnline(false)
    } finally {
      if (showRefreshing) {
        setTimeout(() => setIsRefreshing(false), 500)
      }
    }
  }, [stats])

  // 记录访问
  const recordUserVisit = useCallback(async () => {
    if (hasRecordedVisit.current) return
    
    try {
      await recordVisit()
      hasRecordedVisit.current = true
      
      // 记录访问后立即刷新统计
      setTimeout(() => fetchStats(), 1000)
    } catch (error) {
      console.error('Failed to record visit:', error)
    }
  }, [fetchStats])

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    fetchStats(true)
  }, [fetchStats])

  // 初始化
  useEffect(() => {
    setIsClient(true)
    
    const initialize = async () => {
      // 先获取缓存数据
      await fetchStats()
      
      // 记录访问
      await recordUserVisit()
    }
    
    initialize()
  }, [fetchStats, recordUserVisit])

  // 设置实时更新
  useEffect(() => {
    if (!isClient) return

    // 每10秒更新一次统计数据
    intervalRef.current = setInterval(() => {
      fetchStats()
    }, 10000)

    // 监听网络状态
    const handleOnline = () => {
      setIsOnline(true)
      fetchStats()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 页面可见性变化时刷新
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isClient, fetchStats])

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
      {/* 标题和状态 */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <FaEye className="text-2xl text-pink-500" />
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">
            实时访问统计
          </h3>
          <FaEye className="text-2xl text-pink-500" />
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center gap-4 text-sm">
          {/* 网络状态 */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <FaWifi className="text-green-500" />
            ) : (
              <FaWifiSlash className="text-red-500" />
            )}
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? '在线' : '离线'}
            </span>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FaSync className={`text-xs ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          {/* 最后更新时间 */}
          {lastUpdate && (
            <span className="text-gray-500">
              更新于 {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
        <StatCard 
          label="今日" 
          value={stats.daily} 
          previousValue={previousStats.daily}
          delay={0} 
        />
        <StatCard 
          label="本周" 
          value={stats.weekly} 
          previousValue={previousStats.weekly}
          delay={0.1} 
        />
        <StatCard 
          label="本月" 
          value={stats.monthly} 
          previousValue={previousStats.monthly}
          delay={0.2} 
        />
        <StatCard 
          label="总计" 
          value={stats.total} 
          previousValue={previousStats.total}
          delay={0.3} 
        />
      </div>

      {/* 实时更新提示 */}
      <motion.div
        className="text-xs text-gray-400 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>每10秒自动更新</span>
      </motion.div>
    </motion.section>
  )
}
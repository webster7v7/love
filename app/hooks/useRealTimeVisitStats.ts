'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVisitStatsWithCache, getRealTimeVisitStats, refreshVisitStatsCache } from '../actions/visits'
import { recordClientVisit, shouldRecordVisit } from '../actions/client-visits'

interface VisitStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

interface UseRealTimeVisitStatsOptions {
  updateInterval?: number // 更新间隔（毫秒）
  enableRealTime?: boolean // 是否启用实时更新
  recordVisitOnMount?: boolean // 是否在组件挂载时记录访问
}

interface UseRealTimeVisitStatsReturn {
  stats: VisitStats
  previousStats: VisitStats
  isLoading: boolean
  isOnline: boolean
  lastUpdate: Date | null
  refresh: () => Promise<void>
  forceRefresh: () => Promise<void>
}

export function useRealTimeVisitStats(
  options: UseRealTimeVisitStatsOptions = {}
): UseRealTimeVisitStatsReturn {
  const {
    updateInterval = 10000, // 默认10秒
    enableRealTime = true,
    recordVisitOnMount = true
  } = options

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

  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasRecordedVisit = useRef(false)
  const isMountedRef = useRef(true)

  // 获取统计数据
  const fetchStats = useCallback(async (useCache = true) => {
    try {
      const newStats = useCache 
        ? await getVisitStatsWithCache()
        : await getRealTimeVisitStats()

      if (isMountedRef.current) {
        setPreviousStats(stats)
        setStats(newStats)
        setLastUpdate(new Date())
        setIsOnline(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch visit stats:', error)
      if (isMountedRef.current) {
        setIsOnline(false)
        setIsLoading(false)
      }
    }
  }, [stats])

  // 刷新（使用缓存）
  const refresh = useCallback(async () => {
    await fetchStats(true)
  }, [fetchStats])

  // 强制刷新（绕过缓存）
  const forceRefresh = useCallback(async () => {
    await refreshVisitStatsCache()
    await fetchStats(false)
  }, [fetchStats])

  // 记录访问
  const recordUserVisit = useCallback(async () => {
    if (hasRecordedVisit.current || !recordVisitOnMount) return

    // 检查是否需要记录访问
    if (!shouldRecordVisit()) {
      hasRecordedVisit.current = true
      return
    }

    try {
      const result = await recordClientVisit()
      hasRecordedVisit.current = true
      
      // 只有成功记录新访问时才刷新统计
      if (result.success && result.isNewSession) {
        setTimeout(() => {
          if (isMountedRef.current) {
            forceRefresh()
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to record visit:', error)
    }
  }, [recordVisitOnMount, forceRefresh])

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      // 先获取缓存数据
      await fetchStats(true)
      
      // 记录访问
      if (recordVisitOnMount) {
        await recordUserVisit()
      }
    }

    initialize()
  }, [fetchStats, recordUserVisit, recordVisitOnMount])

  // 设置实时更新
  useEffect(() => {
    if (!enableRealTime) return

    // 定期更新
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchStats(true)
      }
    }, updateInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enableRealTime, updateInterval, fetchStats])

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (isMountedRef.current) {
        fetchStats(true)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchStats])

  // 监听页面可见性
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current) {
        fetchStats(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchStats])

  // 清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    stats,
    previousStats,
    isLoading,
    isOnline,
    lastUpdate,
    refresh,
    forceRefresh
  }
}
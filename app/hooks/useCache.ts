'use client'

import { useState, useEffect, useCallback } from 'react'
import { globalCache } from '@/lib/cache'

/**
 * 前端缓存 Hook
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    refreshInterval?: number
    enabled?: boolean
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const {
    ttl = 5 * 60 * 1000, // 默认5分钟
    refreshInterval,
    enabled = true
  } = options

  const fetchData = useCallback(async (useCache = true) => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      let result: T

      if (useCache) {
        // 尝试从缓存获取
        result = await globalCache.getOrSet(key, fetcher, ttl)
      } else {
        // 强制刷新
        result = await fetcher()
        await globalCache.set(key, result, ttl)
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl, enabled])

  // 强制刷新
  const refresh = useCallback(() => {
    return fetchData(false)
  }, [fetchData])

  // 初始加载
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 定期刷新
  useEffect(() => {
    if (!refreshInterval || !enabled) return

    const interval = setInterval(() => {
      fetchData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchData, refreshInterval, enabled])

  return {
    data,
    loading,
    error,
    refresh
  }
}

/**
 * 数据列表缓存 Hook
 */
export function useDataCache<T>(
  resource: string,
  fetcher: () => Promise<T[]>,
  options: {
    ttl?: number
    refreshInterval?: number
  } = {}
) {
  return useCache(`data:${resource}`, fetcher, {
    ttl: options.ttl || 2 * 60 * 1000, // 默认2分钟
    refreshInterval: options.refreshInterval
  })
}

/**
 * 组件状态缓存 Hook
 */
export function useComponentCache<T>(
  componentName: string,
  initialState: T
) {
  const [state, setState] = useState<T>(initialState)
  const cacheKey = `component:${componentName}:state`

  // 从缓存恢复状态
  useEffect(() => {
    const restoreState = async () => {
      try {
        const cached = await globalCache.get<T>(cacheKey)
        if (cached !== null) {
          setState(cached)
        }
      } catch (error) {
        console.warn('Failed to restore component state:', error)
      }
    }

    restoreState()
  }, [cacheKey])

  // 保存状态到缓存
  const setCachedState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev)
        : newState

      // 异步保存到缓存
      globalCache.set(cacheKey, nextState, 10 * 60 * 1000) // 10分钟

      return nextState
    })
  }, [cacheKey])

  return [state, setCachedState] as const
}

/**
 * 预加载数据 Hook
 */
export function usePreloader(
  preloadFunctions: Array<() => Promise<any>>,
  enabled = true
) {
  const [preloaded, setPreloaded] = useState(false)

  useEffect(() => {
    if (!enabled || preloaded) return

    const preload = async () => {
      try {
        await Promise.all(preloadFunctions.map(fn => fn()))
        setPreloaded(true)
      } catch (error) {
        console.warn('Preloading failed:', error)
      }
    }

    // 延迟预加载，避免阻塞初始渲染
    const timer = setTimeout(preload, 100)
    return () => clearTimeout(timer)
  }, [preloadFunctions, enabled, preloaded])

  return preloaded
}
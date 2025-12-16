// 缓存装饰器和工具函数

import { dataCache, globalCache } from './index'

/**
 * 缓存键生成器
 */
export function generateCacheKey(prefix: string, ...args: any[]): string {
  const argsStr = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(':')
  
  return `${prefix}:${Buffer.from(argsStr).toString('base64').slice(0, 32)}`
}

/**
 * 带缓存的函数包装器
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyPrefix: string
    ttl?: number
    cache?: typeof dataCache
  }
): T {
  const cache = options.cache || dataCache
  
  return (async (...args: any[]) => {
    const key = generateCacheKey(options.keyPrefix, ...args)
    
    return cache.getOrSet(key, () => fn(...args), options.ttl)
  }) as T
}

/**
 * Server Actions 缓存装饰器
 */
export function cacheServerAction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl?: number
): T {
  return withCache(fn, {
    keyPrefix: `action:${keyPrefix}`,
    ttl,
    cache: dataCache
  })
}

/**
 * 查询结果缓存装饰器
 */
export function cacheQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl?: number
): T {
  return withCache(fn, {
    keyPrefix: `query:${keyPrefix}`,
    ttl,
    cache: dataCache
  })
}

/**
 * 组件数据缓存装饰器
 */
export function cacheComponentData<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl?: number
): T {
  return withCache(fn, {
    keyPrefix: `component:${keyPrefix}`,
    ttl: ttl || 2 * 60 * 1000, // 默认2分钟
    cache: globalCache
  })
}

/**
 * 缓存失效工具
 */
export class CacheInvalidator {
  /**
   * 按前缀失效缓存
   */
  static async invalidateByPrefix(prefix: string): Promise<void> {
    // 这里需要扩展缓存类以支持按前缀删除
    // 暂时清空所有缓存
    await Promise.all([
      dataCache.clear(),
      globalCache.clear()
    ])
  }

  /**
   * 失效特定资源的缓存
   */
  static async invalidateResource(resource: string, id?: string): Promise<void> {
    const patterns = [
      `action:${resource}`,
      `query:${resource}`,
      `component:${resource}`
    ]

    if (id) {
      patterns.push(
        ...patterns.map(p => `${p}:${id}`)
      )
    }

    // 实际实现中需要支持模式匹配删除
    // 这里暂时清空相关缓存
    await Promise.all([
      dataCache.clear(),
      globalCache.clear()
    ])
  }
}

/**
 * 预加载缓存
 */
export class CachePreloader {
  /**
   * 预加载常用数据
   */
  static async preloadCommonData(): Promise<void> {
    try {
      // 这里可以预加载一些常用的数据
      console.log('Preloading common data...')
      
      // 例如：预加载访问统计、默认照片等
      // 具体实现根据业务需求
    } catch (error) {
      console.warn('Failed to preload data:', error)
    }
  }

  /**
   * 后台刷新缓存
   */
  static async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    cache = dataCache
  ): Promise<void> {
    try {
      const data = await fetcher()
      await cache.set(key, data)
    } catch (error) {
      console.warn('Background cache refresh failed:', error)
    }
  }
}
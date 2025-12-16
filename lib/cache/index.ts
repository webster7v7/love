// 多层缓存系统

/**
 * 内存缓存配置
 */
export interface CacheConfig {
  ttl: number // 生存时间（毫秒）
  maxSize: number // 最大缓存条目数
  enableLocalStorage: boolean // 是否启用 localStorage 持久化
}

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * 多层缓存管理器
 */
export class MultiLayerCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 5 * 60 * 1000, // 默认5分钟
      maxSize: 100, // 默认100条
      enableLocalStorage: true,
      ...config
    }

    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000) // 每分钟清理一次
  }

  /**
   * 生成缓存键
   */
  private generateKey(prefix: string, params: any): string {
    const paramStr = JSON.stringify(params)
    return `${prefix}:${Buffer.from(paramStr).toString('base64')}`
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. 先检查内存缓存
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
      return memoryEntry.data
    }

    // 2. 检查 localStorage（仅在浏览器环境）
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache:${key}`)
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored)
          if (Date.now() - entry.timestamp < entry.ttl) {
            // 恢复到内存缓存
            this.memoryCache.set(key, entry)
            return entry.data
          } else {
            // 过期，删除
            localStorage.removeItem(`cache:${key}`)
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage cache:', error)
      }
    }

    return null
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    const ttl = customTtl || this.config.ttl
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    // 1. 设置内存缓存
    this.memoryCache.set(key, entry)

    // 2. 设置 localStorage（仅在浏览器环境）
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(entry))
      } catch (error) {
        console.warn('Failed to write to localStorage cache:', error)
      }
    }

    // 3. 检查缓存大小限制
    if (this.memoryCache.size > this.config.maxSize) {
      this.evictOldest()
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache:${key}`)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    
    if (typeof window !== 'undefined') {
      // 清理所有以 'cache:' 开头的 localStorage 项
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * 带缓存的数据获取
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 缓存未命中，执行获取函数
    const data = await fetcher()
    await this.set(key, data, customTtl)
    return data
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * 驱逐最旧的缓存条目
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      maxSize: this.config.maxSize,
      config: this.config
    }
  }
}

// 全局缓存实例
export const globalCache = new MultiLayerCache({
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 200,
  enableLocalStorage: true
})

// 专用缓存实例
export const dataCache = new MultiLayerCache({
  ttl: 10 * 60 * 1000, // 10分钟 - 数据缓存时间更长
  maxSize: 50,
  enableLocalStorage: true
})

export const uiCache = new MultiLayerCache({
  ttl: 2 * 60 * 1000, // 2分钟 - UI状态缓存时间较短
  maxSize: 100,
  enableLocalStorage: false // UI状态不需要持久化
})
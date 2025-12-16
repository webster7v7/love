// 分页查询优化

import { SQL, asc, desc } from 'drizzle-orm'

// 分页参数类型
export interface PaginationParams {
  page: number
  limit: number
  orderBy?: 'asc' | 'desc'
  orderField?: string
}

// 分页结果类型
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 分页配置
export interface PaginationConfig {
  defaultLimit: number
  maxLimit: number
  minLimit: number
}

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
}

/**
 * 验证和标准化分页参数
 */
export function validatePaginationParams(
  params: Partial<PaginationParams>,
  config: PaginationConfig = DEFAULT_PAGINATION_CONFIG
): PaginationParams {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(
    config.maxLimit,
    Math.max(config.minLimit, params.limit || config.defaultLimit)
  )
  
  return {
    page,
    limit,
    orderBy: params.orderBy || 'desc',
    orderField: params.orderField || 'createdAt',
  }
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * 创建分页结果
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit)
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}

/**
 * 构建排序SQL
 */
export function buildOrderBySQL(
  field: any,
  orderBy: 'asc' | 'desc'
): SQL {
  return orderBy === 'asc' ? asc(field) : desc(field)
}

/**
 * 游标分页参数
 */
export interface CursorPaginationParams {
  cursor?: string
  limit: number
  orderBy?: 'asc' | 'desc'
}

/**
 * 游标分页结果
 */
export interface CursorPaginatedResult<T> {
  data: T[]
  nextCursor?: string
  hasNext: boolean
}

/**
 * 创建游标分页结果
 */
export function createCursorPaginatedResult<T extends { id: string }>(
  data: T[],
  limit: number
): CursorPaginatedResult<T> {
  const hasNext = data.length > limit
  const resultData = hasNext ? data.slice(0, limit) : data
  const nextCursor = hasNext ? resultData[resultData.length - 1].id : undefined
  
  return {
    data: resultData,
    nextCursor,
    hasNext,
  }
}

/**
 * 分页性能监控
 */
export class PaginationMetrics {
  private static metrics: Map<string, {
    totalQueries: number
    totalTime: number
    averageTime: number
    slowQueries: number
  }> = new Map()
  
  static recordQuery(operation: string, duration: number, threshold: number = 1000) {
    const current = this.metrics.get(operation) || {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      slowQueries: 0,
    }
    
    current.totalQueries++
    current.totalTime += duration
    current.averageTime = current.totalTime / current.totalQueries
    
    if (duration > threshold) {
      current.slowQueries++
    }
    
    this.metrics.set(operation, current)
  }
  
  static getMetrics(operation?: string) {
    if (operation) {
      return this.metrics.get(operation)
    }
    return Object.fromEntries(this.metrics.entries())
  }
  
  static reset() {
    this.metrics.clear()
  }
}

/**
 * 分页查询装饰器
 */
export function withPaginationMetrics<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      const result = await fn(...args)
      const duration = Date.now() - startTime
      
      PaginationMetrics.recordQuery(operation, duration)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      PaginationMetrics.recordQuery(`${operation}_error`, duration)
      throw error
    }
  }
}

/**
 * 批量查询优化
 */
export interface BatchQueryConfig {
  batchSize: number
  maxConcurrency: number
  retryAttempts: number
}

export const DEFAULT_BATCH_CONFIG: BatchQueryConfig = {
  batchSize: 50,
  maxConcurrency: 5,
  retryAttempts: 3,
}

/**
 * 批量处理数据
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  config: BatchQueryConfig = DEFAULT_BATCH_CONFIG
): Promise<R[]> {
  const results: R[] = []
  const batches: T[][] = []
  
  // 分割成批次
  for (let i = 0; i < items.length; i += config.batchSize) {
    batches.push(items.slice(i, i + config.batchSize))
  }
  
  // 并发处理批次
  const semaphore = new Semaphore(config.maxConcurrency)
  
  const batchPromises = batches.map(async (batch) => {
    await semaphore.acquire()
    
    try {
      return await withRetry(
        () => processor(batch),
        config.retryAttempts
      )
    } finally {
      semaphore.release()
    }
  })
  
  const batchResults = await Promise.all(batchPromises)
  
  // 合并结果
  for (const batchResult of batchResults) {
    results.push(...batchResult)
  }
  
  return results
}

/**
 * 信号量实现（控制并发）
 */
class Semaphore {
  private permits: number
  private waiting: (() => void)[] = []
  
  constructor(permits: number) {
    this.permits = permits
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }
    
    return new Promise<void>((resolve) => {
      this.waiting.push(resolve)
    })
  }
  
  release(): void {
    this.permits++
    
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!
      this.permits--
      resolve()
    }
  }
}

/**
 * 重试机制
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError!
}
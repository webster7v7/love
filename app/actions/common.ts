'use server'

import { repositories } from '@/lib/repositories'
import { 
  type ActionResult,
  createSuccessResult,
  createErrorResult,
  handleDatabaseError
} from '@/lib/types/database'
import { errorHandler, ErrorType } from '@/lib/error-handling'
import { fallbackService } from '@/lib/error-handling/fallback-service'

// 增强的错误处理装饰器
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  fallbackFn?: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ActionResult<R>> => {
    try {
      // 使用重试机制执行主要操作
      const result = await errorHandler.retry.execute(async () => {
        // 确保repositories已初始化
        if (!repositories.isInitialized()) {
          await repositories.initialize()
        }
        return await fn(...args)
      })
      
      return createSuccessResult(result)
    } catch (error) {
      // 分类错误并记录
      const errorInfo = errorHandler.classify(error)
      errorHandler.log(errorInfo, { function: fn.name, args })
      
      // 尝试降级服务
      if (fallbackFn) {
        try {
          console.warn(`Using fallback service for ${fn.name}`)
          const fallbackResult = await fallbackFn(...args)
          return createSuccessResult(fallbackResult)
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${fn.name}:`, fallbackError)
        }
      }
      
      // 返回用户友好的错误消息
      const userMessage = errorHandler.getUserMessage(errorInfo.type)
      return createErrorResult(userMessage, errorInfo.type)
    }
  }
}

// 增强的健康检查
export async function healthCheck(): Promise<ActionResult<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  database: boolean
  repositories: boolean
  localStorage: boolean
  errorStats: Record<string, unknown>
  timestamp: string
}>> {
  try {
    // 检查repositories初始化状态
    const repositoriesInitialized = repositories.isInitialized()
    
    // 如果未初始化，尝试初始化
    let databaseConnected = false
    if (!repositoriesInitialized) {
      databaseConnected = await repositories.initialize()
    } else {
      databaseConnected = true
    }

    // 尝试执行简单查询来验证数据库连接
    if (databaseConnected) {
      try {
        await repositories.messages.count()
        databaseConnected = true
      } catch {
        databaseConnected = false
      }
    }

    // 检查 localStorage 可用性
    const localStorageAvailable = fallbackService.isAvailable()
    
    // 获取错误统计
    const errorStats = errorHandler.getStats()

    // 确定系统状态
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (databaseConnected && repositories.isInitialized()) {
      status = 'healthy'
    } else if (localStorageAvailable) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    return createSuccessResult({
      status,
      database: databaseConnected,
      repositories: repositories.isInitialized(),
      localStorage: localStorageAvailable,
      errorStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    const errorInfo = errorHandler.classify(error)
    errorHandler.log(errorInfo, { context: 'healthCheck' })
    
    const userMessage = errorHandler.getUserMessage(errorInfo.type)
    return createErrorResult(userMessage, errorInfo.type)
  }
}

// 获取所有统计信息
export async function getAllStats(): Promise<ActionResult<{
  messages: { total: number }
  photos: { total: number, custom: number, default: number }
  quotes: { total: number, thisWeek: number, thisMonth: number, averageLength: number }
  timestamp: string
}>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取所有统计信息
    const stats = await repositories.getStats()
    
    return createSuccessResult({
      ...stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to get all stats:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 初始化数据库和repositories
export async function initializeSystem(): Promise<ActionResult<{
  initialized: boolean
  timestamp: string
}>> {
  try {
    const initialized = await repositories.initialize()
    
    return createSuccessResult({
      initialized,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to initialize system:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 重置系统（仅开发环境）
export async function resetSystem(): Promise<ActionResult<{
  reset: boolean
  timestamp: string
}>> {
  if (process.env.NODE_ENV === 'production') {
    return createErrorResult('系统重置在生产环境中不可用', 'FORBIDDEN')
  }

  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 清理所有数据
    const cleared = await repositories.clearAllData()
    
    return createSuccessResult({
      reset: cleared,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to reset system:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 通用的重试机制
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
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
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`, error)
    }
  }
  
  throw lastError!
}

// 批量操作的通用处理
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    )
    results.push(...batchResults)
  }
  
  return results
}

// 验证环境配置
export async function validateEnvironment(): Promise<ActionResult<{
  valid: boolean
  issues: string[]
  timestamp: string
}>> {
  const issues: string[] = []
  
  try {
    // 检查必要的环境变量
    if (!process.env.DATABASE_URL) {
      issues.push('DATABASE_URL environment variable is missing')
    }
    
    // 检查数据库连接
    try {
      if (!repositories.isInitialized()) {
        await repositories.initialize()
      }
      await repositories.messages.count()
    } catch (error) {
      issues.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // 检查 localStorage 可用性
    if (!fallbackService.isAvailable()) {
      issues.push('localStorage is not available for fallback service')
    }
    
    // 检查Node.js版本
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    if (majorVersion < 18) {
      issues.push(`Node.js version ${nodeVersion} is not supported, please use Node.js 18 or higher`)
    }
    
    return createSuccessResult({
      valid: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Environment validation failed:', error)
    const errorInfo = errorHandler.classify(error)
    errorHandler.log(errorInfo, { context: 'validateEnvironment' })
    
    const userMessage = errorHandler.getUserMessage(errorInfo.type)
    return createErrorResult(userMessage, errorInfo.type)
  }
}

// 获取错误日志
export async function getErrorLogs(filter?: {
  type?: ErrorType
  limit?: number
  since?: number
}): Promise<ActionResult<unknown[]>> {
  try {
    const logs = errorHandler.getLogs(filter)
    return createSuccessResult(logs)
  } catch (error) {
    console.error('Failed to get error logs:', error)
    return createErrorResult('获取错误日志失败', 'LOG_ERROR')
  }
}

// 清理错误日志
export async function clearErrorLogs(): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    errorHandler.clearLogs()
    return createSuccessResult({ cleared: true })
  } catch (error) {
    console.error('Failed to clear error logs:', error)
    return createErrorResult('清理错误日志失败', 'LOG_ERROR')
  }
}

// 获取降级服务状态
export async function getFallbackStatus(): Promise<ActionResult<{
  available: boolean
  storageInfo: {
    available: boolean
    usage: number
    quota: number
    usagePercent?: number
  }
  dataExists: {
    messages: boolean
    photos: boolean
    quotes: boolean
  }
}>> {
  try {
    const available = fallbackService.isAvailable()
    const storageInfo = fallbackService.getStorageInfo()
    
    // 检查是否有降级数据
    const [messages, photos, quotes] = await Promise.all([
      fallbackService.messages.getAll(),
      fallbackService.photos.getAll(),
      fallbackService.quotes.getAll()
    ])
    
    return createSuccessResult({
      available,
      storageInfo,
      dataExists: {
        messages: messages.length > 0,
        photos: photos.length > 0,
        quotes: quotes.length > 0
      }
    })
  } catch (error) {
    console.error('Failed to get fallback status:', error)
    return createErrorResult('获取降级服务状态失败', 'FALLBACK_ERROR')
  }
}
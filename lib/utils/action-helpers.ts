import { repositories } from '@/lib/repositories'
import { 
  type ActionResult,
  createSuccessResult,
  createErrorResult,
} from '@/lib/types/database'
import { errorHandler } from '@/lib/error-handling'
// import { fallbackService } from '@/lib/error-handling/fallback-service'

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
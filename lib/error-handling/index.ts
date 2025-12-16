/**
 * 错误处理和重试机制
 * 提供网络错误重试、降级服务、错误日志记录等功能
 */

import { z } from 'zod'

// 错误类型定义
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string
  details?: Record<string, any>
  timestamp: number
  retryable: boolean
}

// 重试配置
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.DATABASE]
}

// 错误分类器
export class ErrorClassifier {
  static classify(error: unknown): ErrorInfo {
    const timestamp = Date.now()
    
    if (error instanceof z.ZodError) {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        message: '数据验证失败',
        details: { issues: error.issues },
        timestamp,
        retryable: false
      }
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // 网络错误
      if (message.includes('network') || message.includes('fetch') || 
          message.includes('timeout') || message.includes('connection')) {
        return {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.HIGH,
          message: '网络连接失败',
          details: { originalMessage: error.message },
          timestamp,
          retryable: true
        }
      }
      
      // 数据库错误
      if (message.includes('database') || message.includes('sql') || 
          message.includes('connection') || message.includes('pool')) {
        return {
          type: ErrorType.DATABASE,
          severity: ErrorSeverity.CRITICAL,
          message: '数据库操作失败',
          details: { originalMessage: error.message },
          timestamp,
          retryable: true
        }
      }
      
      // 权限错误
      if (message.includes('permission') || message.includes('unauthorized') || 
          message.includes('forbidden')) {
        return {
          type: ErrorType.PERMISSION,
          severity: ErrorSeverity.HIGH,
          message: '权限不足',
          details: { originalMessage: error.message },
          timestamp,
          retryable: false
        }
      }
      
      // 限流错误
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return {
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: '请求过于频繁',
          details: { originalMessage: error.message },
          timestamp,
          retryable: true
        }
      }
    }
    
    // 未知错误
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: '未知错误',
      details: { error: String(error) },
      timestamp,
      retryable: false
    }
  }
}

// 重试机制
export class RetryManager {
  private config: RetryConfig
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }
  
  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: ErrorInfo | null = null
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const errorInfo = ErrorClassifier.classify(error)
        lastError = errorInfo
        
        // 记录错误
        ErrorLogger.log(errorInfo, { context, attempt })
        
        // 检查是否可重试
        if (!this.shouldRetry(errorInfo, attempt)) {
          throw error
        }
        
        // 等待重试
        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt)
          await this.sleep(delay)
        }
      }
    }
    
    // 所有重试都失败了
    throw new Error(`操作失败，已重试 ${this.config.maxAttempts} 次`)
  }
  
  private shouldRetry(errorInfo: ErrorInfo, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) return false
    if (!errorInfo.retryable) return false
    return this.config.retryableErrors.includes(errorInfo.type)
  }
  
  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.config.maxDelay)
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 错误日志记录器
export class ErrorLogger {
  private static logs: Array<ErrorInfo & { context?: Record<string, any> }> = []
  private static maxLogs = 1000
  
  static log(errorInfo: ErrorInfo, context?: Record<string, any>) {
    const logEntry = { ...errorInfo, context }
    
    // 确保 logs 数组已初始化
    if (!this.logs) {
      this.logs = []
    }
    
    // 添加到内存日志
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', logEntry)
    }
    
    // 可以在这里添加外部日志服务集成
    // 例如：Sentry, LogRocket 等
  }
  
  static getLogs(filter?: {
    type?: ErrorType
    severity?: ErrorSeverity
    since?: number
    limit?: number
  }): Array<ErrorInfo & { context?: Record<string, any> }> {
    let filteredLogs = [...this.logs]
    
    if (filter?.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filter.type)
    }
    
    if (filter?.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filter.severity)
    }
    
    if (filter?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!)
    }
    
    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(0, filter.limit)
    }
    
    return filteredLogs
  }
  
  static clearLogs() {
    this.logs = []
  }
  
  static getStats() {
    // 确保 logs 数组已初始化
    if (!this.logs) {
      this.logs = []
    }
    
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    
    const recentLogs = this.logs.filter(log => now - log.timestamp < oneHour)
    const dailyLogs = this.logs.filter(log => now - log.timestamp < oneDay)
    
    return {
      total: this.logs.length,
      lastHour: recentLogs.length,
      lastDay: dailyLogs.length,
      byType: ErrorLogger.groupBy(this.logs, 'type'),
      bySeverity: ErrorLogger.groupBy(this.logs, 'severity')
    }
  }
  
  private static groupBy<T extends Record<string, any>>(
    array: T[], 
    key: keyof T
  ): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key])
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

// 降级服务管理器
export class FallbackManager {
  private static fallbackData = new Map<string, any>()
  
  static setFallbackData(key: string, data: any) {
    this.fallbackData.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  static getFallbackData(key: string, maxAge: number = 5 * 60 * 1000): any {
    const entry = this.fallbackData.get(key)
    if (!entry) return null
    
    const age = Date.now() - entry.timestamp
    if (age > maxAge) {
      this.fallbackData.delete(key)
      return null
    }
    
    return entry.data
  }
  
  static clearFallbackData(key?: string) {
    if (key) {
      this.fallbackData.delete(key)
    } else {
      this.fallbackData.clear()
    }
  }
}

// 用户友好的错误消息
export class UserErrorMessages {
  private static messages = {
    [ErrorType.NETWORK]: '网络连接不稳定，请检查网络后重试',
    [ErrorType.DATABASE]: '数据保存失败，请稍后重试',
    [ErrorType.VALIDATION]: '输入的信息格式不正确，请检查后重新输入',
    [ErrorType.PERMISSION]: '您没有执行此操作的权限',
    [ErrorType.RATE_LIMIT]: '操作过于频繁，请稍后再试',
    [ErrorType.UNKNOWN]: '操作失败，请稍后重试'
  } as const
  
  static getMessage(errorType: ErrorType): string {
    return this.messages[errorType] || this.messages[ErrorType.UNKNOWN]
  }
  
  static getMessageWithAction(errorType: ErrorType): { message: string; action?: string } {
    const message = this.getMessage(errorType)
    
    switch (errorType) {
      case ErrorType.NETWORK:
        return { message, action: '重试' }
      case ErrorType.DATABASE:
        return { message, action: '重试' }
      case ErrorType.VALIDATION:
        return { message, action: '修改' }
      case ErrorType.RATE_LIMIT:
        return { message, action: '稍后重试' }
      default:
        return { message }
    }
  }
}

// 导出主要工具
export const errorHandler = {
  classify: ErrorClassifier.classify,
  retry: new RetryManager(),
  log: ErrorLogger.log,
  getLogs: ErrorLogger.getLogs,
  getStats: ErrorLogger.getStats,
  clearLogs: ErrorLogger.clearLogs,
  setFallback: FallbackManager.setFallbackData,
  getFallback: FallbackManager.getFallbackData,
  getUserMessage: UserErrorMessages.getMessage,
  getUserMessageWithAction: UserErrorMessages.getMessageWithAction
}
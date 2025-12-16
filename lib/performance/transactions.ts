// 并发操作的事务处理

import { drizzle } from 'drizzle-orm/neon-http'
import { withConnection } from './connection-pool'

// 事务配置
export interface TransactionConfig {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export const DEFAULT_TRANSACTION_CONFIG: TransactionConfig = {
  isolationLevel: 'READ COMMITTED',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
}

// 事务结果
export interface TransactionResult<T> {
  success: boolean
  data?: T
  error?: string
  retryCount: number
  duration: number
}

/**
 * 执行事务
 */
export async function executeTransaction<T>(
  operation: (tx: any) => Promise<T>,
  config: TransactionConfig = DEFAULT_TRANSACTION_CONFIG
): Promise<TransactionResult<T>> {
  const startTime = Date.now()
  let retryCount = 0
  let lastError: Error | null = null
  
  const fullConfig = { ...DEFAULT_TRANSACTION_CONFIG, ...config }
  
  while (retryCount <= (fullConfig.retryAttempts || 0)) {
    try {
      const result = await withConnection(async (sqlConnection) => {
        const db = drizzle(sqlConnection)
        
        return await db.transaction(async (tx) => {
          // 设置事务隔离级别
          if (fullConfig.isolationLevel) {
            await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL ${sql.raw(fullConfig.isolationLevel)}`)
          }
          
          // 设置事务超时
          if (fullConfig.timeout) {
            await tx.execute(sql`SET LOCAL statement_timeout = ${fullConfig.timeout}`)
          }
          
          return await operation(tx)
        })
      })
      
      return {
        success: true,
        data: result,
        retryCount,
        duration: Date.now() - startTime,
      }
      
    } catch (error) {
      lastError = error as Error
      retryCount++
      
      // 检查是否应该重试
      if (retryCount <= (fullConfig.retryAttempts || 0) && isRetryableError(error)) {
        const delay = (fullConfig.retryDelay || 1000) * Math.pow(2, retryCount - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      break
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Unknown transaction error',
    retryCount,
    duration: Date.now() - startTime,
  }
}

/**
 * 检查错误是否可重试
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const message = error.message.toLowerCase()
  
  // 可重试的错误类型
  const retryableErrors = [
    'serialization failure',
    'deadlock detected',
    'connection',
    'timeout',
    'temporary',
    'retry',
  ]
  
  return retryableErrors.some(keyword => message.includes(keyword))
}

/**
 * 批量事务处理
 */
export async function executeBatchTransaction<T, R>(
  items: T[],
  operation: (tx: any, batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
  config: TransactionConfig = DEFAULT_TRANSACTION_CONFIG
): Promise<TransactionResult<R[]>> {
  const startTime = Date.now()
  const results: R[] = []
  
  try {
    // 分批处理
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      const batchResult = await executeTransaction(
        async (tx) => await operation(tx, batch),
        config
      )
      
      if (!batchResult.success) {
        return {
          success: false,
          error: `Batch ${Math.floor(i / batchSize) + 1} failed: ${batchResult.error}`,
          retryCount: batchResult.retryCount,
          duration: Date.now() - startTime,
        }
      }
      
      if (batchResult.data) {
        results.push(...batchResult.data)
      }
    }
    
    return {
      success: true,
      data: results,
      retryCount: 0,
      duration: Date.now() - startTime,
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown batch transaction error',
      retryCount: 0,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * 并发安全的计数器更新
 */
export async function safeCounterUpdate(
  table: string,
  id: string,
  increment: number = 1,
  config: TransactionConfig = DEFAULT_TRANSACTION_CONFIG
): Promise<TransactionResult<number>> {
  return await executeTransaction(async (tx) => {
    // 使用 SELECT FOR UPDATE 锁定行
    const [current] = await tx.execute(
      sql`SELECT counter FROM ${sql.identifier(table)} WHERE id = ${id} FOR UPDATE`
    )
    
    const newValue = (current?.counter || 0) + increment
    
    await tx.execute(
      sql`UPDATE ${sql.identifier(table)} SET counter = ${newValue} WHERE id = ${id}`
    )
    
    return newValue
  }, config)
}

/**
 * 乐观锁更新
 */
export async function optimisticUpdate<T>(
  getRecord: () => Promise<T & { version: number }>,
  updateRecord: (record: T & { version: number }) => Promise<T & { version: number }>,
  maxRetries: number = 5
): Promise<TransactionResult<T & { version: number }>> {
  const startTime = Date.now()
  let retryCount = 0
  
  while (retryCount < maxRetries) {
    try {
      const record = await getRecord()
      const updatedRecord = await updateRecord(record)
      
      return {
        success: true,
        data: updatedRecord,
        retryCount,
        duration: Date.now() - startTime,
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('version')) {
        retryCount++
        // 短暂延迟后重试
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        continue
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown optimistic lock error',
        retryCount,
        duration: Date.now() - startTime,
      }
    }
  }
  
  return {
    success: false,
    error: 'Maximum retry attempts exceeded for optimistic lock',
    retryCount,
    duration: Date.now() - startTime,
  }
}

/**
 * 分布式锁实现
 */
export class DistributedLock {
  private lockName: string
  private timeout: number
  private acquired = false
  
  constructor(lockName: string, timeout: number = 30000) {
    this.lockName = lockName
    this.timeout = timeout
  }
  
  async acquire(): Promise<boolean> {
    if (this.acquired) {
      return true
    }
    
    try {
      const result = await withConnection(async (sqlConnection) => {
        // 尝试获取锁
        const [lock] = await sqlConnection`
          INSERT INTO distributed_locks (name, expires_at, created_at)
          VALUES (${this.lockName}, ${new Date(Date.now() + this.timeout)}, NOW())
          ON CONFLICT (name) DO NOTHING
          RETURNING name
        `
        
        return !!lock
      })
      
      this.acquired = result
      return result
      
    } catch (error) {
      console.error('Failed to acquire distributed lock:', error)
      return false
    }
  }
  
  async release(): Promise<boolean> {
    if (!this.acquired) {
      return true
    }
    
    try {
      await withConnection(async (sqlConnection) => {
        await sqlConnection`DELETE FROM distributed_locks WHERE name = ${this.lockName}`
      })
      
      this.acquired = false
      return true
      
    } catch (error) {
      console.error('Failed to release distributed lock:', error)
      return false
    }
  }
  
  async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire()
    
    if (!acquired) {
      throw new Error(`Failed to acquire lock: ${this.lockName}`)
    }
    
    try {
      return await operation()
    } finally {
      await this.release()
    }
  }
}

/**
 * 事务监控
 */
export class TransactionMonitor {
  private static metrics: {
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    totalRetries: number
    averageDuration: number
    slowTransactions: number
  } = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalRetries: 0,
    averageDuration: 0,
    slowTransactions: 0,
  }
  
  static recordTransaction(result: TransactionResult<any>) {
    this.metrics.totalTransactions++
    this.metrics.totalRetries += result.retryCount
    
    if (result.success) {
      this.metrics.successfulTransactions++
    } else {
      this.metrics.failedTransactions++
    }
    
    // 更新平均持续时间
    this.metrics.averageDuration = 
      (this.metrics.averageDuration * (this.metrics.totalTransactions - 1) + result.duration) / 
      this.metrics.totalTransactions
    
    // 记录慢事务（超过5秒）
    if (result.duration > 5000) {
      this.metrics.slowTransactions++
    }
  }
  
  static getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalTransactions > 0 
        ? this.metrics.successfulTransactions / this.metrics.totalTransactions 
        : 0,
      averageRetries: this.metrics.totalTransactions > 0
        ? this.metrics.totalRetries / this.metrics.totalTransactions
        : 0,
    }
  }
  
  static reset() {
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalRetries: 0,
      averageDuration: 0,
      slowTransactions: 0,
    }
  }
}

// 导入sql函数
import { sql } from 'drizzle-orm'
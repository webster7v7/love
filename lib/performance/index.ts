// 性能优化模块统一导出

export * from './pagination'
export * from './connection-pool'
export * from './transactions'
export * from './query-optimization'

// 便捷的性能优化函数
export {
  validatePaginationParams,
  createPaginatedResult,
  withPaginationMetrics,
  processBatch,
} from './pagination'

export {
  getConnectionPool,
  withConnection,
  withConnectionPool,
  ConnectionPoolMonitor,
} from './connection-pool'

export {
  executeTransaction,
  executeBatchTransaction,
  TransactionMonitor,
  DistributedLock,
} from './transactions'

export {
  executeWithCache,
  IndexManager,
  QueryOptimizer,
  QueryPerformanceMonitor,
  DatabaseMaintenance,
  queryCache,
} from './query-optimization'

// 性能监控聚合
import { PaginationMetrics } from './pagination'
import { ConnectionPoolMonitor } from './connection-pool'
import { TransactionMonitor } from './transactions'
import { QueryPerformanceMonitor } from './query-optimization'

/**
 * 获取所有性能指标
 */
export function getAllPerformanceMetrics() {
  return {
    pagination: PaginationMetrics.getMetrics(),
    connectionPool: ConnectionPoolMonitor.getMetrics(),
    transactions: TransactionMonitor.getMetrics(),
    queries: {
      slowQueries: QueryPerformanceMonitor.getSlowQueries(),
      frequentQueries: QueryPerformanceMonitor.getFrequentQueries(),
      allMetrics: QueryPerformanceMonitor.getAllMetrics(),
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * 重置所有性能指标
 */
export function resetAllPerformanceMetrics() {
  PaginationMetrics.reset()
  ConnectionPoolMonitor.reset()
  TransactionMonitor.reset()
  QueryPerformanceMonitor.reset()
}

/**
 * 性能优化建议
 */
export async function getPerformanceRecommendations(): Promise<{
  recommendations: string[]
  metrics: any
}> {
  const recommendations: string[] = []
  const metrics = getAllPerformanceMetrics()
  
  // 连接池建议
  const poolMetrics = metrics.connectionPool
  if (poolMetrics.connectionErrors > poolMetrics.totalQueries * 0.05) {
    recommendations.push('High connection error rate detected. Consider increasing connection pool size or checking database connectivity.')
  }
  
  if (poolMetrics.poolExhausted > 0) {
    recommendations.push('Connection pool exhaustion detected. Consider increasing maxConnections or optimizing query performance.')
  }
  
  // 事务建议
  const txMetrics = metrics.transactions
  if (txMetrics.successRate < 0.95) {
    recommendations.push('Low transaction success rate. Review error handling and retry logic.')
  }
  
  if (txMetrics.averageRetries > 1) {
    recommendations.push('High retry rate detected. Consider optimizing transaction logic or reducing contention.')
  }
  
  // 查询建议
  const slowQueries = metrics.queries.slowQueries
  if (slowQueries.length > 0) {
    recommendations.push(`${slowQueries.length} slow queries detected. Consider adding indexes or optimizing query logic.`)
  }
  
  // 分页建议
  const paginationMetrics = metrics.pagination
  if (paginationMetrics && Object.keys(paginationMetrics).length > 0) {
    for (const [operation, stats] of Object.entries(paginationMetrics)) {
      if (typeof stats === 'object' && stats !== null && 'slowQueries' in stats) {
        const operationStats = stats as any
        if (operationStats.slowQueries > operationStats.totalQueries * 0.1) {
          recommendations.push(`Slow pagination queries detected for ${operation}. Consider optimizing indexes or reducing page size.`)
        }
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('No performance issues detected. System is performing well.')
  }
  
  return {
    recommendations,
    metrics,
  }
}
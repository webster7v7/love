// 查询优化和索引管理

import { sql } from 'drizzle-orm'
import { withConnection } from './connection-pool'

// 查询优化配置
export interface QueryOptimizationConfig {
  enableQueryCache: boolean
  cacheTimeout: number
  slowQueryThreshold: number
  explainAnalyze: boolean
}

export const DEFAULT_QUERY_CONFIG: QueryOptimizationConfig = {
  enableQueryCache: true,
  cacheTimeout: 300000, // 5 minutes
  slowQueryThreshold: 1000, // 1 second
  explainAnalyze: false,
}

// 查询缓存
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private timeout: number
  
  constructor(timeout: number = 300000) {
    this.timeout = timeout
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.timeout) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

const queryCache = new QueryCache()

/**
 * 生成查询缓存键
 */
function generateCacheKey(query: string, params: any[]): string {
  return `${query}:${JSON.stringify(params)}`
}

/**
 * 带缓存的查询执行
 */
export async function executeWithCache<T>(
  query: string,
  params: any[] = [],
  config: QueryOptimizationConfig = DEFAULT_QUERY_CONFIG
): Promise<T> {
  if (config.enableQueryCache) {
    const cacheKey = generateCacheKey(query, params)
    const cached = queryCache.get(cacheKey)
    
    if (cached) {
      return cached
    }
  }
  
  const startTime = Date.now()
  
  const result = await withConnection(async (sqlConnection) => {
    if (config.explainAnalyze) {
      // 执行查询分析
      const explanation = await sqlConnection`EXPLAIN ANALYZE ${sql.raw(query)}`
      console.log('Query explanation:', explanation)
    }
    
    return await sqlConnection`${sql.raw(query)}`
  })
  
  const duration = Date.now() - startTime
  
  // 记录慢查询
  if (duration > config.slowQueryThreshold) {
    console.warn(`Slow query detected (${duration}ms):`, query)
  }
  
  // 缓存结果
  if (config.enableQueryCache) {
    const cacheKey = generateCacheKey(query, params)
    queryCache.set(cacheKey, result)
  }
  
  return result as T
}

/**
 * 索引管理
 */
export class IndexManager {
  /**
   * 创建索引
   */
  static async createIndex(
    tableName: string,
    columns: string[],
    indexName?: string,
    options: {
      unique?: boolean
      concurrent?: boolean
      where?: string
      method?: 'btree' | 'hash' | 'gin' | 'gist'
    } = {}
  ): Promise<boolean> {
    try {
      const finalIndexName = indexName || `idx_${tableName}_${columns.join('_')}`
      
      let createQuery = `CREATE ${options.unique ? 'UNIQUE ' : ''}INDEX ${
        options.concurrent ? 'CONCURRENTLY ' : ''
      }"${finalIndexName}" ON "${tableName}"`
      
      if (options.method) {
        createQuery += ` USING ${options.method}`
      }
      
      createQuery += ` (${columns.map(col => `"${col}"`).join(', ')})`
      
      if (options.where) {
        createQuery += ` WHERE ${options.where}`
      }
      
      await withConnection(async (sqlConnection) => {
        await sqlConnection`${sql.raw(createQuery)}`
      })
      
      console.log(`✅ Created index: ${finalIndexName}`)
      return true
      
    } catch (error) {
      console.error('Failed to create index:', error)
      return false
    }
  }
  
  /**
   * 删除索引
   */
  static async dropIndex(indexName: string, concurrent = false): Promise<boolean> {
    try {
      const dropQuery = `DROP INDEX ${concurrent ? 'CONCURRENTLY ' : ''}"${indexName}"`
      
      await withConnection(async (sqlConnection) => {
        await sqlConnection`${sql.raw(dropQuery)}`
      })
      
      console.log(`🗑️ Dropped index: ${indexName}`)
      return true
      
    } catch (error) {
      console.error('Failed to drop index:', error)
      return false
    }
  }
  
  /**
   * 获取表的索引信息
   */
  static async getTableIndexes(tableName: string): Promise<any[]> {
    try {
      return await withConnection(async (sqlConnection) => {
        return await sqlConnection`
          SELECT 
            indexname,
            indexdef,
            schemaname
          FROM pg_indexes 
          WHERE tablename = ${tableName}
        `
      })
    } catch (error) {
      console.error('Failed to get table indexes:', error)
      return []
    }
  }
  
  /**
   * 分析索引使用情况
   */
  static async analyzeIndexUsage(tableName?: string): Promise<any[]> {
    try {
      return await withConnection(async (sqlConnection) => {
        const query = tableName
          ? `
            SELECT 
              schemaname,
              tablename,
              indexname,
              idx_tup_read,
              idx_tup_fetch,
              idx_scan
            FROM pg_stat_user_indexes 
            WHERE tablename = $1
            ORDER BY idx_scan DESC
          `
          : `
            SELECT 
              schemaname,
              tablename,
              indexname,
              idx_tup_read,
              idx_tup_fetch,
              idx_scan
            FROM pg_stat_user_indexes 
            ORDER BY idx_scan DESC
          `
        
        return tableName 
          ? await sqlConnection`${sql.raw(query)}`
          : await sqlConnection`${sql.raw(query)}`
      })
    } catch (error) {
      console.error('Failed to analyze index usage:', error)
      return []
    }
  }
}

/**
 * 查询优化建议
 */
export class QueryOptimizer {
  /**
   * 分析查询性能
   */
  static async analyzeQuery(query: string, _params: any[] = []): Promise<{
    executionTime: number
    planningTime: number
    totalCost: number
    rows: number
    plan: any
  }> {
    const result = await withConnection(async (sqlConnection) => {
      const explanation = await sqlConnection`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql.raw(query)}
      `
      
      return explanation[0]['QUERY PLAN'][0]
    })
    
    return {
      executionTime: result['Execution Time'],
      planningTime: result['Planning Time'],
      totalCost: result.Plan['Total Cost'],
      rows: result.Plan['Actual Rows'],
      plan: result.Plan,
    }
  }
  
  /**
   * 获取查询优化建议
   */
  static async getOptimizationSuggestions(tableName: string): Promise<string[]> {
    const suggestions: string[] = []
    
    try {
      // 检查表统计信息
      const stats = await withConnection(async (sqlConnection) => {
        return await sqlConnection`
          SELECT 
            n_tup_ins,
            n_tup_upd,
            n_tup_del,
            n_live_tup,
            n_dead_tup,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables 
          WHERE relname = ${tableName}
        `
      })
      
      if (stats.length > 0) {
        const stat = stats[0]
        
        // 检查是否需要VACUUM
        if (stat.n_dead_tup > stat.n_live_tup * 0.1) {
          suggestions.push(`Consider running VACUUM on table ${tableName} (${stat.n_dead_tup} dead tuples)`)
        }
        
        // 检查是否需要ANALYZE
        const lastAnalyze = stat.last_analyze || stat.last_autoanalyze
        if (!lastAnalyze || Date.now() - new Date(lastAnalyze).getTime() > 7 * 24 * 60 * 60 * 1000) {
          suggestions.push(`Consider running ANALYZE on table ${tableName} (statistics may be outdated)`)
        }
      }
      
      // 检查未使用的索引
      const unusedIndexes = await withConnection(async (sqlConnection) => {
        return await sqlConnection`
          SELECT indexname
          FROM pg_stat_user_indexes 
          WHERE tablename = ${tableName} AND idx_scan = 0
        `
      })
      
      if (unusedIndexes.length > 0) {
        suggestions.push(`Consider dropping unused indexes: ${unusedIndexes.map(i => i.indexname).join(', ')}`)
      }
      
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error)
    }
    
    return suggestions
  }
}

/**
 * 查询性能监控
 */
export class QueryPerformanceMonitor {
  private static metrics: Map<string, {
    count: number
    totalTime: number
    averageTime: number
    minTime: number
    maxTime: number
    lastExecuted: number
  }> = new Map()
  
  static recordQuery(query: string, duration: number) {
    const existing = this.metrics.get(query) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      lastExecuted: 0,
    }
    
    existing.count++
    existing.totalTime += duration
    existing.averageTime = existing.totalTime / existing.count
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    existing.lastExecuted = Date.now()
    
    this.metrics.set(query, existing)
  }
  
  static getSlowQueries(threshold: number = 1000): Array<{
    query: string
    metrics: any
  }> {
    const slowQueries: Array<{ query: string; metrics: any }> = []
    
    for (const [query, metrics] of this.metrics.entries()) {
      if (metrics.averageTime > threshold) {
        slowQueries.push({ query, metrics })
      }
    }
    
    return slowQueries.sort((a, b) => b.metrics.averageTime - a.metrics.averageTime)
  }
  
  static getFrequentQueries(minCount: number = 10): Array<{
    query: string
    metrics: any
  }> {
    const frequentQueries: Array<{ query: string; metrics: any }> = []
    
    for (const [query, metrics] of this.metrics.entries()) {
      if (metrics.count >= minCount) {
        frequentQueries.push({ query, metrics })
      }
    }
    
    return frequentQueries.sort((a, b) => b.metrics.count - a.metrics.count)
  }
  
  static getAllMetrics() {
    return Object.fromEntries(this.metrics.entries())
  }
  
  static reset() {
    this.metrics.clear()
  }
}

/**
 * 数据库维护任务
 */
export class DatabaseMaintenance {
  /**
   * 执行VACUUM
   */
  static async vacuum(tableName?: string, analyze = true): Promise<boolean> {
    try {
      const command = tableName 
        ? `VACUUM ${analyze ? 'ANALYZE ' : ''}"${tableName}"`
        : `VACUUM ${analyze ? 'ANALYZE' : ''}`
      
      await withConnection(async (sqlConnection) => {
        await sqlConnection`${sql.raw(command)}`
      })
      
      console.log(`✅ VACUUM ${analyze ? 'ANALYZE ' : ''}completed${tableName ? ` for ${tableName}` : ''}`)
      return true
      
    } catch (error) {
      console.error('VACUUM failed:', error)
      return false
    }
  }
  
  /**
   * 重建索引
   */
  static async reindex(tableName?: string): Promise<boolean> {
    try {
      const command = tableName ? `REINDEX TABLE "${tableName}"` : 'REINDEX DATABASE CURRENT'
      
      await withConnection(async (sqlConnection) => {
        await sqlConnection`${sql.raw(command)}`
      })
      
      console.log(`✅ REINDEX completed${tableName ? ` for ${tableName}` : ''}`)
      return true
      
    } catch (error) {
      console.error('REINDEX failed:', error)
      return false
    }
  }
  
  /**
   * 更新表统计信息
   */
  static async updateStatistics(tableName?: string): Promise<boolean> {
    try {
      const command = tableName ? `ANALYZE "${tableName}"` : 'ANALYZE'
      
      await withConnection(async (sqlConnection) => {
        await sqlConnection`${sql.raw(command)}`
      })
      
      console.log(`✅ ANALYZE completed${tableName ? ` for ${tableName}` : ''}`)
      return true
      
    } catch (error) {
      console.error('ANALYZE failed:', error)
      return false
    }
  }
}

// 导出查询缓存实例
export { queryCache }
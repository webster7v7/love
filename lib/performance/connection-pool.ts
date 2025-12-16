// 数据库连接池配置和管理

import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { getDbConfig } from '../db/config'

// 连接池配置
export interface ConnectionPoolConfig {
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
  retryAttempts: number
  retryDelay: number
  healthCheckInterval: number
}

export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  maxConnections: 20,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  healthCheckInterval: 60000, // 1 minute
}

// 连接状态
interface Connection {
  id: string
  sql: NeonQueryFunction<false, false>
  isActive: boolean
  lastUsed: number
  createdAt: number
}

/**
 * 连接池管理器
 */
export class ConnectionPool {
  private connections: Map<string, Connection> = new Map()
  private config: ConnectionPoolConfig
  private healthCheckTimer?: NodeJS.Timeout
  private isShuttingDown = false
  
  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config }
    this.startHealthCheck()
  }
  
  /**
   * 获取连接
   */
  async getConnection(): Promise<NeonQueryFunction<false, false>> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down')
    }
    
    // 尝试复用现有连接
    const availableConnection = this.findAvailableConnection()
    if (availableConnection) {
      availableConnection.isActive = true
      availableConnection.lastUsed = Date.now()
      return availableConnection.sql
    }
    
    // 创建新连接
    if (this.connections.size < this.config.maxConnections) {
      return await this.createConnection()
    }
    
    // 等待连接可用
    return await this.waitForConnection()
  }
  
  /**
   * 释放连接
   */
  releaseConnection(sql: NeonQueryFunction<false, false>): void {
    for (const connection of this.connections.values()) {
      if (connection.sql === sql) {
        connection.isActive = false
        connection.lastUsed = Date.now()
        break
      }
    }
  }
  
  /**
   * 查找可用连接
   */
  private findAvailableConnection(): Connection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        return connection
      }
    }
    return null
  }
  
  /**
   * 创建新连接
   */
  private async createConnection(): Promise<NeonQueryFunction<false, false>> {
    const dbConfig = getDbConfig()
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const sql = neon(dbConfig.connectionString)
      
      // 测试连接
      await sql`SELECT 1`
      
      const connection: Connection = {
        id: connectionId,
        sql,
        isActive: true,
        lastUsed: Date.now(),
        createdAt: Date.now(),
      }
      
      this.connections.set(connectionId, connection)
      
      console.log(`✅ Created new database connection: ${connectionId}`)
      return sql
      
    } catch (error) {
      console.error(`❌ Failed to create database connection: ${connectionId}`, error)
      throw error
    }
  }
  
  /**
   * 等待连接可用
   */
  private async waitForConnection(): Promise<NeonQueryFunction<false, false>> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < this.config.connectionTimeout) {
      const availableConnection = this.findAvailableConnection()
      if (availableConnection) {
        availableConnection.isActive = true
        availableConnection.lastUsed = Date.now()
        return availableConnection.sql
      }
      
      // 等待一小段时间后重试
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Connection timeout: No available connections')
  }
  
  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
  }
  
  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const now = Date.now()
    const connectionsToRemove: string[] = []
    
    for (const [id, connection] of this.connections.entries()) {
      // 检查空闲超时
      if (!connection.isActive && 
          now - connection.lastUsed > this.config.idleTimeout) {
        connectionsToRemove.push(id)
        continue
      }
      
      // 测试连接健康状态
      if (!connection.isActive) {
        try {
          await connection.sql`SELECT 1`
        } catch (error) {
          console.warn(`Connection ${id} failed health check:`, error)
          connectionsToRemove.push(id)
        }
      }
    }
    
    // 移除不健康的连接
    for (const id of connectionsToRemove) {
      this.connections.delete(id)
      console.log(`🧹 Removed unhealthy connection: ${id}`)
    }
  }
  
  /**
   * 获取连接池统计信息
   */
  getStats(): {
    totalConnections: number
    activeConnections: number
    idleConnections: number
    oldestConnection: number | null
    newestConnection: number | null
  } {
    const now = Date.now()
    let activeCount = 0
    let oldestTime: number | null = null
    let newestTime: number | null = null
    
    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        activeCount++
      }
      
      if (oldestTime === null || connection.createdAt < oldestTime) {
        oldestTime = connection.createdAt
      }
      
      if (newestTime === null || connection.createdAt > newestTime) {
        newestTime = connection.createdAt
      }
    }
    
    return {
      totalConnections: this.connections.size,
      activeConnections: activeCount,
      idleConnections: this.connections.size - activeCount,
      oldestConnection: oldestTime ? now - oldestTime : null,
      newestConnection: newestTime ? now - newestTime : null,
    }
  }
  
  /**
   * 关闭连接池
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }
    
    // 等待活跃连接完成
    const maxWaitTime = 30000 // 30 seconds
    const startTime = Date.now()
    
    while (this.getStats().activeConnections > 0 && 
           Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 清理所有连接
    this.connections.clear()
    console.log('🔌 Connection pool shut down')
  }
}

// 全局连接池实例
let globalConnectionPool: ConnectionPool | null = null

/**
 * 获取全局连接池
 */
export function getConnectionPool(): ConnectionPool {
  if (!globalConnectionPool) {
    const dbConfig = getDbConfig()
    globalConnectionPool = new ConnectionPool({
      maxConnections: dbConfig.maxConnections,
      idleTimeout: dbConfig.idleTimeout,
    })
  }
  return globalConnectionPool
}

/**
 * 使用连接池执行查询
 */
export async function withConnection<T>(
  operation: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool()
  const connection = await pool.getConnection()
  
  try {
    return await operation(connection)
  } finally {
    pool.releaseConnection(connection)
  }
}

/**
 * 连接池装饰器
 */
export function withConnectionPool<T extends any[], R>(
  fn: (sql: NeonQueryFunction<false, false>, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return await withConnection((sql) => fn(sql, ...args))
  }
}

/**
 * 监控连接池性能
 */
export class ConnectionPoolMonitor {
  private static metrics: {
    totalQueries: number
    totalTime: number
    averageTime: number
    slowQueries: number
    connectionErrors: number
    poolExhausted: number
  } = {
    totalQueries: 0,
    totalTime: 0,
    averageTime: 0,
    slowQueries: 0,
    connectionErrors: 0,
    poolExhausted: 0,
  }
  
  static recordQuery(duration: number, success: boolean) {
    this.metrics.totalQueries++
    
    if (success) {
      this.metrics.totalTime += duration
      this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalQueries
      
      if (duration > 5000) { // 5 seconds threshold
        this.metrics.slowQueries++
      }
    } else {
      this.metrics.connectionErrors++
    }
  }
  
  static recordPoolExhaustion() {
    this.metrics.poolExhausted++
  }
  
  static getMetrics() {
    return { ...this.metrics }
  }
  
  static reset() {
    this.metrics = {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
      poolExhausted: 0,
    }
  }
}
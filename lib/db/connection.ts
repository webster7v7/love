import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql as drizzleSql } from 'drizzle-orm'
import { getDbConfig } from './config'

// 数据库连接接口
export interface DatabaseConnection {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
  transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T>
}

// 创建Neon连接 - 延迟初始化
let sql: ReturnType<typeof neon> | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function initializeSql() {
  if (!sql) {
    const dbConfig = getDbConfig()
    sql = neon(dbConfig.connectionString)
    dbInstance = drizzle(sql)
  }
  return { sql, db: dbInstance }
}

// 导出数据库实例
export function getDb() {
  const { db } = initializeSql()
  return db
}

// 直接导出 db 实例（向后兼容）
export const db = getDb()

// 连接状态管理
class ConnectionManager {
  private isConnected = false
  private connectionAttempts = 0
  private maxRetries = 3
  private baseRetryDelay = 1000 // 1 second

  async testConnection(): Promise<boolean> {
    try {
      // 简单的连接测试查询
      const { sql } = initializeSql()
      await sql`SELECT 1 as test`
      this.isConnected = true
      console.log('✅ Database connection successful')
      return true
    } catch (error) {
      this.isConnected = false
      console.error(`❌ Database connection failed:`, error)
      return false
    }
  }

  async connectWithRetry(): Promise<boolean> {
    this.connectionAttempts = 0
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      this.connectionAttempts = attempt
      console.log(`🔄 Database connection attempt ${attempt}/${this.maxRetries}...`)
      
      const success = await this.testConnection()
      if (success) {
        return true
      }

      if (attempt < this.maxRetries) {
        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Retrying connection in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.error('❌ Failed to connect to database after maximum retries')
    return false
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getConnectionAttempts(): number {
    return this.connectionAttempts
  }
}

// 导出连接管理器实例
export const connectionManager = new ConnectionManager()

// 数据库连接实现
export class NeonDatabaseConnection implements DatabaseConnection {
  async query<T>(queryString: string, _params?: unknown[]): Promise<T[]> {
    try {
      const { sql } = initializeSql()
      // Neon 需要使用模板字符串，这里我们使用 drizzleSql.raw() 来处理字符串查询
      const result = await sql`${drizzleSql.raw(queryString)}`
      return result as T[]
    } catch (error) {
      console.error('Database query error:', error)
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async transaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
    const { db: dbConn } = initializeSql()
    if (!dbConn) {
      throw new Error('Database not initialized')
    }
    return await dbConn.transaction(callback)
  }
}

// 导出数据库连接实例
export const dbConnection = new NeonDatabaseConnection()

// 初始化数据库连接
export async function initializeDatabase(): Promise<boolean> {
  console.log('🔄 Initializing database connection...')
  
  try {
    const connected = await connectionManager.connectWithRetry()
    
    if (connected) {
      console.log('✅ Database initialized successfully')
      return true
    } else {
      console.warn('⚠️ Database connection failed, will use fallback mode')
      return false
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    return false
  }
}
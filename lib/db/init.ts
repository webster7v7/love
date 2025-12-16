import { initializeDatabase } from './connection'

// 数据库初始化函数
export async function setupDatabase(): Promise<boolean> {
  console.log('🚀 Setting up database...')
  
  try {
    // 测试数据库连接
    const connected = await initializeDatabase()
    
    if (!connected) {
      console.warn('⚠️ Database connection failed, application will use localStorage fallback')
      return false
    }

    console.log('✅ Database setup completed successfully')
    return true
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return false
  }
}

// 检查数据库健康状态
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const connected = await initializeDatabase()
    const latency = Date.now() - startTime
    
    return {
      connected,
      latency: connected ? latency : undefined,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
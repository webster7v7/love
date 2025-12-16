import { migrate } from 'drizzle-orm/neon-http/migrator'
import { getDb } from './connection'
import { initializeDatabase } from './connection'

// 执行数据库迁移
export async function runMigrations(): Promise<boolean> {
  console.log('🔄 Running database migrations...')
  
  try {
    // 确保数据库连接正常
    const connected = await initializeDatabase()
    if (!connected) {
      throw new Error('Database connection failed')
    }

    const db = getDb()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // 执行迁移
    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    
    console.log('✅ Database migrations completed successfully')
    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// 检查迁移状态
export async function checkMigrationStatus(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const connected = await initializeDatabase()
    if (!connected) {
      return { success: false, error: 'Database connection failed' }
    }

    // 这里可以添加更多的迁移状态检查逻辑
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// 重置数据库（仅用于开发环境）
export async function resetDatabase(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Database reset is not allowed in production')
    return false
  }

  console.log('⚠️ Resetting database (development only)...')
  
  try {
    const db = getDb()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // 删除所有表的数据（保留结构）
    await db.delete(customQuotes)
    await db.delete(photos) 
    await db.delete(messages)
    
    console.log('✅ Database reset completed')
    return true
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    return false
  }
}

// 导入必要的表定义
import { messages, photos, customQuotes } from './schema'
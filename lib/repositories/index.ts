// Repository统一导出和管理
import { messageRepository, type MessageRepository } from './messages'
import { photoRepository, type PhotoRepository } from './photos'
import { quoteRepository, type QuoteRepository } from './quotes'
import { VisitsRepository } from './visits'
import { initializeDatabase } from '../db/connection'

// Repository管理器
export class RepositoryManager {
  private static instance: RepositoryManager
  private initialized = false
  
  // Repository实例
  public readonly messages: MessageRepository
  public readonly photos: PhotoRepository
  public readonly quotes: QuoteRepository
  public readonly visits: VisitsRepository
  
  private constructor() {
    this.messages = messageRepository
    this.photos = photoRepository
    this.quotes = quoteRepository
    this.visits = new VisitsRepository()
  }
  
  // 单例模式
  public static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager()
    }
    return RepositoryManager.instance
  }
  
  // 初始化所有Repository
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true
    }
    
    try {
      console.log('🔄 Initializing repositories...')
      
      // 确保数据库连接正常
      const connected = await initializeDatabase()
      if (!connected) {
        console.error('❌ Database connection failed, repositories not initialized')
        return false
      }
      
      this.initialized = true
      console.log('✅ Repositories initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Repository initialization failed:', error)
      return false
    }
  }
  
  // 检查初始化状态
  public isInitialized(): boolean {
    return this.initialized
  }
  
  // 获取所有Repository的统计信息
  public async getStats(): Promise<{
    messages: { total: number }
    photos: { total: number, custom: number, default: number }
    quotes: { total: number, thisWeek: number, thisMonth: number, averageLength: number }
  }> {
    if (!this.initialized) {
      throw new Error('Repositories not initialized')
    }
    
    try {
      const [messageCount, photoCount, customPhotoCount, defaultPhotoCount, quoteStats] = await Promise.all([
        this.messages.count(),
        this.photos.count(),
        this.photos.countCustomPhotos(),
        this.photos.countDefaultPhotos(),
        this.quotes.getStats(),
      ])
      
      return {
        messages: { total: messageCount },
        photos: { 
          total: photoCount, 
          custom: customPhotoCount, 
          default: defaultPhotoCount 
        },
        quotes: quoteStats,
      }
    } catch (error) {
      console.error('❌ Failed to get repository stats:', error)
      throw error
    }
  }
  
  // 清理所有数据（仅开发环境）
  public async clearAllData(): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Data clearing is not allowed in production')
    }
    
    if (!this.initialized) {
      throw new Error('Repositories not initialized')
    }
    
    try {
      console.log('🧹 Clearing all repository data...')
      
      // 删除所有数据
      await Promise.all([
        this.quotes.deleteAll(),
        this.photos.deleteCustomPhotos(), // 只删除自定义照片
        this.messages.deleteMany(await this.getAllMessageIds()),
      ])
      
      console.log('✅ All repository data cleared')
      return true
    } catch (error) {
      console.error('❌ Failed to clear repository data:', error)
      return false
    }
  }
  
  // 辅助方法：获取所有留言ID
  private async getAllMessageIds(): Promise<string[]> {
    const messages = await this.messages.findAll({ limit: 1000 })
    return messages.map(m => m.id)
  }
}

// 导出单例实例
export const repositories = RepositoryManager.getInstance()

// 导出Repository类型
export type { MessageRepository, PhotoRepository, QuoteRepository }

// 导出Repository实例（向后兼容）
export { messageRepository, photoRepository, quoteRepository }

// 导出基础类型
export * from './base'

// 便捷的初始化函数
export async function initializeRepositories(): Promise<boolean> {
  return await repositories.initialize()
}

// 便捷的统计函数
export async function getRepositoryStats() {
  return await repositories.getStats()
}

// Repository健康检查
export async function checkRepositoryHealth(): Promise<{
  healthy: boolean
  initialized: boolean
  stats?: any
  error?: string
}> {
  try {
    const initialized = repositories.isInitialized()
    
    if (!initialized) {
      const initSuccess = await repositories.initialize()
      if (!initSuccess) {
        return {
          healthy: false,
          initialized: false,
          error: 'Failed to initialize repositories'
        }
      }
    }
    
    const stats = await repositories.getStats()
    
    return {
      healthy: true,
      initialized: true,
      stats,
    }
  } catch (error) {
    return {
      healthy: false,
      initialized: repositories.isInitialized(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
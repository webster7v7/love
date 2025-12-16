// 批量数据迁移功能

import { repositories } from '@/lib/repositories'
import { 
  createManyMessages,
  createManyPhotos,
  createManyQuotes
} from '@/app/actions'
import { 
  MigrationResult,
  MigrationStatus,
  MigrationProgress,
  MigrationConfig,
  DEFAULT_MIGRATION_CONFIG,
  DataDetectionResult
} from './types'
import { 
  convertMessages,
  convertPhotos,
  convertQuotes,
  validateConvertedData,
  getConversionStats
} from './converter'

/**
 * 执行完整的数据迁移流程
 */
export async function migrateData(
  data: DataDetectionResult,
  config: MigrationConfig = DEFAULT_MIGRATION_CONFIG,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const startTime = Date.now()
  const errors: string[] = []
  
  try {
    // 1. 检测阶段
    onProgress?.({
      stage: 'detecting',
      message: '正在检测数据...',
      progress: 0,
      details: { totalItems: data.totalItems }
    })
    
    if (!data.hasData) {
      return {
        success: true,
        status: {
          completed: true,
          timestamp: startTime,
          messagesCount: 0,
          photosCount: 0,
          quotesCount: 0,
          errors: ['No data to migrate']
        }
      }
    }
    
    // 2. 数据转换
    onProgress?.({
      stage: 'migrating',
      message: '正在转换数据格式...',
      progress: 10,
    })
    
    const convertedMessages = convertMessages(data.messages)
    const convertedPhotos = convertPhotos(data.photos)
    const convertedQuotes = convertQuotes(data.quotes)
    
    // 3. 数据验证
    const validation = validateConvertedData(
      convertedMessages,
      convertedPhotos,
      convertedQuotes
    )
    
    if (!validation.valid) {
      errors.push(...validation.errors)
    }
    
    const stats = getConversionStats(
      data.messages,
      data.photos,
      data.quotes,
      validation.validMessages,
      validation.validPhotos,
      validation.validQuotes
    )
    
    console.log('Migration conversion stats:', stats)
    
    // 4. 确保数据库已初始化
    onProgress?.({
      stage: 'migrating',
      message: '正在初始化数据库连接...',
      progress: 20,
    })
    
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }
    
    let migratedMessages = 0
    let migratedPhotos = 0
    let migratedQuotes = 0
    
    // 5. 批量迁移留言
    if (validation.validMessages.length > 0) {
      onProgress?.({
        stage: 'migrating',
        message: `正在迁移 ${validation.validMessages.length} 条留言...`,
        progress: 30,
        details: { messagesProcessed: 0, totalItems: validation.validMessages.length }
      })
      
      const batches = chunkArray(validation.validMessages, config.batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const result = await createManyMessages(batch)
        
        if (result.success && result.data) {
          migratedMessages += result.data.length
        } else {
          errors.push(`Failed to migrate message batch ${i + 1}: ${result.error || 'Unknown error'}`)
        }
        
        onProgress?.({
          stage: 'migrating',
          message: `正在迁移留言... (${migratedMessages}/${validation.validMessages.length})`,
          progress: 30 + (i + 1) / batches.length * 20,
          details: { messagesProcessed: migratedMessages }
        })
      }
    }
    
    // 6. 批量迁移照片
    if (validation.validPhotos.length > 0) {
      onProgress?.({
        stage: 'migrating',
        message: `正在迁移 ${validation.validPhotos.length} 张照片...`,
        progress: 50,
        details: { photosProcessed: 0, totalItems: validation.validPhotos.length }
      })
      
      const batches = chunkArray(validation.validPhotos, config.batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const result = await createManyPhotos(batch)
        
        if (result.success && result.data) {
          migratedPhotos += result.data.length
        } else {
          errors.push(`Failed to migrate photo batch ${i + 1}: ${result.error || 'Unknown error'}`)
        }
        
        onProgress?.({
          stage: 'migrating',
          message: `正在迁移照片... (${migratedPhotos}/${validation.validPhotos.length})`,
          progress: 50 + (i + 1) / batches.length * 20,
          details: { photosProcessed: migratedPhotos }
        })
      }
    }
    
    // 7. 批量迁移情话
    if (validation.validQuotes.length > 0) {
      onProgress?.({
        stage: 'migrating',
        message: `正在迁移 ${validation.validQuotes.length} 条情话...`,
        progress: 70,
        details: { quotesProcessed: 0, totalItems: validation.validQuotes.length }
      })
      
      const batches = chunkArray(validation.validQuotes, config.batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        const result = await createManyQuotes(batch)
        
        if (result.success && result.data) {
          migratedQuotes += result.data.length
        } else {
          errors.push(`Failed to migrate quote batch ${i + 1}: ${result.error || 'Unknown error'}`)
        }
        
        onProgress?.({
          stage: 'migrating',
          message: `正在迁移情话... (${migratedQuotes}/${validation.validQuotes.length})`,
          progress: 70 + (i + 1) / batches.length * 20,
          details: { quotesProcessed: migratedQuotes }
        })
      }
    }
    
    // 8. 清理localStorage（如果配置允许）
    if (config.cleanupAfterMigration && migratedMessages + migratedPhotos + migratedQuotes > 0) {
      onProgress?.({
        stage: 'cleaning',
        message: '正在清理本地存储...',
        progress: 90,
      })
      
      // 这里不直接清理，而是标记为已迁移
      // 实际清理将在组件中处理
    }
    
    // 9. 完成
    onProgress?.({
      stage: 'completed',
      message: '迁移完成！',
      progress: 100,
      details: {
        messagesProcessed: migratedMessages,
        photosProcessed: migratedPhotos,
        quotesProcessed: migratedQuotes,
        totalItems: migratedMessages + migratedPhotos + migratedQuotes
      }
    })
    
    const status: MigrationStatus = {
      completed: true,
      timestamp: Date.now(),
      messagesCount: migratedMessages,
      photosCount: migratedPhotos,
      quotesCount: migratedQuotes,
      errors,
    }
    
    return {
      success: errors.length === 0 || (migratedMessages + migratedPhotos + migratedQuotes > 0),
      status,
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)
    
    onProgress?.({
      stage: 'error',
      message: `迁移失败: ${errorMessage}`,
      progress: 0,
    })
    
    return {
      success: false,
      status: {
        completed: false,
        timestamp: Date.now(),
        messagesCount: 0,
        photosCount: 0,
        quotesCount: 0,
        errors,
      },
      error: errorMessage,
    }
  }
}

/**
 * 将数组分割成指定大小的批次
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * 重试机制包装器
 */
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
      
      console.warn(`Migration operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`, error)
    }
  }
  
  throw lastError!
}

/**
 * 估算迁移时间
 */
export function estimateMigrationTime(totalItems: number): number {
  // 基于经验值：每个项目大约需要100ms处理时间
  const baseTimePerItem = 100 // ms
  const overhead = 2000 // 2秒的固定开销
  
  return Math.max(overhead + totalItems * baseTimePerItem, 3000) // 最少3秒
}

/**
 * 检查迁移是否已完成
 */
export function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const status = localStorage.getItem('migration-status')
    if (!status) return false
    
    const migrationStatus: MigrationStatus = JSON.parse(status)
    return migrationStatus.completed
  } catch {
    return false
  }
}

/**
 * 标记迁移为已完成
 */
export function markMigrationCompleted(status: MigrationStatus): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('migration-status', JSON.stringify(status))
  } catch (error) {
    console.error('Failed to save migration status:', error)
  }
}
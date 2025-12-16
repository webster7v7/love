// 数据迁移模块统一导出

export * from './types'
export * from './detector'
export * from './converter'
export * from './migrator'
export * from './cleanup'

// 便捷的迁移函数
export { detectLocalStorageData } from './detector'
export { cleanupLocalStorage } from './cleanup'
export { 
  migrateData,
  isMigrationCompleted,
  markMigrationCompleted
} from './migrator'

// 主要的迁移流程
import { detectLocalStorageData } from './detector'
import { cleanupLocalStorage } from './cleanup'
import { 
  migrateData,
  markMigrationCompleted,
  isMigrationCompleted
} from './migrator'
import { 
  MigrationProgress,
  MigrationConfig,
  DEFAULT_MIGRATION_CONFIG
} from './types'

/**
 * 执行完整的数据迁移流程
 * 这是主要的入口函数
 */
export async function performMigration(
  config: Partial<MigrationConfig> = {},
  onProgress?: (progress: MigrationProgress) => void
) {
  const fullConfig = { ...DEFAULT_MIGRATION_CONFIG, ...config }
  
  try {
    // 1. 检测数据
    onProgress?.({
      stage: 'detecting',
      message: '正在检测本地数据...',
      progress: 0
    })
    
    const data = detectLocalStorageData()
    
    if (!data.hasData) {
      onProgress?.({
        stage: 'completed',
        message: '没有需要迁移的数据',
        progress: 100
      })
      return {
        success: true,
        message: 'No data to migrate'
      }
    }
    
    // 2. 执行迁移
    const result = await migrateData(data, fullConfig, onProgress)
    
    // 3. 标记完成状态
    if (result.success) {
      markMigrationCompleted(result.status)
      
      // 4. 清理localStorage（如果配置允许）
      if (fullConfig.cleanupAfterMigration) {
        const cleanup = cleanupLocalStorage()
        if (!cleanup.success) {
          console.warn('Failed to cleanup localStorage:', cleanup.errors)
        }
      }
    }
    
    return {
      success: result.success,
      message: result.success ? 'Migration completed' : (result.error || 'Migration failed'),
      status: result.status
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed'
    }
  }
}

/**
 * 迁移管理器 - 提供简化的迁移接口
 */
export const migrationManager = {
  /**
   * 检测本地存储数据
   */
  detectLocalStorageData,
  
  /**
   * 从 localStorage 迁移数据
   */
  async migrateFromLocalStorage(options: {
    onProgress?: (progress: number, stage: string) => void
  } = {}) {
    return await performMigration({}, (progress) => {
      options.onProgress?.(progress.progress, progress.stage)
    })
  },
  
  /**
   * 检查迁移是否已完成
   */
  isMigrationCompleted,
  
  /**
   * 清理本地存储
   */
  cleanupLocalStorage
}
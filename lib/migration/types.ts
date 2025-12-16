// 数据迁移相关的类型定义

// localStorage中的数据结构
export interface LocalStorageMessage {
  id: string
  content: string
  date: string
  createdAt: number
  color: string
}

export interface LocalStoragePhoto {
  id: string
  url: string
  caption: string
  createdAt: number
}

export interface LocalStorageQuote {
  id: string
  text: string
  isCustom: boolean
  createdAt: number
}

// localStorage键名
export const STORAGE_KEYS = {
  MESSAGES: 'love-message-board',
  PHOTOS: 'love-photo-gallery',
  QUOTES: 'custom-love-quotes',
} as const

// 迁移状态
export interface MigrationStatus {
  completed: boolean
  timestamp: number
  messagesCount: number
  photosCount: number
  quotesCount: number
  errors: string[]
}

// 迁移结果
export interface MigrationResult {
  success: boolean
  status: MigrationStatus
  error?: string
}

// 迁移进度
export interface MigrationProgress {
  stage: 'detecting' | 'migrating' | 'cleaning' | 'completed' | 'error'
  message: string
  progress: number // 0-100
  details?: {
    messagesProcessed?: number
    photosProcessed?: number
    quotesProcessed?: number
    totalItems?: number
  }
}

// 迁移配置
export interface MigrationConfig {
  batchSize: number
  retryAttempts: number
  cleanupAfterMigration: boolean
  backupBeforeMigration: boolean
}

export const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  batchSize: 10,
  retryAttempts: 3,
  cleanupAfterMigration: true,
  backupBeforeMigration: true,
}

// 数据检测结果
export interface DataDetectionResult {
  hasData: boolean
  messages: LocalStorageMessage[]
  photos: LocalStoragePhoto[]
  quotes: LocalStorageQuote[]
  totalItems: number
}
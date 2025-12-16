// localStorage清理功能

import { STORAGE_KEYS } from './types'

/**
 * 清理localStorage中的迁移数据
 */
export function cleanupLocalStorage(): {
  success: boolean
  cleaned: string[]
  errors: string[]
} {
  if (typeof window === 'undefined') {
    return {
      success: false,
      cleaned: [],
      errors: ['Not running in browser environment']
    }
  }

  const cleaned: string[] = []
  const errors: string[] = []

  // 清理留言数据
  try {
    if (localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES)
      cleaned.push('messages')
    }
  } catch (error) {
    errors.push(`Failed to clean messages: ${error}`)
  }

  // 清理照片数据
  try {
    if (localStorage.getItem(STORAGE_KEYS.PHOTOS)) {
      localStorage.removeItem(STORAGE_KEYS.PHOTOS)
      cleaned.push('photos')
    }
  } catch (error) {
    errors.push(`Failed to clean photos: ${error}`)
  }

  // 清理情话数据
  try {
    if (localStorage.getItem(STORAGE_KEYS.QUOTES)) {
      localStorage.removeItem(STORAGE_KEYS.QUOTES)
      cleaned.push('quotes')
    }
  } catch (error) {
    errors.push(`Failed to clean quotes: ${error}`)
  }

  return {
    success: errors.length === 0,
    cleaned,
    errors,
  }
}

/**
 * 备份localStorage数据到文件
 */
export function backupLocalStorageData(): {
  success: boolean
  backup?: string
  error?: string
} {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Not running in browser environment'
    }
  }

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        messages: localStorage.getItem(STORAGE_KEYS.MESSAGES),
        photos: localStorage.getItem(STORAGE_KEYS.PHOTOS),
        quotes: localStorage.getItem(STORAGE_KEYS.QUOTES),
      }
    }

    const backupString = JSON.stringify(backup, null, 2)
    
    // 创建下载链接
    const blob = new Blob([backupString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `love-website-backup-${new Date().toISOString().split('T')[0]}.json`
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return {
      success: true,
      backup: backupString,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 从备份恢复localStorage数据
 */
export function restoreFromBackup(backupData: string): {
  success: boolean
  restored: string[]
  errors: string[]
} {
  if (typeof window === 'undefined') {
    return {
      success: false,
      restored: [],
      errors: ['Not running in browser environment']
    }
  }

  const restored: string[] = []
  const errors: string[] = []

  try {
    const backup = JSON.parse(backupData)
    
    if (!backup.data) {
      throw new Error('Invalid backup format')
    }

    // 恢复留言数据
    if (backup.data.messages) {
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, backup.data.messages)
        restored.push('messages')
      } catch (error) {
        errors.push(`Failed to restore messages: ${error}`)
      }
    }

    // 恢复照片数据
    if (backup.data.photos) {
      try {
        localStorage.setItem(STORAGE_KEYS.PHOTOS, backup.data.photos)
        restored.push('photos')
      } catch (error) {
        errors.push(`Failed to restore photos: ${error}`)
      }
    }

    // 恢复情话数据
    if (backup.data.quotes) {
      try {
        localStorage.setItem(STORAGE_KEYS.QUOTES, backup.data.quotes)
        restored.push('quotes')
      } catch (error) {
        errors.push(`Failed to restore quotes: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      restored,
      errors,
    }
  } catch (error) {
    return {
      success: false,
      restored: [],
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * 检查localStorage使用情况
 */
export function getLocalStorageUsage(): {
  totalSize: number
  itemSizes: Record<string, number>
  available: boolean
} {
  if (typeof window === 'undefined') {
    return {
      totalSize: 0,
      itemSizes: {},
      available: false
    }
  }

  const itemSizes: Record<string, number> = {}
  let totalSize = 0

  try {
    // 检查相关的localStorage项目
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        const size = new Blob([item]).size
        itemSizes[key] = size
        totalSize += size
      }
    })

    return {
      totalSize,
      itemSizes,
      available: true
    }
  } catch (_error) {
    return {
      totalSize: 0,
      itemSizes: {},
      available: false
    }
  }
}

/**
 * 清理特定类型的数据
 */
export function cleanupSpecificData(type: 'messages' | 'photos' | 'quotes'): {
  success: boolean
  error?: string
} {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Not running in browser environment'
    }
  }

  try {
    const key = STORAGE_KEYS[type.toUpperCase() as keyof typeof STORAGE_KEYS]
    localStorage.removeItem(key)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 验证localStorage是否可用
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * 获取localStorage配额信息（如果支持）
 */
export async function getStorageQuota(): Promise<{
  quota?: number
  usage?: number
  available?: number
  supported: boolean
}> {
  if (typeof window === 'undefined' || !navigator.storage?.estimate) {
    return { supported: false }
  }

  try {
    const estimate = await navigator.storage.estimate()
    return {
      quota: estimate.quota,
      usage: estimate.usage,
      available: estimate.quota && estimate.usage ? estimate.quota - estimate.usage : undefined,
      supported: true
    }
  } catch {
    return { supported: false }
  }
}
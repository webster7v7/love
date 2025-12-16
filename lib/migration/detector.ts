// localStorage数据检测和读取功能

import { 
  LocalStorageMessage, 
  LocalStoragePhoto, 
  LocalStorageQuote,
  DataDetectionResult,
  STORAGE_KEYS 
} from './types'

/**
 * 检测localStorage中是否存在需要迁移的数据
 */
export function detectLocalStorageData(): DataDetectionResult {
  if (typeof window === 'undefined') {
    return {
      hasData: false,
      messages: [],
      photos: [],
      quotes: [],
      totalItems: 0,
    }
  }

  try {
    const messages = loadMessages()
    const photos = loadPhotos()
    const quotes = loadQuotes()
    
    const totalItems = messages.length + photos.length + quotes.length
    
    return {
      hasData: totalItems > 0,
      messages,
      photos,
      quotes,
      totalItems,
    }
  } catch (error) {
    console.error('Failed to detect localStorage data:', error)
    return {
      hasData: false,
      messages: [],
      photos: [],
      quotes: [],
      totalItems: 0,
    }
  }
}

/**
 * 从localStorage加载留言数据
 */
export function loadMessages(): LocalStorageMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (!stored) return []
    
    const messages = JSON.parse(stored)
    return Array.isArray(messages) ? messages : []
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error)
    return []
  }
}

/**
 * 从localStorage加载照片数据（仅自定义照片）
 */
export function loadPhotos(): LocalStoragePhoto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PHOTOS)
    if (!stored) return []
    
    const photos = JSON.parse(stored)
    // 只迁移自定义照片（ID以custom-开头的）
    return Array.isArray(photos) 
      ? photos.filter(photo => photo.id && photo.id.startsWith('custom-'))
      : []
  } catch (error) {
    console.error('Failed to load photos from localStorage:', error)
    return []
  }
}

/**
 * 从localStorage加载情话数据（仅自定义情话）
 */
export function loadQuotes(): LocalStorageQuote[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUOTES)
    if (!stored) return []
    
    const quotes = JSON.parse(stored)
    // 只迁移自定义情话
    return Array.isArray(quotes) 
      ? quotes.filter(quote => quote.isCustom === true)
      : []
  } catch (error) {
    console.error('Failed to load quotes from localStorage:', error)
    return []
  }
}

/**
 * 检查特定类型的数据是否存在
 */
export function hasMessagesData(): boolean {
  return loadMessages().length > 0
}

export function hasPhotosData(): boolean {
  return loadPhotos().length > 0
}

export function hasQuotesData(): boolean {
  return loadQuotes().length > 0
}

/**
 * 获取数据统计信息
 */
export function getDataStats() {
  const messages = loadMessages()
  const photos = loadPhotos()
  const quotes = loadQuotes()
  
  return {
    messages: {
      count: messages.length,
      oldestDate: messages.length > 0 ? Math.min(...messages.map(m => m.createdAt)) : null,
      newestDate: messages.length > 0 ? Math.max(...messages.map(m => m.createdAt)) : null,
    },
    photos: {
      count: photos.length,
      oldestDate: photos.length > 0 ? Math.min(...photos.map(p => p.createdAt)) : null,
      newestDate: photos.length > 0 ? Math.max(...photos.map(p => p.createdAt)) : null,
    },
    quotes: {
      count: quotes.length,
      oldestDate: quotes.length > 0 ? Math.min(...quotes.map(q => q.createdAt)) : null,
      newestDate: quotes.length > 0 ? Math.max(...quotes.map(q => q.createdAt)) : null,
    },
    total: messages.length + photos.length + quotes.length,
  }
}

/**
 * 验证数据完整性
 */
export function validateLocalStorageData(data: DataDetectionResult): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // 验证留言数据
  data.messages.forEach((message, index) => {
    if (!message.id) issues.push(`Message ${index}: missing id`)
    if (!message.content) issues.push(`Message ${index}: missing content`)
    if (!message.createdAt) issues.push(`Message ${index}: missing createdAt`)
  })
  
  // 验证照片数据
  data.photos.forEach((photo, index) => {
    if (!photo.id) issues.push(`Photo ${index}: missing id`)
    if (!photo.url) issues.push(`Photo ${index}: missing url`)
    if (!photo.createdAt) issues.push(`Photo ${index}: missing createdAt`)
  })
  
  // 验证情话数据
  data.quotes.forEach((quote, index) => {
    if (!quote.id) issues.push(`Quote ${index}: missing id`)
    if (!quote.text) issues.push(`Quote ${index}: missing text`)
    if (!quote.createdAt) issues.push(`Quote ${index}: missing createdAt`)
  })
  
  return {
    valid: issues.length === 0,
    issues,
  }
}
// 数据格式转换逻辑

import { 
  LocalStorageMessage, 
  LocalStoragePhoto, 
  LocalStorageQuote 
} from './types'
import { 
  type CreateMessageInput,
  type CreatePhotoInput,
  type CreateQuoteInput
} from '@/lib/types/database'

/**
 * 将localStorage留言数据转换为数据库格式
 */
export function convertMessage(localMessage: LocalStorageMessage): CreateMessageInput {
  return {
    content: localMessage.content.trim(),
    color: localMessage.color || '#FFE4E1', // 默认颜色
  }
}

/**
 * 将localStorage照片数据转换为数据库格式
 */
export function convertPhoto(localPhoto: LocalStoragePhoto): CreatePhotoInput {
  return {
    url: localPhoto.url.trim(),
    caption: localPhoto.caption?.trim() || '',
    isCustom: true, // localStorage中的照片都是自定义的
  }
}

/**
 * 将localStorage情话数据转换为数据库格式
 */
export function convertQuote(localQuote: LocalStorageQuote): CreateQuoteInput {
  return {
    text: localQuote.text.trim(),
    isCustom: true
  }
}

/**
 * 批量转换留言数据
 */
export function convertMessages(localMessages: LocalStorageMessage[]): CreateMessageInput[] {
  return localMessages
    .filter(message => message.content && message.content.trim().length > 0)
    .map(convertMessage)
}

/**
 * 批量转换照片数据
 */
export function convertPhotos(localPhotos: LocalStoragePhoto[]): CreatePhotoInput[] {
  return localPhotos
    .filter(photo => photo.url && photo.url.trim().length > 0)
    .map(convertPhoto)
}

/**
 * 批量转换情话数据
 */
export function convertQuotes(localQuotes: LocalStorageQuote[]): CreateQuoteInput[] {
  return localQuotes
    .filter(quote => quote.text && quote.text.trim().length > 0)
    .map(convertQuote)
}

/**
 * 验证转换后的数据
 */
export function validateConvertedMessage(data: CreateMessageInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required')
  }
  
  if (data.content && data.content.length > 200) {
    errors.push('Content exceeds maximum length (200 characters)')
  }
  
  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push('Invalid color format')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateConvertedPhoto(data: CreatePhotoInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.url || data.url.trim().length === 0) {
    errors.push('URL is required')
  }
  
  try {
    new URL(data.url)
  } catch {
    errors.push('Invalid URL format')
  }
  
  if (data.caption && data.caption.length > 50) {
    errors.push('Caption exceeds maximum length (50 characters)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateConvertedQuote(data: CreateQuoteInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.text || data.text.trim().length === 0) {
    errors.push('Text is required')
  }
  
  if (data.text && data.text.length > 200) {
    errors.push('Text exceeds maximum length (200 characters)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 批量验证转换后的数据
 */
export function validateConvertedData(
  messages: CreateMessageInput[],
  photos: CreatePhotoInput[],
  quotes: CreateQuoteInput[]
): {
  valid: boolean
  errors: string[]
  validMessages: CreateMessageInput[]
  validPhotos: CreatePhotoInput[]
  validQuotes: CreateQuoteInput[]
} {
  const errors: string[] = []
  const validMessages: CreateMessageInput[] = []
  const validPhotos: CreatePhotoInput[] = []
  const validQuotes: CreateQuoteInput[] = []
  
  // 验证留言
  messages.forEach((message, index) => {
    const validation = validateConvertedMessage(message)
    if (validation.valid) {
      validMessages.push(message)
    } else {
      errors.push(`Message ${index}: ${validation.errors.join(', ')}`)
    }
  })
  
  // 验证照片
  photos.forEach((photo, index) => {
    const validation = validateConvertedPhoto(photo)
    if (validation.valid) {
      validPhotos.push(photo)
    } else {
      errors.push(`Photo ${index}: ${validation.errors.join(', ')}`)
    }
  })
  
  // 验证情话
  quotes.forEach((quote, index) => {
    const validation = validateConvertedQuote(quote)
    if (validation.valid) {
      validQuotes.push(quote)
    } else {
      errors.push(`Quote ${index}: ${validation.errors.join(', ')}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    validMessages,
    validPhotos,
    validQuotes,
  }
}

/**
 * 数据统计信息
 */
export function getConversionStats(
  originalMessages: LocalStorageMessage[],
  originalPhotos: LocalStoragePhoto[],
  originalQuotes: LocalStorageQuote[],
  validMessages: CreateMessageInput[],
  validPhotos: CreatePhotoInput[],
  validQuotes: CreateQuoteInput[]
) {
  return {
    original: {
      messages: originalMessages.length,
      photos: originalPhotos.length,
      quotes: originalQuotes.length,
      total: originalMessages.length + originalPhotos.length + originalQuotes.length,
    },
    converted: {
      messages: validMessages.length,
      photos: validPhotos.length,
      quotes: validQuotes.length,
      total: validMessages.length + validPhotos.length + validQuotes.length,
    },
    skipped: {
      messages: originalMessages.length - validMessages.length,
      photos: originalPhotos.length - validPhotos.length,
      quotes: originalQuotes.length - validQuotes.length,
      total: (originalMessages.length + originalPhotos.length + originalQuotes.length) - 
             (validMessages.length + validPhotos.length + validQuotes.length),
    },
  }
}
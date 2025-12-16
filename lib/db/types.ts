// 从schema导入类型并重新导出，提供更好的类型安全
import { 
  messages, 
  photos, 
  customQuotes,
  type Message as DrizzleMessage,
  type NewMessage as DrizzleNewMessage,
  type Photo as DrizzlePhoto,
  type NewPhoto as DrizzleNewPhoto,
  type CustomQuote as DrizzleCustomQuote,
  type NewCustomQuote as DrizzleNewCustomQuote
} from './schema'

// 重新导出Drizzle类型
export type {
  DrizzleMessage,
  DrizzleNewMessage,
  DrizzlePhoto,
  DrizzleNewPhoto,
  DrizzleCustomQuote,
  DrizzleNewCustomQuote
}

// 导出表定义
export { messages, photos, customQuotes }

// 表名常量
export const TABLE_NAMES = {
  MESSAGES: 'messages',
  PHOTOS: 'photos',
  CUSTOM_QUOTES: 'custom_quotes',
} as const

// 字段名常量
export const MESSAGE_FIELDS = {
  ID: 'id',
  CONTENT: 'content',
  COLOR: 'color',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const

export const PHOTO_FIELDS = {
  ID: 'id',
  URL: 'url',
  CAPTION: 'caption',
  IS_CUSTOM: 'isCustom',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const

export const QUOTE_FIELDS = {
  ID: 'id',
  TEXT: 'text',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const

// 默认值常量
export const DEFAULT_VALUES = {
  MESSAGE_COLOR: '#FFE4E1',
  PHOTO_CAPTION: '',
  PHOTO_IS_CUSTOM: true,
} as const

// 约束常量
export const CONSTRAINTS = {
  MAX_CONTENT_LENGTH: 200,
  MAX_CAPTION_LENGTH: 50,
  MIN_CONTENT_LENGTH: 1,
  COLOR_PATTERN: /^#[0-9A-Fa-f]{6}$/,
} as const

// 查询限制
export const QUERY_LIMITS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const

// 排序选项
export const SORT_OPTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const

// 类型守卫函数
export function isValidMessage(obj: any): obj is DrizzleMessage {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.color === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

export function isValidPhoto(obj: any): obj is DrizzlePhoto {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.caption === 'string' &&
    typeof obj.isCustom === 'boolean' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

export function isValidCustomQuote(obj: any): obj is DrizzleCustomQuote {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

// 数据验证函数
export function validateMessageContent(content: string): boolean {
  return (
    content.length >= CONSTRAINTS.MIN_CONTENT_LENGTH &&
    content.length <= CONSTRAINTS.MAX_CONTENT_LENGTH &&
    content.trim().length > 0
  )
}

export function validateMessageColor(color: string): boolean {
  return CONSTRAINTS.COLOR_PATTERN.test(color)
}

export function validatePhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function validatePhotoCaption(caption: string): boolean {
  return caption.length <= CONSTRAINTS.MAX_CAPTION_LENGTH
}

export function validateQuoteText(text: string): boolean {
  return (
    text.length >= CONSTRAINTS.MIN_CONTENT_LENGTH &&
    text.length <= CONSTRAINTS.MAX_CONTENT_LENGTH &&
    text.trim().length > 0
  )
}
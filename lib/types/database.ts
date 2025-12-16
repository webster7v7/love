import { z } from 'zod'

// 数据库实体类型
export interface Message {
  id: string
  content: string
  color: string
  author?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Photo {
  id: string
  url: string
  caption: string | null
  isCustom: boolean | null
  createdAt: Date
  updatedAt: Date
}

export interface CustomQuote {
  id: string
  text: string
  createdAt: Date
  updatedAt: Date
}

// 用于前端组件的类型（兼容现有代码）
export interface LegacyMessage {
  id: string
  content: string
  date: string
  createdAt: number
  color: string
  author?: string | null
}

export interface LegacyPhoto {
  id: string
  url: string
  caption: string
  createdAt: number
}

export interface LegacyQuote {
  id: string
  text: string
  isCustom: boolean
  createdAt: number
}

// 创建数据的输入类型
export interface CreateMessageData {
  content: string
  color?: string
  author?: string
}

export interface CreatePhotoData {
  url: string
  caption?: string
  isCustom?: boolean
}

export interface CreateQuoteData {
  text: string
}

// 更新数据的输入类型
export interface UpdateMessageData {
  content?: string
  color?: string
  author?: string
}

export interface UpdatePhotoData {
  caption?: string
}

// ID验证schema
const IdSchema = z.string()
  .uuid('无效的ID格式')

// 基础验证schemas
const ContentSchema = z.string()
  .min(1, '内容不能为空')
  .max(200, '内容不能超过200字符')
  .trim()
  .refine(val => val.length > 0, '内容不能只包含空白字符')

const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式必须为 #RRGGBB')
  .default('#FFE4E1')

const UrlSchema = z.string()
  .min(1, 'URL不能为空')
  .refine(
    url => {
      try {
        // 检查是否为 data URL (Base64 图片)
        if (url.startsWith('data:image/')) {
          return true
        }
        
        // 检查是否为有效的 HTTP/HTTPS URL
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    },
    '请输入有效的图片URL或选择图片文件'
  )

const CaptionSchema = z.string()
  .max(50, '描述不能超过50字符')
  .default('')

const AuthorSchema = z.string()
  .max(20, '昵称不能超过20字符')
  .min(1, '昵称不能为空')
  .trim()
  .refine(val => val.length > 0, '昵称不能只包含空白字符')
  .optional()

// Zod验证schemas
export const CreateMessageSchema = z.object({
  content: ContentSchema,
  color: ColorSchema.optional(),
  author: AuthorSchema,
}).strict()

export const UpdateMessageSchema = z.object({
  content: ContentSchema.optional(),
  color: ColorSchema.optional(),
  author: AuthorSchema,
}).strict()

export const MessageSchema = z.object({
  id: IdSchema,
  content: ContentSchema,
  color: ColorSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict().refine(
  data => Object.keys(data).length > 0,
  '至少需要提供一个要更新的字段'
)

export const CreatePhotoSchema = z.object({
  url: UrlSchema,
  caption: CaptionSchema.optional(),
  isCustom: z.boolean().default(true),
}).strict()

export const UpdatePhotoSchema = z.object({
  caption: CaptionSchema.optional(),
}).strict().refine(
  data => Object.keys(data).length > 0,
  '至少需要提供一个要更新的字段'
)

export const CreateQuoteSchema = z.object({
  text: ContentSchema,
  isCustom: z.boolean().optional().default(true),
}).strict()

export const PhotoSchema = z.object({
  id: IdSchema,
  url: UrlSchema,
  caption: CaptionSchema,
  isCustom: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict()

export const QuoteSchema = z.object({
  id: IdSchema,
  text: ContentSchema,
  isCustom: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict()

// 导出ID验证schema供外部使用
export { IdSchema }

// 查询参数验证
export const QueryOptionsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  orderBy: z.enum(['asc', 'desc']).default('desc'),
  orderField: z.string().optional(),
}).partial()

// 类型推断
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>
export type CreatePhotoInput = z.infer<typeof CreatePhotoSchema>
export type UpdatePhotoInput = z.infer<typeof UpdatePhotoSchema>
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>
export type QueryOptionsInput = z.infer<typeof QueryOptionsSchema>

// Server Action结果类型
export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  fallbackUsed?: boolean
}

// 查询选项
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: 'asc' | 'desc'
  orderField?: string
}

// 错误类型
export enum DatabaseErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  SSL_ERROR = 'SSL_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface DatabaseError extends Error {
  type: DatabaseErrorType
  code?: string
  details?: string | Record<string, unknown>
}

// 重试配置
export interface RetryConfig {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

// 数据转换函数
export function messageToLegacy(message: Message): LegacyMessage {
  return {
    id: message.id,
    content: message.content,
    date: message.createdAt.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    createdAt: message.createdAt.getTime(),
    color: message.color,
    author: message.author,
  }
}

export function photoToLegacy(photo: Photo): LegacyPhoto {
  return {
    id: photo.id,
    url: photo.url,
    caption: photo.caption || '',
    createdAt: photo.createdAt.getTime(),
  }
}

export function quoteToLegacy(quote: CustomQuote): LegacyQuote {
  return {
    id: quote.id,
    text: quote.text,
    isCustom: true, // 自定义情话都是true
    createdAt: quote.createdAt.getTime(),
  }
}

// 批量转换函数
export function messagesToLegacy(messages: Message[]): LegacyMessage[] {
  return messages.map(messageToLegacy)
}

export function photosToLegacy(photos: Photo[]): LegacyPhoto[] {
  return photos.map(photoToLegacy)
}

export function quotesToLegacy(quotes: CustomQuote[]): LegacyQuote[] {
  return quotes.map(quoteToLegacy)
}

// 验证辅助函数
export function validateCreateMessage(data: unknown): CreateMessageInput {
  return CreateMessageSchema.parse(data)
}

export function validateUpdateMessage(data: unknown): UpdateMessageInput {
  return UpdateMessageSchema.parse(data)
}

export function validateCreatePhoto(data: unknown): CreatePhotoInput {
  return CreatePhotoSchema.parse(data)
}

export function validateUpdatePhoto(data: unknown): UpdatePhotoInput {
  return UpdatePhotoSchema.parse(data)
}

export function validateCreateQuote(data: unknown): CreateQuoteInput {
  return CreateQuoteSchema.parse(data)
}

export function validateId(id: unknown): string {
  return IdSchema.parse(id)
}

export function validateQueryOptions(options: unknown): QueryOptionsInput {
  return QueryOptionsSchema.parse(options)
}

// 错误处理辅助函数
export function createActionResult<T>(
  success: boolean,
  data?: T,
  error?: string,
  code?: string
): ActionResult<T> {
  return { success, data, error, code }
}

export function createSuccessResult<T>(data: T): ActionResult<T> {
  return createActionResult(true, data)
}

export function createErrorResult<T = never>(
  error: string,
  code?: string
): ActionResult<T> {
  return createActionResult(false, undefined, error, code) as ActionResult<T>
}

// 数据库错误处理
export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    // 检查是否是约束违反错误
    if (error.message.includes('constraint')) {
      return {
        name: 'DatabaseError',
        message: '数据验证失败，请检查输入内容',
        type: DatabaseErrorType.CONSTRAINT_VIOLATION,
        details: error.message,
      }
    }
    
    // 检查是否是连接错误
    if (error.message.includes('connection') || error.message.includes('connect')) {
      return {
        name: 'DatabaseError',
        message: '数据库连接失败',
        type: DatabaseErrorType.CONNECTION_FAILED,
        details: error.message,
      }
    }
    
    // 其他错误
    return {
      name: 'DatabaseError',
      message: error.message,
      type: DatabaseErrorType.UNKNOWN_ERROR,
      details: error.message,
    }
  }
  
  return {
    name: 'DatabaseError',
    message: '未知错误',
    type: DatabaseErrorType.UNKNOWN_ERROR,
    details: String(error),
  }
}
'use server'

import { revalidatePath } from 'next/cache'

// 安全的revalidatePath包装器
function safeRevalidatePath(path: string) {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    try {
      revalidatePath(path)
    } catch (error) {
      // 在测试环境中忽略revalidatePath错误
      console.warn('revalidatePath failed (likely in test environment):', error)
    }
  }
}
import { repositories } from '@/lib/repositories'
import { 
  type ActionResult,
  type CreateMessageInput,
  type UpdateMessageInput,
  type LegacyMessage,
  type QueryOptions,
  createSuccessResult,
  createErrorResult,
  validateCreateMessage,
  validateUpdateMessage,
  validateId,
  validateQueryOptions,
  messageToLegacy,
  messagesToLegacy,
  handleDatabaseError
} from '@/lib/types/database'
import { withErrorHandling } from '@/lib/utils/action-helpers'
import { fallbackService } from '@/lib/error-handling/fallback-service'

// 创建留言（带降级服务）
export const createMessage = withErrorHandling(
  async (data: CreateMessageInput): Promise<LegacyMessage> => {
    // 验证输入数据
    const validatedData = validateCreateMessage(data)
    
    // 创建留言
    const message = await repositories.messages.create(validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return messageToLegacy(message)
  },
  // 降级服务：使用 localStorage
  async (data: CreateMessageInput): Promise<LegacyMessage> => {
    const validatedData = validateCreateMessage(data)
    const message = await fallbackService.messages.create(validatedData)
    return messageToLegacy(message)
  }
)

// 获取所有留言（带降级服务）
export const getMessages = withErrorHandling(
  async (options?: QueryOptions): Promise<LegacyMessage[]> => {
    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 获取留言列表
    const messages = await repositories.messages.findAll(validatedOptions)
    
    return messagesToLegacy(messages)
  },
  // 降级服务：从 localStorage 获取
  async (): Promise<LegacyMessage[]> => {
    const messages = await fallbackService.messages.getAll()
    return messagesToLegacy(messages)
  }
)

// 获取分页留言
export async function getMessagesPaginated(
  page: number = 1, 
  limit: number = 20, 
  orderBy: 'asc' | 'desc' = 'desc'
): Promise<ActionResult<{
  data: LegacyMessage[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取分页留言
    const result = await repositories.messages.findAllPaginated(page, limit, orderBy)
    
    return createSuccessResult({
      data: messagesToLegacy(result.data),
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Failed to get paginated messages:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取单个留言
export async function getMessage(id: string): Promise<ActionResult<LegacyMessage>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证ID
    const validatedId = validateId(id)
    
    // 获取留言
    const message = await repositories.messages.findById(validatedId)
    
    if (!message) {
      return createErrorResult('留言不存在', 'NOT_FOUND')
    }
    
    return createSuccessResult(messageToLegacy(message))
  } catch (error) {
    console.error('Failed to get message:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 更新留言
export async function updateMessage(id: string, data: UpdateMessageInput): Promise<ActionResult<LegacyMessage>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedId = validateId(id)
    const validatedData = validateUpdateMessage(data)
    
    // 更新留言
    const message = await repositories.messages.update(validatedId, validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(messageToLegacy(message))
  } catch (error) {
    console.error('Failed to update message:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 删除留言（带降级服务）
export const deleteMessage = withErrorHandling(
  async (id: string): Promise<boolean> => {
    // 验证ID
    const validatedId = validateId(id)
    
    // 删除留言
    const deleted = await repositories.messages.delete(validatedId)
    
    if (!deleted) {
      throw new Error('留言不存在或删除失败')
    }
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return true
  },
  // 降级服务：从 localStorage 删除
  async (id: string): Promise<boolean> => {
    const validatedId = validateId(id)
    return await fallbackService.messages.delete(validatedId)
  }
)

// 获取最近的留言
export async function getRecentMessages(limit: number = 10): Promise<ActionResult<LegacyMessage[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取最近留言
    const messages = await repositories.messages.findRecent(limit)
    
    return createSuccessResult(messagesToLegacy(messages))
  } catch (error) {
    console.error('Failed to get recent messages:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 按颜色搜索留言
export async function getMessagesByColor(color: string): Promise<ActionResult<LegacyMessage[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取指定颜色的留言
    const messages = await repositories.messages.findByColor(color)
    
    return createSuccessResult(messagesToLegacy(messages))
  } catch (error) {
    console.error('Failed to get messages by color:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 搜索留言内容
export async function searchMessages(searchTerm: string, options?: QueryOptions): Promise<ActionResult<LegacyMessage[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 搜索留言
    const messages = await repositories.messages.searchByContent(searchTerm, validatedOptions)
    
    return createSuccessResult(messagesToLegacy(messages))
  } catch (error) {
    console.error('Failed to search messages:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取留言统计
export async function getMessageStats(): Promise<ActionResult<{ total: number }>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取留言总数
    const total = await repositories.messages.count()
    
    return createSuccessResult({ total })
  } catch (error) {
    console.error('Failed to get message stats:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 批量创建留言（用于数据迁移）
export const createManyMessages = withErrorHandling(
  async (dataArray: CreateMessageInput[]): Promise<LegacyMessage[]> => {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证所有输入数据
    const validatedDataArray = dataArray.map(data => validateCreateMessage(data))
    
    // 批量创建留言
    const messages = await repositories.messages.createMany(validatedDataArray)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return messagesToLegacy(messages)
  },
  // 降级服务：逐个创建
  async (dataArray: CreateMessageInput[]) => {
    const results: LegacyMessage[] = []
    for (const data of dataArray) {
      try {
        const result = await fallbackService.messages.create(data)
        results.push(messageToLegacy(result))
      } catch (error) {
        console.error('Failed to create message in fallback:', error)
      }
    }
    return results
  }
)
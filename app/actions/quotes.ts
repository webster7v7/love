'use server'

import { revalidatePath } from 'next/cache'
import { repositories } from '@/lib/repositories'
import { 
  type ActionResult,
  type CreateQuoteInput,
  type LegacyQuote,
  type QueryOptions,
  createSuccessResult,
  createErrorResult,
  validateCreateQuote,
  validateId,
  validateQueryOptions,
  quoteToLegacy,
  quotesToLegacy,
  handleDatabaseError
} from '@/lib/types/database'
// import { withErrorHandling } from './common'
// import { fallbackService } from '@/lib/error-handling/fallback-service'

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

// 创建情话
export async function createQuote(data: CreateQuoteInput): Promise<ActionResult<LegacyQuote>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedData = validateCreateQuote(data)
    
    // 创建情话
    const quote = await repositories.quotes.create(validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(quoteToLegacy(quote))
  } catch (error) {
    console.error('Failed to create quote:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取所有情话
export async function getQuotes(options?: QueryOptions): Promise<ActionResult<LegacyQuote[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 获取情话列表
    const quotes = await repositories.quotes.findAll(validatedOptions)
    
    return createSuccessResult(quotesToLegacy(quotes))
  } catch (error) {
    console.error('Failed to get quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取单个情话
export async function getQuote(id: string): Promise<ActionResult<LegacyQuote>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证ID
    const validatedId = validateId(id)
    
    // 获取情话
    const quote = await repositories.quotes.findById(validatedId)
    
    if (!quote) {
      return createErrorResult('情话不存在', 'NOT_FOUND')
    }
    
    return createSuccessResult(quoteToLegacy(quote))
  } catch (error) {
    console.error('Failed to get quote:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 删除情话
export async function deleteQuote(id: string): Promise<ActionResult<boolean>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证ID
    const validatedId = validateId(id)
    
    // 删除情话
    const deleted = await repositories.quotes.delete(validatedId)
    
    if (!deleted) {
      return createErrorResult('情话不存在或删除失败', 'DELETE_FAILED')
    }
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(true)
  } catch (error) {
    console.error('Failed to delete quote:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取最近的情话
export async function getRecentQuotes(limit: number = 10): Promise<ActionResult<LegacyQuote[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取最近情话
    const quotes = await repositories.quotes.findRecent(limit)
    
    return createSuccessResult(quotesToLegacy(quotes))
  } catch (error) {
    console.error('Failed to get recent quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取随机情话
export async function getRandomQuotes(limit: number = 5): Promise<ActionResult<LegacyQuote[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取随机情话
    const quotes = await repositories.quotes.findRandom(limit)
    
    return createSuccessResult(quotesToLegacy(quotes))
  } catch (error) {
    console.error('Failed to get random quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 搜索情话内容
export async function searchQuotes(searchTerm: string, options?: QueryOptions): Promise<ActionResult<LegacyQuote[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 搜索情话
    const quotes = await repositories.quotes.searchByText(searchTerm, validatedOptions)
    
    return createSuccessResult(quotesToLegacy(quotes))
  } catch (error) {
    console.error('Failed to search quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 删除所有情话
export async function deleteAllQuotes(): Promise<ActionResult<number>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 删除所有情话
    const deletedCount = await repositories.quotes.deleteAll()
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(deletedCount)
  } catch (error) {
    console.error('Failed to delete all quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 批量创建情话
export async function createManyQuotes(data: CreateQuoteInput[]): Promise<ActionResult<LegacyQuote[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedData = data.map(item => validateCreateQuote(item))
    
    // 批量创建情话
    const quotes = await repositories.quotes.createMany(validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(quotesToLegacy(quotes))
  } catch (error) {
    console.error('Failed to create many quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 批量删除情话
export async function deleteManyQuotes(ids: string[]): Promise<ActionResult<number>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证所有ID
    const validatedIds = ids.map(id => validateId(id))
    
    // 批量删除情话
    const deletedCount = await repositories.quotes.deleteMany(validatedIds)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(deletedCount)
  } catch (error) {
    console.error('Failed to delete many quotes:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取情话统计
export async function getQuoteStats(): Promise<ActionResult<{
  total: number
  thisWeek: number
  thisMonth: number
  averageLength: number
}>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取情话统计
    const stats = await repositories.quotes.getStats()
    
    return createSuccessResult(stats)
  } catch (error) {
    console.error('Failed to get quote stats:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}
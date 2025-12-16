import { eq, desc, asc, count, and, gte, lte, inArray } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { customQuotes } from '../db/schema'
import { AbstractRepository } from './base'
import { 
  type CustomQuote, 
  type CreateQuoteInput, 
  type QueryOptions,
  validateCreateQuote,
  validateId
} from '../types/database'

// Custom Quotes Repository接口
export interface QuoteRepository {
  // 基础CRUD操作
  create(data: CreateQuoteInput): Promise<CustomQuote>
  findById(id: string): Promise<CustomQuote | null>
  findAll(options?: QueryOptions): Promise<CustomQuote[]>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
  
  // 统计方法
  getStats(): Promise<{
    total: number
    thisWeek: number
    thisMonth: number
    averageLength: number
  }>
  
  // 特定查询方法
  findByDateRange(startDate: Date, endDate: Date): Promise<CustomQuote[]>
  findRecent(limit?: number): Promise<CustomQuote[]>
  findRandom(limit?: number): Promise<CustomQuote[]>
  
  // 批量操作
  createMany(data: CreateQuoteInput[]): Promise<CustomQuote[]>
  deleteMany(ids: string[]): Promise<number>
  deleteAll(): Promise<number>
  
  // 搜索功能
  searchByText(searchTerm: string, options?: QueryOptions): Promise<CustomQuote[]>
}

// Custom Quotes Repository实现
export class DrizzleQuoteRepository 
  extends AbstractRepository<CustomQuote, CreateQuoteInput, never>
  implements QuoteRepository {
  
  private getDatabase() {
    const db = getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }
    return db
  }
  
  async create(data: CreateQuoteInput): Promise<CustomQuote> {
    try {
      // 验证输入数据
      const validatedData = validateCreateQuote(data)
      
      // 插入数据
      const [created] = await this.getDatabase()
        .insert(customQuotes)
        .values(validatedData)
        .returning()
      
      if (!created) {
        throw new Error('Failed to create quote')
      }
      
      return created
    } catch (error) {
      this.handleError('create quote', error)
    }
  }
  
  async findById(id: string): Promise<CustomQuote | null> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const [quote] = await this.getDatabase()
        .select()
        .from(customQuotes)
        .where(eq(customQuotes.id, validatedId))
        .limit(1)
      
      return quote || null
    } catch (error) {
      this.handleError('find quote by id', error)
    }
  }
  
  async findAll(options: QueryOptions = {}): Promise<CustomQuote[]> {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        orderBy = 'desc',
        orderField = 'createdAt'
      } = options
      
      // 构建查询
      const db = this.getDatabase()
      
      if (orderField === 'createdAt') {
        return await db
          .select()
          .from(customQuotes)
          .orderBy(orderBy === 'asc' ? asc(customQuotes.createdAt) : desc(customQuotes.createdAt))
          .limit(limit)
          .offset(offset)
      } else if (orderField === 'updatedAt') {
        return await db
          .select()
          .from(customQuotes)
          .orderBy(orderBy === 'asc' ? asc(customQuotes.updatedAt) : desc(customQuotes.updatedAt))
          .limit(limit)
          .offset(offset)
      } else {
        return await db
          .select()
          .from(customQuotes)
          .orderBy(desc(customQuotes.createdAt))
          .limit(limit)
          .offset(offset)
      }
    } catch (error) {
      this.handleError('find all quotes', error)
    }
  }
  
  // 情话不支持更新，只能删除重新创建
  async update(): Promise<never> {
    throw new Error('Quotes cannot be updated, only deleted and recreated')
  }
  
  async delete(id: string): Promise<boolean> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const result = await this.getDatabase()
        .delete(customQuotes)
        .where(eq(customQuotes.id, validatedId))
      
      return result.rowCount > 0
    } catch (error) {
      this.handleError('delete quote', error)
    }
  }
  
  async count(): Promise<number> {
    try {
      const [result] = await this.getDatabase()
        .select({ count: count() })
        .from(customQuotes)
      
      return result.count
    } catch (error) {
      this.handleError('count quotes', error)
    }
  }
  
  // 特定查询方法
  async findByDateRange(startDate: Date, endDate: Date): Promise<CustomQuote[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(customQuotes)
        .where(
          and(
            gte(customQuotes.createdAt, startDate),
            lte(customQuotes.createdAt, endDate)
          )
        )
        .orderBy(desc(customQuotes.createdAt))
    } catch (error) {
      this.handleError('find quotes by date range', error)
    }
  }
  
  async findRecent(limit: number = 10): Promise<CustomQuote[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(customQuotes)
        .orderBy(desc(customQuotes.createdAt))
        .limit(Math.min(limit, 100)) // 最多100条
    } catch (error) {
      this.handleError('find recent quotes', error)
    }
  }
  
  // 随机获取情话
  async findRandom(limit: number = 5): Promise<CustomQuote[]> {
    try {
      // 使用PostgreSQL的RANDOM()函数
      return await this.getDatabase()
        .select()
        .from(customQuotes)
        .orderBy(sql`RANDOM()`)
        .limit(Math.min(limit, 50)) // 最多50条
    } catch (error) {
      this.handleError('find random quotes', error)
    }
  }
  
  // 搜索功能
  async searchByText(searchTerm: string, options: QueryOptions = {}): Promise<CustomQuote[]> {
    try {
      const { limit = 20, offset = 0 } = options
      
      // 使用PostgreSQL的ILIKE进行不区分大小写的搜索
      return await this.getDatabase()
        .select()
        .from(customQuotes)
        .where(sql`${customQuotes.text} ILIKE ${`%${searchTerm}%`}`)
        .orderBy(desc(customQuotes.createdAt))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      this.handleError('search quotes by text', error)
    }
  }
  
  // 批量操作的优化实现
  async createMany(data: CreateQuoteInput[]): Promise<CustomQuote[]> {
    try {
      if (data.length === 0) return []
      
      // 验证所有输入数据
      const validatedData = data.map(item => validateCreateQuote(item))
      
      // 批量插入
      const created = await this.getDatabase()
        .insert(customQuotes)
        .values(validatedData)
        .returning()
      
      return created
    } catch (error) {
      this.handleError('create many quotes', error)
    }
  }
  
  async deleteMany(ids: string[]): Promise<number> {
    try {
      if (ids.length === 0) return 0
      
      // 验证所有ID
      const validatedIds = ids.map(id => validateId(id))
      
      // 批量删除
      const result = await this.getDatabase()
        .delete(customQuotes)
        .where(inArray(customQuotes.id, validatedIds))
      
      return result.rowCount
    } catch (error) {
      this.handleError('delete many quotes', error)
    }
  }
  
  // 删除所有自定义情话
  async deleteAll(): Promise<number> {
    try {
      const result = await this.getDatabase()
        .delete(customQuotes)
      
      return result.rowCount
    } catch (error) {
      this.handleError('delete all quotes', error)
    }
  }
  
  // 获取情话统计信息
  async getStats(): Promise<{
    total: number
    thisWeek: number
    thisMonth: number
    averageLength: number
  }> {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const [totalResult] = await this.getDatabase()
        .select({ count: count() })
        .from(customQuotes)
      
      const [weekResult] = await this.getDatabase()
        .select({ count: count() })
        .from(customQuotes)
        .where(gte(customQuotes.createdAt, weekAgo))
      
      const [monthResult] = await this.getDatabase()
        .select({ count: count() })
        .from(customQuotes)
        .where(gte(customQuotes.createdAt, monthAgo))
      
      // 计算平均长度
      const [avgResult] = await this.getDatabase()
        .select({ avg: sql<number>`AVG(LENGTH(${customQuotes.text}))` })
        .from(customQuotes)
      
      return {
        total: totalResult.count,
        thisWeek: weekResult.count,
        thisMonth: monthResult.count,
        averageLength: Math.round(avgResult.avg || 0),
      }
    } catch (error) {
      this.handleError('get quote stats', error)
    }
  }
}

// 导出Repository实例
export const quoteRepository = new DrizzleQuoteRepository()

// 导入必要的函数
import { sql } from 'drizzle-orm'
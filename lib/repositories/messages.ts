import { eq, desc, asc, count, and, gte, lte, inArray } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { messages } from '../db/schema'
import { AbstractRepository } from './base'
import { 
  type Message, 
  type CreateMessageInput, 
  type UpdateMessageInput,
  type QueryOptions,
  validateCreateMessage,
  validateUpdateMessage,
  validateId
} from '../types/database'
import { 
  validatePaginationParams,
  createPaginatedResult,
  withPaginationMetrics,
  type PaginatedResult
} from '../performance'

// Messages Repository接口
export interface MessageRepository {
  // 基础CRUD操作
  create(data: CreateMessageInput): Promise<Message>
  findById(id: string): Promise<Message | null>
  findAll(options?: QueryOptions): Promise<Message[]>
  update(id: string, data: UpdateMessageInput): Promise<Message>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
  
  // 分页查询
  findAllPaginated(page?: number, limit?: number, orderBy?: 'asc' | 'desc'): Promise<PaginatedResult<Message>>
  
  // 特定查询方法
  findByDateRange(startDate: Date, endDate: Date): Promise<Message[]>
  findRecent(limit?: number): Promise<Message[]>
  findByColor(color: string): Promise<Message[]>
  
  // 批量操作
  createMany(data: CreateMessageInput[]): Promise<Message[]>
  deleteMany(ids: string[]): Promise<number>
  
  // 搜索功能
  searchByContent(searchTerm: string, options?: QueryOptions): Promise<Message[]>
}

// Messages Repository实现
export class DrizzleMessageRepository 
  extends AbstractRepository<Message, CreateMessageInput, UpdateMessageInput>
  implements MessageRepository {
  
  private getDatabase() {
    const db = getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }
    return db
  }
  
  async create(data: CreateMessageInput): Promise<Message> {
    try {
      // 验证输入数据
      const validatedData = validateCreateMessage(data)
      
      // 插入数据
      const [created] = await this.getDatabase()
        .insert(messages)
        .values(validatedData)
        .returning()
      
      if (!created) {
        throw new Error('Failed to create message')
      }
      
      return created
    } catch (error) {
      this.handleError('create message', error)
    }
  }
  
  async findById(id: string): Promise<Message | null> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const [message] = await this.getDatabase()
        .select()
        .from(messages)
        .where(eq(messages.id, validatedId))
        .limit(1)
      
      return message || null
    } catch (error) {
      this.handleError('find message by id', error)
    }
  }
  
  async findAll(options: QueryOptions = {}): Promise<Message[]> {
    return await withPaginationMetrics('messages_findAll', async () => {
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
            .from(messages)
            .orderBy(orderBy === 'asc' ? asc(messages.createdAt) : desc(messages.createdAt))
            .limit(limit)
            .offset(offset)
        } else if (orderField === 'updatedAt') {
          return await db
            .select()
            .from(messages)
            .orderBy(orderBy === 'asc' ? asc(messages.updatedAt) : desc(messages.updatedAt))
            .limit(limit)
            .offset(offset)
        } else {
          return await db
            .select()
            .from(messages)
            .orderBy(desc(messages.createdAt))
            .limit(limit)
            .offset(offset)
        }
      } catch (error) {
        this.handleError('find all messages', error)
      }
    })()
  }

  // 新增：分页查询方法
  async findAllPaginated(page: number = 1, limit: number = 20, orderBy: 'asc' | 'desc' = 'desc'): Promise<PaginatedResult<Message>> {
    return await withPaginationMetrics('messages_findAllPaginated', async (): Promise<PaginatedResult<Message>> => {
      try {
        const params = validatePaginationParams({ page, limit, orderBy })
        const offset = (params.page - 1) * params.limit
        
        // 获取总数
        const [totalResult] = await this.getDatabase()
          .select({ count: count() })
          .from(messages)
        
        const total = totalResult.count
        
        // 获取分页数据
        const query = this.getDatabase()
          .select()
          .from(messages)
          .orderBy(params.orderBy === 'asc' ? asc(messages.createdAt) : desc(messages.createdAt))
          .limit(params.limit)
          .offset(offset)
        
        const data = await query
        
        return createPaginatedResult(data, total, params)
      } catch (error) {
        this.handleError('find all messages paginated', error)
      }
    })()
  }
  
  async update(id: string, data: UpdateMessageInput): Promise<Message> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      const validatedData = validateUpdateMessage(data)
      
      // 添加更新时间
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      }
      
      const [updated] = await this.getDatabase()
        .update(messages)
        .set(updateData)
        .where(eq(messages.id, validatedId))
        .returning()
      
      if (!updated) {
        throw new Error('Message not found or update failed')
      }
      
      return updated
    } catch (error) {
      this.handleError('update message', error)
    }
  }
  
  async delete(id: string): Promise<boolean> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const result = await this.getDatabase()
        .delete(messages)
        .where(eq(messages.id, validatedId))
      
      return result.rowCount > 0
    } catch (error) {
      this.handleError('delete message', error)
    }
  }
  
  async count(): Promise<number> {
    try {
      const [result] = await this.getDatabase()
        .select({ count: count() })
        .from(messages)
      
      return result.count
    } catch (error) {
      this.handleError('count messages', error)
    }
  }
  
  // 特定查询方法
  async findByDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(messages)
        .where(
          and(
            gte(messages.createdAt, startDate),
            lte(messages.createdAt, endDate)
          )
        )
        .orderBy(desc(messages.createdAt))
    } catch (error) {
      this.handleError('find messages by date range', error)
    }
  }
  
  async findRecent(limit: number = 10): Promise<Message[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(messages)
        .orderBy(desc(messages.createdAt))
        .limit(Math.min(limit, 100)) // 最多100条
    } catch (error) {
      this.handleError('find recent messages', error)
    }
  }
  
  async findByColor(color: string): Promise<Message[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(messages)
        .where(eq(messages.color, color))
        .orderBy(desc(messages.createdAt))
    } catch (error) {
      this.handleError('find messages by color', error)
    }
  }
  
  // 搜索功能
  async searchByContent(searchTerm: string, options: QueryOptions = {}): Promise<Message[]> {
    try {
      const { limit = 20, offset = 0 } = options
      
      // 使用PostgreSQL的ILIKE进行不区分大小写的搜索
      return await this.getDatabase()
        .select()
        .from(messages)
        .where(sql`${messages.content} ILIKE ${`%${searchTerm}%`}`)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      this.handleError('search messages by content', error)
    }
  }
  
  // 批量操作的优化实现
  async createMany(data: CreateMessageInput[]): Promise<Message[]> {
    try {
      if (data.length === 0) return []
      
      // 验证所有输入数据
      const validatedData = data.map(item => validateCreateMessage(item))
      
      // 批量插入
      const created = await this.getDatabase()
        .insert(messages)
        .values(validatedData)
        .returning()
      
      return created
    } catch (error) {
      this.handleError('create many messages', error)
    }
  }
  
  async deleteMany(ids: string[]): Promise<number> {
    try {
      if (ids.length === 0) return 0
      
      // 验证所有ID
      const validatedIds = ids.map(id => validateId(id))
      
      // 批量删除
      const result = await this.getDatabase()
        .delete(messages)
        .where(inArray(messages.id, validatedIds))
      
      return result.rowCount
    } catch (error) {
      this.handleError('delete many messages', error)
    }
  }
}

// 导出Repository实例
export const messageRepository = new DrizzleMessageRepository()

// 导入必要的函数
import { sql } from 'drizzle-orm'
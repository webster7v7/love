import { eq, desc, asc, count, and, gte, lte, inArray } from 'drizzle-orm'
import { getDb } from '../db/connection'
import { photos } from '../db/schema'
import { AbstractRepository } from './base'
import { 
  type Photo, 
  type CreatePhotoInput, 
  type UpdatePhotoInput,
  type QueryOptions,
  validateCreatePhoto,
  validateUpdatePhoto,
  validateId
} from '../types/database'

// Photos Repository接口
export interface PhotoRepository {
  // 基础CRUD操作
  create(data: CreatePhotoInput): Promise<Photo>
  findById(id: string): Promise<Photo | null>
  findAll(options?: QueryOptions): Promise<Photo[]>
  update(id: string, data: UpdatePhotoInput): Promise<Photo>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
  
  // 计数方法
  countCustomPhotos(): Promise<number>
  countDefaultPhotos(): Promise<number>
  
  // 特定查询方法
  findCustomPhotos(options?: QueryOptions): Promise<Photo[]>
  findDefaultPhotos(options?: QueryOptions): Promise<Photo[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<Photo[]>
  findRecent(limit?: number): Promise<Photo[]>
  
  // 批量操作
  createMany(data: CreatePhotoInput[]): Promise<Photo[]>
  deleteMany(ids: string[]): Promise<number>
  deleteCustomPhotos(): Promise<number>
  
  // 搜索功能
  searchByCaption(searchTerm: string, options?: QueryOptions): Promise<Photo[]>
}

// Photos Repository实现
export class DrizzlePhotoRepository 
  extends AbstractRepository<Photo, CreatePhotoInput, UpdatePhotoInput>
  implements PhotoRepository {
  
  private getDatabase() {
    const db = getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }
    return db
  }
  
  async create(data: CreatePhotoInput): Promise<Photo> {
    try {
      // 验证输入数据
      const validatedData = validateCreatePhoto(data)
      
      // 插入数据
      const [created] = await this.getDatabase()
        .insert(photos)
        .values(validatedData)
        .returning()
      
      if (!created) {
        throw new Error('Failed to create photo')
      }
      
      return created
    } catch (error) {
      this.handleError('create photo', error)
    }
  }
  
  async findById(id: string): Promise<Photo | null> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const [photo] = await this.getDatabase()
        .select()
        .from(photos)
        .where(eq(photos.id, validatedId))
        .limit(1)
      
      return photo || null
    } catch (error) {
      this.handleError('find photo by id', error)
    }
  }
  
  async findAll(options: QueryOptions = {}): Promise<Photo[]> {
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
          .from(photos)
          .orderBy(orderBy === 'asc' ? asc(photos.createdAt) : desc(photos.createdAt))
          .limit(limit)
          .offset(offset)
      } else if (orderField === 'updatedAt') {
        return await db
          .select()
          .from(photos)
          .orderBy(orderBy === 'asc' ? asc(photos.updatedAt) : desc(photos.updatedAt))
          .limit(limit)
          .offset(offset)
      } else {
        return await db
          .select()
          .from(photos)
          .orderBy(desc(photos.createdAt))
          .limit(limit)
          .offset(offset)
      }
    } catch (error) {
      this.handleError('find all photos', error)
    }
  }
  
  async update(id: string, data: UpdatePhotoInput): Promise<Photo> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      const validatedData = validateUpdatePhoto(data)
      
      // 添加更新时间
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      }
      
      const [updated] = await this.getDatabase()
        .update(photos)
        .set(updateData)
        .where(eq(photos.id, validatedId))
        .returning()
      
      if (!updated) {
        throw new Error('Photo not found or update failed')
      }
      
      return updated
    } catch (error) {
      this.handleError('update photo', error)
    }
  }
  
  async delete(id: string): Promise<boolean> {
    try {
      this.validateId(id)
      const validatedId = validateId(id)
      
      const result = await this.getDatabase()
        .delete(photos)
        .where(eq(photos.id, validatedId))
      
      return result.rowCount > 0
    } catch (error) {
      this.handleError('delete photo', error)
    }
  }
  
  async count(): Promise<number> {
    try {
      const [result] = await this.getDatabase()
        .select({ count: count() })
        .from(photos)
      
      return result.count
    } catch (error) {
      this.handleError('count photos', error)
    }
  }
  
  // 特定查询方法
  async findCustomPhotos(options: QueryOptions = {}): Promise<Photo[]> {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        orderBy = 'desc' 
      } = options
      
      return await this.getDatabase()
        .select()
        .from(photos)
        .where(eq(photos.isCustom, true))
        .orderBy(orderBy === 'asc' ? asc(photos.createdAt) : desc(photos.createdAt))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      this.handleError('find custom photos', error)
    }
  }
  
  async findDefaultPhotos(options: QueryOptions = {}): Promise<Photo[]> {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        orderBy = 'desc' 
      } = options
      
      return await this.getDatabase()
        .select()
        .from(photos)
        .where(eq(photos.isCustom, false))
        .orderBy(orderBy === 'asc' ? asc(photos.createdAt) : desc(photos.createdAt))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      this.handleError('find default photos', error)
    }
  }
  
  async findByDateRange(startDate: Date, endDate: Date): Promise<Photo[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(photos)
        .where(
          and(
            gte(photos.createdAt, startDate),
            lte(photos.createdAt, endDate)
          )
        )
        .orderBy(desc(photos.createdAt))
    } catch (error) {
      this.handleError('find photos by date range', error)
    }
  }
  
  async findRecent(limit: number = 10): Promise<Photo[]> {
    try {
      return await this.getDatabase()
        .select()
        .from(photos)
        .orderBy(desc(photos.createdAt))
        .limit(Math.min(limit, 100)) // 最多100条
    } catch (error) {
      this.handleError('find recent photos', error)
    }
  }
  
  // 搜索功能
  async searchByCaption(searchTerm: string, options: QueryOptions = {}): Promise<Photo[]> {
    try {
      const { limit = 20, offset = 0 } = options
      
      // 使用PostgreSQL的ILIKE进行不区分大小写的搜索
      return await this.getDatabase()
        .select()
        .from(photos)
        .where(sql`${photos.caption} ILIKE ${`%${searchTerm}%`}`)
        .orderBy(desc(photos.createdAt))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      this.handleError('search photos by caption', error)
    }
  }
  
  // 批量操作的优化实现
  async createMany(data: CreatePhotoInput[]): Promise<Photo[]> {
    try {
      if (data.length === 0) return []
      
      // 验证所有输入数据
      const validatedData = data.map(item => validateCreatePhoto(item))
      
      // 批量插入
      const created = await this.getDatabase()
        .insert(photos)
        .values(validatedData)
        .returning()
      
      return created
    } catch (error) {
      this.handleError('create many photos', error)
    }
  }
  
  async deleteMany(ids: string[]): Promise<number> {
    try {
      if (ids.length === 0) return 0
      
      // 验证所有ID
      const validatedIds = ids.map(id => validateId(id))
      
      // 批量删除
      const result = await this.getDatabase()
        .delete(photos)
        .where(inArray(photos.id, validatedIds))
      
      return result.rowCount
    } catch (error) {
      this.handleError('delete many photos', error)
    }
  }
  
  // 删除所有自定义照片
  async deleteCustomPhotos(): Promise<number> {
    try {
      const result = await this.getDatabase()
        .delete(photos)
        .where(eq(photos.isCustom, true))
      
      return result.rowCount
    } catch (error) {
      this.handleError('delete custom photos', error)
    }
  }
  
  // 统计方法
  async countCustomPhotos(): Promise<number> {
    try {
      const [result] = await this.getDatabase()
        .select({ count: count() })
        .from(photos)
        .where(eq(photos.isCustom, true))
      
      return result.count
    } catch (error) {
      this.handleError('count custom photos', error)
    }
  }
  
  async countDefaultPhotos(): Promise<number> {
    try {
      const [result] = await this.getDatabase()
        .select({ count: count() })
        .from(photos)
        .where(eq(photos.isCustom, false))
      
      return result.count
    } catch (error) {
      this.handleError('count default photos', error)
    }
  }
}

// 导出Repository实例
export const photoRepository = new DrizzlePhotoRepository()

// 导入必要的函数
import { sql } from 'drizzle-orm'
import { QueryOptions } from '../types/database'

// 基础Repository接口
export interface BaseRepository<T, CreateInput, UpdateInput> {
  // 创建操作
  create(data: CreateInput): Promise<T>
  
  // 查询操作
  findById(id: string): Promise<T | null>
  findAll(options?: QueryOptions): Promise<T[]>
  
  // 更新操作
  update(id: string, data: UpdateInput): Promise<T>
  
  // 删除操作
  delete(id: string): Promise<boolean>
  
  // 计数操作
  count(): Promise<number>
  
  // 批量操作
  createMany(data: CreateInput[]): Promise<T[]>
  deleteMany(ids: string[]): Promise<number>
}

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// 扩展的Repository接口，支持分页
export interface PaginatedRepository<T, CreateInput, UpdateInput> 
  extends BaseRepository<T, CreateInput, UpdateInput> {
  findPaginated(page: number, pageSize: number, options?: QueryOptions): Promise<PaginatedResult<T>>
}

// Repository错误类
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

// Repository操作结果
export interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: string
}

// 创建Repository结果的辅助函数
export function createRepositorySuccess<T>(data: T): RepositoryResult<T> {
  return { success: true, data }
}

export function createRepositoryError<T>(error: string): RepositoryResult<T> {
  return { success: false, error }
}

// 抽象基础Repository类
export abstract class AbstractRepository<T, CreateInput, UpdateInput> 
  implements PaginatedRepository<T, CreateInput, UpdateInput> {
  
  // 抽象方法，由具体实现类提供
  abstract create(data: CreateInput): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract findAll(options?: QueryOptions): Promise<T[]>
  abstract update(id: string, data: UpdateInput): Promise<T>
  abstract delete(id: string): Promise<boolean>
  abstract count(): Promise<number>
  
  // 默认实现的批量操作
  async createMany(data: CreateInput[]): Promise<T[]> {
    const results: T[] = []
    for (const item of data) {
      const created = await this.create(item)
      results.push(created)
    }
    return results
  }
  
  async deleteMany(ids: string[]): Promise<number> {
    let deletedCount = 0
    for (const id of ids) {
      const deleted = await this.delete(id)
      if (deleted) deletedCount++
    }
    return deletedCount
  }
  
  // 分页查询的默认实现
  async findPaginated(
    page: number = 1, 
    pageSize: number = 20, 
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    // 验证分页参数
    if (page < 1) page = 1
    if (pageSize < 1 || pageSize > 100) pageSize = 20
    
    const offset = (page - 1) * pageSize
    const limit = pageSize
    
    // 获取总数和数据
    const [total, data] = await Promise.all([
      this.count(),
      this.findAll({ ...options, offset, limit })
    ])
    
    return {
      data,
      total,
      page,
      pageSize,
      hasNext: offset + pageSize < total,
      hasPrev: page > 1,
    }
  }
  
  // 错误处理辅助方法
  protected handleError(operation: string, error: unknown): never {
    if (error instanceof Error) {
      throw new RepositoryError(`${operation} failed: ${error.message}`, operation, error)
    }
    throw new RepositoryError(`${operation} failed: Unknown error`, operation)
  }
  
  // 验证ID格式的辅助方法
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new RepositoryError('Invalid ID provided', 'validation')
    }
  }
}
/**
 * localStorage 降级服务
 * 当数据库不可用时，提供 localStorage 作为备用存储
 */

import { z } from 'zod'
import { MessageSchema, PhotoSchema, QuoteSchema } from '../types/database'
import type { Message, Photo, CustomQuote, CreateMessageInput } from '../types/database'

// 降级服务接口
export interface FallbackService<T> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(data: Omit<T, 'id' | 'createdAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
  clear(): Promise<void>
}

// localStorage 键名
const STORAGE_KEYS = {
  messages: 'love-message-board',
  photos: 'love-photo-gallery', 
  quotes: 'custom-love-quotes'
} as const

// 基础 localStorage 服务
abstract class BaseLocalStorageService<T> implements FallbackService<T> {
  protected abstract storageKey: string
  protected abstract schema: z.ZodSchema<T>
  protected abstract generateId(): string
  protected abstract addTimestamp(data: any): T

  protected getStoredData(): T[] {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return []
      }
      
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error(`Failed to load data from ${this.storageKey}:`, error)
      return []
    }
  }

  protected saveData(data: T[]): void {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available in this environment')
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save data to ${this.storageKey}:`, error)
      throw new Error('存储空间不足或数据过大')
    }
  }

  async getAll(): Promise<T[]> {
    return this.getStoredData()
  }

  async getById(id: string): Promise<T | null> {
    const data = this.getStoredData()
    return data.find((item: any) => item.id === id) || null
  }

  async create(data: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    const newItem = this.addTimestamp({
      ...data,
      id: this.generateId()
    })

    // 验证数据
    const validated = this.schema.parse(newItem)
    
    const allData = this.getStoredData()
    allData.push(validated)
    this.saveData(allData)
    
    return validated
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const allData = this.getStoredData()
    const index = allData.findIndex((item: any) => item.id === id)
    
    if (index === -1) return null
    
    const updated = { ...allData[index], ...data }
    const validated = this.schema.parse(updated)
    
    allData[index] = validated
    this.saveData(allData)
    
    return validated
  }

  async delete(id: string): Promise<boolean> {
    const allData = this.getStoredData()
    const filteredData = allData.filter((item: any) => item.id !== id)
    
    if (filteredData.length === allData.length) return false
    
    this.saveData(filteredData)
    return true
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey)
  }
}

// 留言降级服务
export class MessageFallbackService extends BaseLocalStorageService<Message> {
  protected storageKey = STORAGE_KEYS.messages
  protected schema = MessageSchema

  protected generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected addTimestamp(data: any): Message {
    const now = new Date()
    return {
      ...data,
      createdAt: now,
      updatedAt: now,
      date: now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  // 获取最近的留言（带分页）
  async getRecent(limit: number = 20, offset: number = 0): Promise<Message[]> {
    const allData = this.getStoredData()
    const sorted = allData.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt
      return bTime - aTime
    })
    return sorted.slice(offset, offset + limit)
  }

  // 重写 create 方法以接受 CreateMessageInput
  async create(data: CreateMessageInput): Promise<Message>
  async create(data: Omit<Message, "id" | "createdAt">): Promise<Message>
  async create(data: CreateMessageInput | Omit<Message, "id" | "createdAt">): Promise<Message> {
    const messageData = {
      content: data.content,
      color: data.color || '#FFE4E1', // 默认颜色
      author: 'author' in data ? data.author || null : null, // 确保类型匹配
      updatedAt: 'updatedAt' in data ? data.updatedAt : new Date() // 添加 updatedAt 字段
    }
    
    const newItem = this.addTimestamp({
      ...messageData,
      id: this.generateId()
    })

    // 验证数据
    const validated = this.schema.parse(newItem)
    
    const allData = this.getStoredData()
    allData.push(validated)
    this.saveData(allData)
    
    return validated
  }
}

// 照片降级服务
export class PhotoFallbackService extends BaseLocalStorageService<Photo> {
  protected storageKey = STORAGE_KEYS.photos
  protected schema = PhotoSchema

  protected generateId(): string {
    return `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected addTimestamp(data: any): Photo {
    const now = new Date()
    return {
      ...data,
      createdAt: now,
      updatedAt: now
    }
  }

  // 获取自定义照片（过滤默认照片）
  async getCustomPhotos(): Promise<Photo[]> {
    const allData = this.getStoredData()
    return allData.filter(photo => !photo.id.startsWith('default-'))
  }

  // 兼容旧版本数据格式
  protected getStoredData(): Photo[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []
      
      // 转换旧格式数据
      return parsed.map(item => {
        if (typeof item === 'string') {
          // 旧格式：只有 URL 字符串
          return {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: item,
            caption: '美好回忆',
            createdAt: Date.now()
          }
        }
        return item
      })
    } catch (error) {
      console.error(`Failed to load data from ${this.storageKey}:`, error)
      return []
    }
  }
}

// 情话降级服务
export class QuoteFallbackService extends BaseLocalStorageService<CustomQuote> {
  protected storageKey = STORAGE_KEYS.quotes
  protected schema = QuoteSchema

  protected generateId(): string {
    return `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  protected addTimestamp(data: any): CustomQuote {
    const now = new Date()
    return {
      ...data,
      createdAt: now,
      updatedAt: now,
      isCustom: true // localStorage 中的都是自定义情话
    }
  }

  // 获取随机情话
  async getRandomQuotes(count: number = 3): Promise<CustomQuote[]> {
    const allData = this.getStoredData()
    if (allData.length === 0) return []
    
    const shuffled = [...allData].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  // 搜索情话
  async searchQuotes(query: string): Promise<CustomQuote[]> {
    const allData = this.getStoredData()
    const lowerQuery = query.toLowerCase()
    
    return allData.filter(quote => 
      quote.text.toLowerCase().includes(lowerQuery)
    )
  }
}

// 降级服务管理器
export class FallbackServiceManager {
  private messageService = new MessageFallbackService()
  private photoService = new PhotoFallbackService()
  private quoteService = new QuoteFallbackService()
  
  get messages() {
    return this.messageService
  }
  
  get photos() {
    return this.photoService
  }
  
  get quotes() {
    return this.quoteService
  }

  // 检查 localStorage 是否可用
  isAvailable(): boolean {
    try {
      // 检查是否在浏览器环境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false
      }
      
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  // 获取存储使用情况
  getStorageInfo() {
    if (!this.isAvailable()) {
      return { available: false, usage: 0, quota: 0 }
    }

    try {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }

      return {
        available: true,
        usage: totalSize,
        quota: 5 * 1024 * 1024, // 大约 5MB（浏览器限制）
        usagePercent: (totalSize / (5 * 1024 * 1024)) * 100
      }
    } catch {
      return { available: false, usage: 0, quota: 0 }
    }
  }

  // 清理所有降级数据
  async clearAll(): Promise<void> {
    await Promise.all([
      this.messageService.clear(),
      this.photoService.clear(),
      this.quoteService.clear()
    ])
  }

  // 导出数据（用于迁移）
  async exportData() {
    const [messages, photos, quotes] = await Promise.all([
      this.messageService.getAll(),
      this.photoService.getAll(),
      this.quoteService.getAll()
    ])

    return {
      messages,
      photos,
      quotes,
      exportedAt: Date.now()
    }
  }
}

// 导出单例
export const fallbackService = new FallbackServiceManager()
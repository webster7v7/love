'use client'

/**
 * 客户端会话管理器
 */
export class SessionManager {
  private static instance: SessionManager
  private sessionId: string | null = null
  private readonly STORAGE_KEY = 'visit-session-id'
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24小时

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * 获取或创建会话ID
   * 修改为每次都生成新的会话ID，实现真正的访问统计
   */
  getSessionId(): string {
    // 每次都生成新的会话ID
    this.sessionId = this.generateNewSessionId()
    this.saveSession()
    
    return this.sessionId
  }

  /**
   * 生成新的会话ID
   * 修改为每次访问都生成新ID，实现真正的访问统计
   */
  private generateNewSessionId(): string {
    if (typeof window === 'undefined') {
      // 服务端环境
      return this.hash(`server-${Date.now()}-${Math.random()}`)
    }

    // 客户端环境 - 每次访问生成新的唯一ID
    const fingerprint = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width + 'x' + screen.height,
      navigator.platform || '',
      Date.now(), // 使用时间戳确保唯一性
      Math.random().toString(36) // 添加随机性
    ].join('|')

    return this.hash(fingerprint)
  }

  /**
   * 保存会话到localStorage
   */
  private saveSession(): void {
    if (typeof window !== 'undefined' && this.sessionId) {
      try {
        const sessionData = {
          sessionId: this.sessionId,
          timestamp: Date.now()
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
      } catch (error) {
        console.warn('Failed to save session to localStorage:', error)
      }
    }
  }

  /**
   * 哈希函数
   */
  private hash(input: string): string {
    // 简单的哈希函数，避免在客户端使用crypto
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36).padStart(8, '0')
  }

  /**
   * 强制刷新会话ID
   */
  refreshSession(): string {
    this.sessionId = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
    return this.getSessionId()
  }

  /**
   * 检查是否为新会话
   */
  isNewSession(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return !stored
    } catch {
      return true
    }
  }
}

// 导出单例实例
export const sessionManager = SessionManager.getInstance()
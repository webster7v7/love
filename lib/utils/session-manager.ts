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
   */
  getSessionId(): string {
    if (this.sessionId) {
      return this.sessionId
    }

    // 尝试从localStorage恢复
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          const { sessionId, timestamp } = JSON.parse(stored)
          
          // 检查是否过期（24小时）
          if (Date.now() - timestamp < this.SESSION_DURATION) {
            this.sessionId = sessionId
            return sessionId
          } else {
            // 过期，删除旧会话
            localStorage.removeItem(this.STORAGE_KEY)
          }
        }
      } catch (error) {
        console.warn('Failed to restore session from localStorage:', error)
      }
    }

    // 生成新会话ID
    this.sessionId = this.generateNewSessionId()
    this.saveSession()
    
    return this.sessionId
  }

  /**
   * 生成新的会话ID
   */
  private generateNewSessionId(): string {
    if (typeof window === 'undefined') {
      // 服务端环境
      const today = new Date().toDateString()
      return this.hash(`server-${today}-${Math.random()}`)
    }

    // 客户端环境 - 基于浏览器指纹
    const fingerprint = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width + 'x' + screen.height,
      navigator.platform || '',
      new Date().toDateString(), // 每天更新
      Math.random().toString(36) // 添加随机性避免冲突
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
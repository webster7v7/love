'use client'

import { sessionManager } from '@/lib/utils/session-manager'
import { recordVisit } from './visits'

/**
 * 客户端访问记录
 */
export async function recordClientVisit(): Promise<{
  success: boolean
  sessionId?: string
  error?: string
  isNewSession?: boolean
}> {
  try {
    // 获取稳定的会话ID
    const sessionId = sessionManager.getSessionId()
    const isNewSession = sessionManager.isNewSession()
    
    // 记录访问
    const result = await recordVisit(sessionId)
    
    return {
      ...result,
      isNewSession
    }
  } catch (error) {
    console.error('Failed to record client visit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 检查是否需要记录访问
 */
export function shouldRecordVisit(): boolean {
  if (typeof window === 'undefined') return false
  
  // 检查是否已经记录过今天的访问
  const lastRecordKey = 'last-visit-record'
  const today = new Date().toDateString()
  
  try {
    const lastRecord = localStorage.getItem(lastRecordKey)
    if (lastRecord === today) {
      return false // 今天已经记录过
    }
    
    // 更新记录时间
    localStorage.setItem(lastRecordKey, today)
    return true
  } catch {
    return true // 如果localStorage不可用，默认记录
  }
}

/**
 * 强制记录访问（忽略重复检查）
 */
export async function forceRecordVisit(): Promise<{
  success: boolean
  sessionId?: string
  error?: string
}> {
  try {
    // 刷新会话ID
    const sessionId = sessionManager.refreshSession()
    
    // 记录访问
    const result = await recordVisit(sessionId)
    
    // 更新本地记录
    const lastRecordKey = 'last-visit-record'
    const today = new Date().toDateString()
    localStorage.setItem(lastRecordKey, today)
    
    return result
  } catch (error) {
    console.error('Failed to force record visit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
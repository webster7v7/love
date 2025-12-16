'use server'

import { repositories } from '@/lib/repositories'
import { headers } from 'next/headers'
import { createHash } from 'crypto'

export interface VisitStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

/**
 * 生成会话ID（基于用户代理和时间戳）
 */
function generateSessionId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return createHash('sha256')
    .update(`${timestamp}-${random}`)
    .digest('hex')
    .substring(0, 32)
}

/**
 * 生成IP哈希（隐私保护）
 */
function generateIpHash(ip: string): string {
  return createHash('sha256')
    .update(ip + process.env.IP_SALT || 'default-salt')
    .digest('hex')
    .substring(0, 32)
}

/**
 * 记录访问
 */
export async function recordVisit(): Promise<{
  success: boolean
  sessionId?: string
  error?: string
}> {
  try {
    // 确保 repositories 已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取请求头信息
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || undefined
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    
    // 获取IP地址（优先级：x-forwarded-for > x-real-ip > 默认）
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'
    
    // 生成会话ID和IP哈希
    const sessionId = generateSessionId()
    const ipHash = generateIpHash(ip)

    // 记录访问
    const visit = await repositories.visits.recordVisit(sessionId, userAgent, ipHash)

    return {
      success: true,
      sessionId: visit?.sessionId || sessionId,
    }
  } catch (error) {
    console.error('Failed to record visit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取访问统计
 */
export async function getVisitStats(): Promise<{
  success: boolean
  stats?: VisitStats
  error?: string
}> {
  try {
    // 确保 repositories 已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    const stats = await repositories.visits.getStats()

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('Failed to get visit stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取访问统计（带缓存）
 */
export async function getVisitStatsWithCache(): Promise<VisitStats> {
  try {
    const result = await getVisitStats()
    
    if (result.success && result.stats) {
      return result.stats
    }
    
    // 如果数据库查询失败，返回默认值
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      total: 0,
    }
  } catch (error) {
    console.error('Failed to get cached visit stats:', error)
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      total: 0,
    }
  }
}
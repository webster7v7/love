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
 * 生成会话ID（基于浏览器指纹和日期）
 */
function generateSessionId(): string {
  // 在服务端环境中，我们需要基于请求信息生成稳定的会话ID
  if (typeof window === 'undefined') {
    // 服务端：基于日期生成，同一天内相同
    const today = new Date().toDateString()
    return createHash('sha256')
      .update(`server-session-${today}`)
      .digest('hex')
      .substring(0, 32)
  }
  
  // 客户端：基于浏览器指纹生成稳定的会话ID
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().toDateString() // 每天更新一次会话
  ].join('|')
  
  return createHash('sha256')
    .update(fingerprint)
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
export async function recordVisit(clientSessionId?: string): Promise<{
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
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    
    // 获取IP地址（优先级：x-forwarded-for > x-real-ip > 默认）
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'
    
    // 使用客户端提供的会话ID，或生成新的
    const sessionId = clientSessionId || generateSessionId()
    const ipHash = generateIpHash(ip)

    // 记录访问（如果会话ID已存在则不重复记录）
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
  // 使用动态导入避免服务端导入问题
  const { dataCache } = await import('@/lib/cache')
  
  return dataCache.getOrSet(
    'visit-stats',
    async () => {
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
    },
    10000 // 10秒缓存，实时更新需要更短的缓存时间
  )
}

/**
 * 获取实时访问统计（无缓存）
 */
export async function getRealTimeVisitStats(): Promise<VisitStats> {
  try {
    const result = await getVisitStats()
    
    if (result.success && result.stats) {
      return result.stats
    }
    
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      total: 0,
    }
  } catch (error) {
    console.error('Failed to get real-time visit stats:', error)
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      total: 0,
    }
  }
}

/**
 * 强制刷新访问统计缓存
 */
export async function refreshVisitStatsCache(): Promise<void> {
  try {
    const { dataCache } = await import('@/lib/cache')
    await dataCache.delete('visit-stats')
  } catch (error) {
    console.error('Failed to refresh visit stats cache:', error)
  }
}
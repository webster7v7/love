import { db } from '../db/connection'
import { visits, type NewVisit, type Visit } from '../db/schema'
import { sql, desc, gte, and } from 'drizzle-orm'
import { BaseRepository } from './base'

export interface VisitStats {
  daily: number
  weekly: number
  monthly: number
  total: number
}

export class VisitsRepository extends BaseRepository {
  /**
   * 记录访问（防止重复）
   */
  async recordVisit(sessionId: string, userAgent?: string, ipHash?: string): Promise<Visit | null> {
    try {
      // 检查是否已经记录过这个会话
      const existing = await db
        .select()
        .from(visits)
        .where(sql`${visits.sessionId} = ${sessionId}`)
        .limit(1)

      if (existing.length > 0) {
        // 已存在，不重复记录
        return existing[0]
      }

      // 记录新访问
      const newVisit: NewVisit = {
        sessionId,
        userAgent: userAgent || null,
        ipHash: ipHash || null,
      }

      const result = await db.insert(visits).values(newVisit).returning()
      return result[0] || null
    } catch (error) {
      console.error('Failed to record visit:', error)
      return null
    }
  }

  /**
   * 获取访问统计
   */
  async getStats(): Promise<VisitStats> {
    try {
      const now = new Date()
      
      // 今日开始时间
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // 本周开始时间（周一）
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - diff)
      weekStart.setHours(0, 0, 0, 0)
      
      // 本月开始时间
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // 并行查询所有统计数据
      const [dailyResult, weeklyResult, monthlyResult, totalResult] = await Promise.all([
        // 今日访问
        db
          .select({ count: sql<number>`count(*)` })
          .from(visits)
          .where(gte(visits.createdAt, todayStart)),
        
        // 本周访问
        db
          .select({ count: sql<number>`count(*)` })
          .from(visits)
          .where(gte(visits.createdAt, weekStart)),
        
        // 本月访问
        db
          .select({ count: sql<number>`count(*)` })
          .from(visits)
          .where(gte(visits.createdAt, monthStart)),
        
        // 总访问
        db
          .select({ count: sql<number>`count(*)` })
          .from(visits)
      ])

      return {
        daily: Number(dailyResult[0]?.count || 0),
        weekly: Number(weeklyResult[0]?.count || 0),
        monthly: Number(monthlyResult[0]?.count || 0),
        total: Number(totalResult[0]?.count || 0),
      }
    } catch (error) {
      console.error('Failed to get visit stats:', error)
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0,
      }
    }
  }

  /**
   * 获取最近访问记录
   */
  async getRecentVisits(limit: number = 10): Promise<Visit[]> {
    try {
      return await db
        .select()
        .from(visits)
        .orderBy(desc(visits.createdAt))
        .limit(limit)
    } catch (error) {
      console.error('Failed to get recent visits:', error)
      return []
    }
  }

  /**
   * 清理旧访问记录（可选，用于数据维护）
   */
  async cleanupOldVisits(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await db
        .delete(visits)
        .where(sql`${visits.createdAt} < ${cutoffDate}`)

      return result.rowCount || 0
    } catch (error) {
      console.error('Failed to cleanup old visits:', error)
      return 0
    }
  }
}
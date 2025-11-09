// 访问统计工具模块

interface VisitRecord {
  timestamp: number  // 访问时间戳（毫秒）
}

export interface VisitStats {
  daily: number      // 今日访问次数
  weekly: number     // 本周访问次数
  monthly: number    // 本月访问次数
  total: number      // 总访问次数
}

const STORAGE_KEY = 'love-visit-counter'
const SESSION_KEY = 'love-visit-session'

/**
 * 获取今日开始时间戳（本地时间 00:00:00）
 */
function getTodayStart(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return today.getTime()
}

/**
 * 获取本周开始时间戳（本周一 00:00:00）
 */
function getWeekStart(): number {
  const now = new Date()
  const day = now.getDay() // 0 = 周日, 1 = 周一, ..., 6 = 周六
  const diff = day === 0 ? 6 : day - 1 // 如果是周日，向前推6天；否则向前推 day-1 天
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

/**
 * 获取本月开始时间戳（本月1日 00:00:00）
 */
function getMonthStart(): number {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return firstDay.getTime()
}

/**
 * 判断是否应该记录访问（防止同一会话重复计数）
 */
function shouldRecordVisit(): boolean {
  try {
    const sessionId = sessionStorage.getItem(SESSION_KEY)
    if (sessionId) {
      // 如果会话已存在，不重复记录
      return false
    }
    // 标记当前会话
    sessionStorage.setItem(SESSION_KEY, Date.now().toString())
    return true
  } catch (error) {
    // 如果 sessionStorage 不可用，仍然尝试记录
    console.error('Failed to check session:', error)
    return true
  }
}

/**
 * 记录一次访问
 */
export function recordVisit(): void {
  try {
    // 检查是否应该记录
    if (!shouldRecordVisit()) {
      return
    }

    // 获取现有记录
    const stored = localStorage.getItem(STORAGE_KEY)
    let visits: VisitRecord[] = []
    
    if (stored) {
      try {
        visits = JSON.parse(stored)
        // 验证数据格式
        if (!Array.isArray(visits)) {
          visits = []
        }
      } catch (error) {
        console.error('Failed to parse visit records:', error)
        visits = []
      }
    }

    // 添加新访问记录
    const newVisit: VisitRecord = {
      timestamp: Date.now()
    }
    visits.push(newVisit)

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  } catch (error) {
    console.error('Failed to record visit:', error)
  }
}

/**
 * 获取统计数据
 */
export function getVisitStats(): VisitStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      }
    }

    let visits: VisitRecord[] = []
    try {
      visits = JSON.parse(stored)
      if (!Array.isArray(visits)) {
        visits = []
      }
    } catch (error) {
      console.error('Failed to parse visit records:', error)
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      }
    }

    const now = Date.now()
    const todayStart = getTodayStart()
    const weekStart = getWeekStart()
    const monthStart = getMonthStart()

    let daily = 0
    let weekly = 0
    let monthly = 0

    visits.forEach((visit) => {
      if (visit.timestamp >= todayStart) {
        daily++
      }
      if (visit.timestamp >= weekStart) {
        weekly++
      }
      if (visit.timestamp >= monthStart) {
        monthly++
      }
    })

    return {
      daily,
      weekly,
      monthly,
      total: visits.length
    }
  } catch (error) {
    console.error('Failed to get visit stats:', error)
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
      total: 0
    }
  }
}


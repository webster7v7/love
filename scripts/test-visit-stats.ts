#!/usr/bin/env tsx

/**
 * 访问统计系统测试脚本
 * 验证会话管理、防重复记录、数据准确性
 */

import { sessionManager } from '../lib/utils/session-manager'
import { recordClientVisit, shouldRecordVisit } from '../app/actions/client-visits'
import { getVisitStats } from '../app/actions/visits'

async function testVisitStatsSystem() {
  console.log('🧪 开始测试访问统计系统...\n')

  // 测试1: 会话管理器
  console.log('📋 测试1: 会话管理器')
  try {
    // 模拟浏览器环境
    global.window = {} as any
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    } as any
    global.navigator = {
      userAgent: 'Test Browser',
      language: 'zh-CN',
      platform: 'Test Platform'
    } as any
    global.screen = {
      width: 1920,
      height: 1080
    } as any

    const sessionId1 = sessionManager.getSessionId()
    const sessionId2 = sessionManager.getSessionId()
    
    console.log(`  ✅ 会话ID生成: ${sessionId1}`)
    console.log(`  ✅ 会话ID稳定性: ${sessionId1 === sessionId2 ? '通过' : '失败'}`)
    
    // 测试会话刷新
    const newSessionId = sessionManager.refreshSession()
    console.log(`  ✅ 会话刷新: ${newSessionId !== sessionId1 ? '通过' : '失败'}`)
  } catch (error) {
    console.log(`  ❌ 会话管理器测试失败: ${error}`)
  }

  // 测试2: 重复记录检查
  console.log('\n📋 测试2: 重复记录检查')
  try {
    // 模拟localStorage
    let storage: Record<string, string> = {}
    global.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value },
      removeItem: (key: string) => { delete storage[key] }
    } as any

    const shouldRecord1 = shouldRecordVisit()
    const shouldRecord2 = shouldRecordVisit()
    
    console.log(`  ✅ 首次访问记录: ${shouldRecord1 ? '通过' : '失败'}`)
    console.log(`  ✅ 重复访问阻止: ${!shouldRecord2 ? '通过' : '失败'}`)
  } catch (error) {
    console.log(`  ❌ 重复记录检查失败: ${error}`)
  }

  // 测试3: 数据库连接和统计
  console.log('\n📋 测试3: 数据库连接和统计')
  try {
    const result = await getVisitStats()
    
    if (result.success && result.stats) {
      console.log('  ✅ 数据库连接: 成功')
      console.log(`  ✅ 今日访问: ${result.stats.daily}`)
      console.log(`  ✅ 本周访问: ${result.stats.weekly}`)
      console.log(`  ✅ 本月访问: ${result.stats.monthly}`)
      console.log(`  ✅ 总访问: ${result.stats.total}`)
    } else {
      console.log(`  ❌ 数据库查询失败: ${result.error}`)
    }
  } catch (error) {
    console.log(`  ❌ 数据库测试失败: ${error}`)
  }

  console.log('\n🎉 访问统计系统测试完成!')
}

// 运行测试
if (require.main === module) {
  testVisitStatsSystem().catch(console.error)
}

export { testVisitStatsSystem }
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { getDb } from '../lib/db/connection'
import { messages, photos, customQuotes } from '../lib/db/schema'
import { initializeDatabase } from '../lib/db/connection'

async function testConstraints() {
  console.log('🧪 Testing database constraints...\n')
  
  try {
    // 确保数据库连接正常
    const connected = await initializeDatabase()
    if (!connected) {
      throw new Error('Database connection failed')
    }

    const db = getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }
    let passedTests = 0
    let totalTests = 0

    // 测试1: 有效的留言插入
    console.log('1. Testing valid message insertion...')
    totalTests++
    try {
      await db.insert(messages).values({
        content: '这是一条测试留言',
        color: '#FFB6C1'
      })
      console.log('   ✅ Valid message inserted successfully')
      passedTests++
    } catch (error) {
      console.log('   ❌ Valid message insertion failed:', error)
    }

    // 测试2: 空内容留言（应该失败）
    console.log('2. Testing empty content message (should fail)...')
    totalTests++
    try {
      await db.insert(messages).values({
        content: '',
        color: '#FFB6C1'
      })
      console.log('   ❌ Empty content message was inserted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Empty content message correctly rejected')
      passedTests++
    }

    // 测试3: 过长内容留言（应该失败）
    console.log('3. Testing overly long message (should fail)...')
    totalTests++
    try {
      const longContent = 'a'.repeat(201) // 201个字符，超过200的限制
      await db.insert(messages).values({
        content: longContent,
        color: '#FFB6C1'
      })
      console.log('   ❌ Long message was inserted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Long message correctly rejected')
      passedTests++
    }

    // 测试4: 无效颜色格式（应该失败）
    console.log('4. Testing invalid color format (should fail)...')
    totalTests++
    try {
      await db.insert(messages).values({
        content: '测试无效颜色',
        color: 'invalid-color'
      })
      console.log('   ❌ Invalid color was accepted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Invalid color correctly rejected')
      passedTests++
    }

    // 测试5: 有效照片插入
    console.log('5. Testing valid photo insertion...')
    totalTests++
    try {
      await db.insert(photos).values({
        url: 'https://example.com/test.jpg',
        caption: '测试照片',
        isCustom: true
      })
      console.log('   ✅ Valid photo inserted successfully')
      passedTests++
    } catch (error) {
      console.log('   ❌ Valid photo insertion failed:', error)
    }

    // 测试6: 空URL照片（应该失败）
    console.log('6. Testing empty URL photo (should fail)...')
    totalTests++
    try {
      await db.insert(photos).values({
        url: '',
        caption: '测试照片',
        isCustom: true
      })
      console.log('   ❌ Empty URL photo was inserted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Empty URL photo correctly rejected')
      passedTests++
    }

    // 测试7: 过长描述照片（应该失败）
    console.log('7. Testing overly long caption (should fail)...')
    totalTests++
    try {
      await db.insert(photos).values({
        url: 'https://example.com/test.jpg',
        caption: 'a'.repeat(51), // 51个字符，超过50的限制
        isCustom: true
      })
      console.log('   ❌ Long caption was accepted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Long caption correctly rejected')
      passedTests++
    }

    // 测试8: 有效情话插入
    console.log('8. Testing valid quote insertion...')
    totalTests++
    try {
      await db.insert(customQuotes).values({
        text: '这是一条测试情话'
      })
      console.log('   ✅ Valid quote inserted successfully')
      passedTests++
    } catch (error) {
      console.log('   ❌ Valid quote insertion failed:', error)
    }

    // 测试9: 空情话（应该失败）
    console.log('9. Testing empty quote (should fail)...')
    totalTests++
    try {
      await db.insert(customQuotes).values({
        text: ''
      })
      console.log('   ❌ Empty quote was inserted (constraint failed)')
    } catch (error) {
      console.log('   ✅ Empty quote correctly rejected')
      passedTests++
    }

    // 测试10: 过长情话（应该失败）
    console.log('10. Testing overly long quote (should fail)...')
    totalTests++
    try {
      await db.insert(customQuotes).values({
        text: 'a'.repeat(201) // 201个字符，超过200的限制
      })
      console.log('    ❌ Long quote was accepted (constraint failed)')
    } catch (error) {
      console.log('    ✅ Long quote correctly rejected')
      passedTests++
    }

    // 清理测试数据
    console.log('\n🧹 Cleaning up test data...')
    await db.delete(messages).where(sql`content LIKE '%测试%'`)
    await db.delete(photos).where(sql`caption LIKE '%测试%'`)
    await db.delete(customQuotes).where(sql`text LIKE '%测试%'`)

    // 总结
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)
    
    if (passedTests === totalTests) {
      console.log('✅ All database constraints are working correctly!')
      return true
    } else {
      console.log('❌ Some constraints are not working as expected')
      return false
    }

  } catch (error) {
    console.error('❌ Constraint testing failed:', error)
    return false
  }
}

// 导入必要的函数
import { sql } from 'drizzle-orm'

testConstraints().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Test error:', error)
  process.exit(1)
})
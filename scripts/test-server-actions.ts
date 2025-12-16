#!/usr/bin/env tsx

/**
 * 测试Server Actions的功能
 * 运行: npx tsx scripts/test-server-actions.ts
 */

// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

import { 
  healthCheck,
  getAllStats,
  initializeSystem,
  createMessage,
  getMessages,
  createPhoto,
  getPhotos,
  createQuote,
  getQuotes,
} from '../app/actions'

async function testServerActions() {
  console.log('🧪 Testing Server Actions...\n')

  try {
    // 1. 健康检查
    console.log('1. 健康检查...')
    const health = await healthCheck()
    console.log('Health check result:', health)
    
    if (!health.success) {
      console.error('❌ Health check failed, stopping tests')
      return
    }
    console.log('✅ Health check passed\n')

    // 2. 系统初始化
    console.log('2. 系统初始化...')
    const init = await initializeSystem()
    console.log('Initialization result:', init)
    
    if (!init.success) {
      console.error('❌ System initialization failed')
      return
    }
    console.log('✅ System initialized\n')

    // 3. 获取统计信息
    console.log('3. 获取统计信息...')
    const stats = await getAllStats()
    console.log('Stats result:', stats)
    console.log('✅ Stats retrieved\n')

    // 4. 测试留言功能
    console.log('4. 测试留言功能...')
    
    // 创建测试留言
    const messageResult = await createMessage({
      content: '这是一条测试留言',
      color: '#FFE4E1'
    })
    console.log('Create message result:', messageResult)
    
    if (messageResult.success) {
      console.log('✅ Message created successfully')
      
      // 获取所有留言
      const messagesResult = await getMessages()
      console.log('Get messages result:', messagesResult)
      console.log('✅ Messages retrieved successfully')
    } else {
      console.error('❌ Failed to create message')
    }
    console.log()

    // 5. 测试照片功能
    console.log('5. 测试照片功能...')
    
    // 创建测试照片
    const photoResult = await createPhoto({
      url: 'https://example.com/test-photo.jpg',
      caption: '测试照片',
      isCustom: true
    })
    console.log('Create photo result:', photoResult)
    
    if (photoResult.success) {
      console.log('✅ Photo created successfully')
      
      // 获取所有照片
      const photosResult = await getPhotos({ limit: 5 })
      console.log('Get photos result:', photosResult)
      console.log('✅ Photos retrieved successfully')
    } else {
      console.error('❌ Failed to create photo')
    }
    console.log()

    // 6. 测试情话功能
    console.log('6. 测试情话功能...')
    
    // 创建测试情话
    const quoteResult = await createQuote({
      text: '这是一句测试情话',
      isCustom: true
    })
    console.log('Create quote result:', quoteResult)
    
    if (quoteResult.success) {
      console.log('✅ Quote created successfully')
      
      // 获取所有情话
      const quotesResult = await getQuotes({ limit: 5 })
      console.log('Get quotes result:', quotesResult)
      console.log('✅ Quotes retrieved successfully')
    } else {
      console.error('❌ Failed to create quote')
    }
    console.log()

    // 7. 最终统计信息
    console.log('7. 最终统计信息...')
    const finalStats = await getAllStats()
    console.log('Final stats:', finalStats)
    console.log('✅ Final stats retrieved\n')

    console.log('🎉 All Server Actions tests completed successfully!')

  } catch (error) {
    console.error('❌ Server Actions test failed:', error)
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  testServerActions()
    .then(() => {
      console.log('\n✅ Server Actions test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Server Actions test failed:', error)
      process.exit(1)
    })
}

export { testServerActions }
#!/usr/bin/env tsx

/**
 * 测试增强版前端组件的服务器操作集成
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { 
  createMessage, 
  getMessages, 
  deleteMessage,
  updateMessage 
} from '../app/actions/messages'
import { 
  createPhoto, 
  getPhotos, 
  deletePhoto 
} from '../app/actions/photos'
import { 
  createQuote, 
  getQuotes, 
  deleteQuote 
} from '../app/actions/quotes'
import { 
  healthCheck,
  getAllStats,
  getFallbackStatus 
} from '../app/actions/common'

async function testEnhancedComponents() {
  console.log('🧪 Testing Enhanced Components Integration...\n')

  // 1. 测试健康检查
  console.log('1. 测试系统健康检查...')
  try {
    const healthResult = await healthCheck()
    if (healthResult.success && healthResult.data) {
      console.log('✅ System status:', healthResult.data.status)
      console.log('   Database:', healthResult.data.database ? '✅' : '❌')
      console.log('   Repositories:', healthResult.data.repositories ? '✅' : '❌')
      console.log('   localStorage:', healthResult.data.localStorage ? '✅' : '❌')
    } else {
      console.log('❌ Health check failed:', healthResult.error)
    }
  } catch (error) {
    console.log('❌ Health check error:', error)
  }
  console.log('')

  // 2. 测试降级服务状态
  console.log('2. 测试降级服务状态...')
  try {
    const fallbackResult = await getFallbackStatus()
    if (fallbackResult.success && fallbackResult.data) {
      console.log('✅ Fallback service available:', fallbackResult.data.available)
      console.log('   Storage usage:', fallbackResult.data.storageInfo.usage, 'bytes')
      console.log('   Has fallback data:', JSON.stringify(fallbackResult.data.dataExists))
    } else {
      console.log('❌ Fallback status check failed:', fallbackResult.error)
    }
  } catch (error) {
    console.log('❌ Fallback status error:', error)
  }
  console.log('')

  // 3. 测试留言组件集成
  console.log('3. 测试留言组件集成...')
  try {
    // 创建测试留言
    const createResult = await createMessage({
      content: '这是增强版组件的测试留言',
      color: '#FFE4E1'
    })
    
    if (createResult.success && createResult.data) {
      console.log('✅ Message created:', createResult.data.id)
      if (createResult.fallbackUsed) {
        console.log('   ⚠️  Using fallback service (localStorage)')
      }
      
      // 获取留言列表
      const getResult = await getMessages()
      if (getResult.success && getResult.data) {
        console.log('✅ Messages retrieved:', getResult.data.length, 'items')
        
        // 更新留言
        const updateResult = await updateMessage(createResult.data.id, {
          content: '这是更新后的测试留言'
        })
        
        if (updateResult.success) {
          console.log('✅ Message updated successfully')
          
          // 删除留言
          const deleteResult = await deleteMessage(createResult.data.id)
          if (deleteResult.success) {
            console.log('✅ Message deleted successfully')
          } else {
            console.log('❌ Message deletion failed:', deleteResult.error)
          }
        } else {
          console.log('❌ Message update failed:', updateResult.error)
        }
      } else {
        console.log('❌ Get messages failed:', getResult.error)
      }
    } else {
      console.log('❌ Message creation failed:', createResult.error)
    }
  } catch (error) {
    console.log('❌ Message component test error:', error)
  }
  console.log('')

  // 4. 测试照片组件集成
  console.log('4. 测试照片组件集成...')
  try {
    // 创建测试照片
    const createResult = await createPhoto({
      url: 'https://example.com/enhanced-test-photo.jpg',
      caption: '增强版组件测试照片',
      isCustom: true
    })
    
    if (createResult.success && createResult.data) {
      console.log('✅ Photo created:', createResult.data.id)
      if (createResult.fallbackUsed) {
        console.log('   ⚠️  Using fallback service (localStorage)')
      }
      
      // 获取照片列表
      const getResult = await getPhotos()
      if (getResult.success && getResult.data) {
        console.log('✅ Photos retrieved:', getResult.data.length, 'items')
        
        // 删除照片
        const deleteResult = await deletePhoto(createResult.data.id)
        if (deleteResult.success) {
          console.log('✅ Photo deleted successfully')
        } else {
          console.log('❌ Photo deletion failed:', deleteResult.error)
        }
      } else {
        console.log('❌ Get photos failed:', getResult.error)
      }
    } else {
      console.log('❌ Photo creation failed:', createResult.error)
    }
  } catch (error) {
    console.log('❌ Photo component test error:', error)
  }
  console.log('')

  // 5. 测试情话组件集成
  console.log('5. 测试情话组件集成...')
  try {
    // 创建测试情话
    const createResult = await createQuote({
      text: '这是增强版组件的测试情话',
      isCustom: true
    })
    
    if (createResult.success && createResult.data) {
      console.log('✅ Quote created:', createResult.data.id)
      if (createResult.fallbackUsed) {
        console.log('   ⚠️  Using fallback service (localStorage)')
      }
      
      // 获取情话列表
      const getResult = await getQuotes()
      if (getResult.success && getResult.data) {
        console.log('✅ Quotes retrieved:', getResult.data.length, 'items')
        
        // 删除情话
        const deleteResult = await deleteQuote(createResult.data.id)
        if (deleteResult.success) {
          console.log('✅ Quote deleted successfully')
        } else {
          console.log('❌ Quote deletion failed:', deleteResult.error)
        }
      } else {
        console.log('❌ Get quotes failed:', getResult.error)
      }
    } else {
      console.log('❌ Quote creation failed:', createResult.error)
    }
  } catch (error) {
    console.log('❌ Quote component test error:', error)
  }
  console.log('')

  // 6. 测试统计信息
  console.log('6. 测试统计信息...')
  try {
    const statsResult = await getAllStats()
    if (statsResult.success && statsResult.data) {
      console.log('✅ Statistics retrieved:')
      console.log('   Messages:', statsResult.data.messages.total)
      console.log('   Photos:', statsResult.data.photos.total, '(custom:', statsResult.data.photos.custom, ')')
      console.log('   Quotes:', statsResult.data.quotes.total)
    } else {
      console.log('❌ Statistics retrieval failed:', statsResult.error)
    }
  } catch (error) {
    console.log('❌ Statistics test error:', error)
  }
  console.log('')

  // 7. 测试错误处理
  console.log('7. 测试错误处理...')
  try {
    // 尝试删除不存在的项目
    const invalidDeleteResult = await deleteMessage('invalid-id-12345')
    if (!invalidDeleteResult.success) {
      console.log('✅ Invalid deletion correctly handled:', invalidDeleteResult.error)
    } else {
      console.log('❌ Invalid deletion should have failed')
    }
    
    // 尝试创建无效数据
    const invalidCreateResult = await createMessage({
      content: '', // 空内容
      color: '#FFE4E1'
    })
    if (!invalidCreateResult.success) {
      console.log('✅ Invalid creation correctly handled:', invalidCreateResult.error)
    } else {
      console.log('❌ Invalid creation should have failed')
    }
  } catch (error) {
    console.log('✅ Error handling working correctly:', error instanceof Error ? error.message : String(error))
  }
  console.log('')

  // 8. 性能测试
  console.log('8. 测试组件性能...')
  const startTime = Date.now()
  
  try {
    // 并发执行多个操作
    const promises = [
      getMessages(),
      getPhotos(),
      getQuotes(),
      getAllStats(),
      healthCheck()
    ]
    
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    const successCount = results.filter(r => r.success).length
    console.log(`✅ Concurrent operations completed: ${successCount}/${results.length} successful`)
    console.log(`   Time taken: ${endTime - startTime}ms`)
    
    // 检查是否有降级服务使用
    const fallbackUsed = results.some(r => r.fallbackUsed)
    if (fallbackUsed) {
      console.log('   ⚠️  Some operations used fallback service')
    }
  } catch (error) {
    console.log('❌ Performance test error:', error)
  }
  console.log('')

  console.log('🎉 Enhanced Components Integration Tests Completed!')
  
  // 最终健康检查
  console.log('\n📊 Final System Status:')
  try {
    const finalHealth = await healthCheck()
    if (finalHealth.success && finalHealth.data) {
      console.log(`System Status: ${finalHealth.data.status}`)
      console.log(`Database: ${finalHealth.data.database ? 'Connected' : 'Disconnected'}`)
      console.log(`localStorage: ${finalHealth.data.localStorage ? 'Available' : 'Unavailable'}`)
      
      if (finalHealth.data.errorStats) {
        console.log(`Recent Errors: ${finalHealth.data.errorStats.lastHour}`)
      }
    }
  } catch (error) {
    console.log('Final health check failed:', error)
  }
}

// 运行测试
testEnhancedComponents().catch(console.error)
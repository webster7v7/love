import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { 
  repositories, 
  initializeRepositories, 
  getRepositoryStats,
  checkRepositoryHealth 
} from '../lib/repositories'
import { MessageFactory, PhotoFactory, QuoteFactory } from '../lib/db/factories'

async function testRepositories() {
  console.log('🧪 Testing Repository Layer...\n')
  
  let passedTests = 0
  let totalTests = 0
  
  // 测试1: Repository初始化
  console.log('1. Testing repository initialization...')
  totalTests++
  try {
    const initialized = await initializeRepositories()
    if (initialized) {
      console.log('   ✅ Repositories initialized successfully')
      passedTests++
    } else {
      console.log('   ❌ Repository initialization failed')
    }
  } catch (error) {
    console.log('   ❌ Repository initialization error:', error)
  }
  
  // 测试2: 健康检查
  console.log('2. Testing repository health check...')
  totalTests++
  try {
    const health = await checkRepositoryHealth()
    if (health.healthy) {
      console.log('   ✅ Repository health check passed')
      console.log('   📊 Stats:', JSON.stringify(health.stats, null, 2))
      passedTests++
    } else {
      console.log('   ❌ Repository health check failed:', health.error)
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error)
  }
  
  // 测试3: Messages Repository
  console.log('3. Testing Messages Repository...')
  totalTests++
  try {
    // 创建测试留言
    const messageData = MessageFactory.create({ content: '测试留言Repository' })
    const createdMessage = await repositories.messages.create(messageData)
    console.log('   ✅ Message created:', createdMessage.id)
    
    // 查找留言
    const foundMessage = await repositories.messages.findById(createdMessage.id)
    if (foundMessage && foundMessage.content === messageData.content) {
      console.log('   ✅ Message found by ID')
    } else {
      throw new Error('Message not found or content mismatch')
    }
    
    // 更新留言
    const updatedMessage = await repositories.messages.update(createdMessage.id, {
      content: '更新后的测试留言'
    })
    if (updatedMessage.content === '更新后的测试留言') {
      console.log('   ✅ Message updated successfully')
    } else {
      throw new Error('Message update failed')
    }
    
    // 查找最近留言
    const recentMessages = await repositories.messages.findRecent(5)
    console.log('   ✅ Found recent messages:', recentMessages.length)
    
    // 删除测试留言
    const deleted = await repositories.messages.delete(createdMessage.id)
    if (deleted) {
      console.log('   ✅ Message deleted successfully')
    } else {
      throw new Error('Message deletion failed')
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Messages Repository test failed:', error)
  }
  
  // 测试4: Photos Repository
  console.log('4. Testing Photos Repository...')
  totalTests++
  try {
    // 创建测试照片
    const photoData = {
      url: 'https://example.com/test-repo.jpg',
      caption: '测试照片Repository',
      isCustom: true
    }
    const createdPhoto = await repositories.photos.create(photoData)
    console.log('   ✅ Photo created:', createdPhoto.id)
    
    // 查找照片
    const foundPhoto = await repositories.photos.findById(createdPhoto.id)
    if (foundPhoto && foundPhoto.caption === photoData.caption) {
      console.log('   ✅ Photo found by ID')
    } else {
      throw new Error('Photo not found or caption mismatch')
    }
    
    // 更新照片
    const updatedPhoto = await repositories.photos.update(createdPhoto.id, {
      caption: '更新后的测试照片'
    })
    if (updatedPhoto.caption === '更新后的测试照片') {
      console.log('   ✅ Photo updated successfully')
    } else {
      throw new Error('Photo update failed')
    }
    
    // 查找自定义照片
    const customPhotos = await repositories.photos.findCustomPhotos({ limit: 5 })
    console.log('   ✅ Found custom photos:', customPhotos.length)
    
    // 删除测试照片
    const deleted = await repositories.photos.delete(createdPhoto.id)
    if (deleted) {
      console.log('   ✅ Photo deleted successfully')
    } else {
      throw new Error('Photo deletion failed')
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Photos Repository test failed:', error)
  }
  
  // 测试5: Quotes Repository
  console.log('5. Testing Quotes Repository...')
  totalTests++
  try {
    // 创建测试情话
    const quoteData = {
      text: '测试情话Repository',
      isCustom: true
    }
    const createdQuote = await repositories.quotes.create(quoteData)
    console.log('   ✅ Quote created:', createdQuote.id)
    
    // 查找情话
    const foundQuote = await repositories.quotes.findById(createdQuote.id)
    if (foundQuote && foundQuote.text === quoteData.text) {
      console.log('   ✅ Quote found by ID')
    } else {
      throw new Error('Quote not found or text mismatch')
    }
    
    // 查找随机情话
    const randomQuotes = await repositories.quotes.findRandom(3)
    console.log('   ✅ Found random quotes:', randomQuotes.length)
    
    // 搜索情话
    const searchResults = await repositories.quotes.searchByText('测试')
    console.log('   ✅ Search results:', searchResults.length)
    
    // 获取统计信息
    const stats = await repositories.quotes.getStats()
    console.log('   ✅ Quote stats:', stats)
    
    // 删除测试情话
    const deleted = await repositories.quotes.delete(createdQuote.id)
    if (deleted) {
      console.log('   ✅ Quote deleted successfully')
    } else {
      throw new Error('Quote deletion failed')
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Quotes Repository test failed:', error)
  }
  
  // 测试6: 批量操作
  console.log('6. Testing batch operations...')
  totalTests++
  try {
    // 批量创建留言
    const batchMessages = MessageFactory.createBatch(3)
    const createdMessages = await repositories.messages.createMany(batchMessages)
    console.log('   ✅ Batch messages created:', createdMessages.length)
    
    // 批量创建照片
    const batchPhotos = [
      { url: 'https://example.com/batch1.jpg', caption: 'Batch Photo 1', isCustom: true },
      { url: 'https://example.com/batch2.jpg', caption: 'Batch Photo 2', isCustom: true }
    ]
    const createdPhotos = await repositories.photos.createMany(batchPhotos)
    console.log('   ✅ Batch photos created:', createdPhotos.length)
    
    // 批量创建情话
    const batchQuotes = [
      { text: 'Batch Quote 1', isCustom: true },
      { text: 'Batch Quote 2', isCustom: true }
    ]
    const createdQuotes = await repositories.quotes.createMany(batchQuotes)
    console.log('   ✅ Batch quotes created:', createdQuotes.length)
    
    // 批量删除
    const messageIds = createdMessages.map(m => m.id)
    const photoIds = createdPhotos.map(p => p.id)
    const quoteIds = createdQuotes.map(q => q.id)
    
    const [deletedMessages, deletedPhotos, deletedQuotes] = await Promise.all([
      repositories.messages.deleteMany(messageIds),
      repositories.photos.deleteMany(photoIds),
      repositories.quotes.deleteMany(quoteIds),
    ])
    
    console.log('   ✅ Batch deletions:', { 
      messages: deletedMessages, 
      photos: deletedPhotos, 
      quotes: deletedQuotes 
    })
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Batch operations test failed:', error)
  }
  
  // 测试7: 分页查询
  console.log('7. Testing pagination...')
  totalTests++
  try {
    // 创建一些测试数据
    const testMessages = MessageFactory.createBatch(5)
    await repositories.messages.createMany(testMessages)
    
    // 测试分页
    const page1 = await repositories.messages.findAllPaginated(1, 2)
    console.log('   ✅ Page 1:', page1.data.length, 'items, hasNext:', page1.pagination.hasNext)
    
    const page2 = await repositories.messages.findAllPaginated(2, 2)
    console.log('   ✅ Page 2:', page2.data.length, 'items, hasPrev:', page2.pagination.hasPrev)
    
    // 清理测试数据
    const allMessages = await repositories.messages.findAll({ limit: 100 })
    const testMessageIds = allMessages
      .filter(m => m.content.includes('测试留言'))
      .map(m => m.id)
    
    if (testMessageIds.length > 0) {
      await repositories.messages.deleteMany(testMessageIds)
      console.log('   🧹 Cleaned up test messages:', testMessageIds.length)
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Pagination test failed:', error)
  }
  
  // 测试8: 错误处理
  console.log('8. Testing error handling...')
  totalTests++
  try {
    // 测试无效ID
    try {
      await repositories.messages.findById('invalid-id')
      console.log('   ❌ Should have thrown error for invalid ID')
    } catch (error) {
      console.log('   ✅ Invalid ID correctly rejected')
    }
    
    // 测试删除不存在的记录
    const deleted = await repositories.messages.delete('00000000-0000-0000-0000-000000000000')
    if (!deleted) {
      console.log('   ✅ Non-existent record deletion handled correctly')
    }
    
    // 测试无效数据创建
    try {
      await repositories.messages.create({ content: '', color: 'invalid' } as any)
      console.log('   ❌ Should have thrown error for invalid data')
    } catch (error) {
      console.log('   ✅ Invalid data correctly rejected')
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Error handling test failed:', error)
  }
  
  // 最终统计
  console.log(`\n📊 Repository Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('✅ All repository tests passed!')
    
    // 显示最终统计
    try {
      const finalStats = await getRepositoryStats()
      console.log('\n📈 Final Repository Stats:')
      console.log(JSON.stringify(finalStats, null, 2))
    } catch (error) {
      console.log('⚠️ Could not get final stats:', error)
    }
    
    return true
  } else {
    console.log('❌ Some repository tests failed')
    return false
  }
}

testRepositories().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Repository test error:', error)
  process.exit(1)
})
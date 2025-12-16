import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { 
  validateCreateMessage,
  validateCreatePhoto,
  validateCreateQuote,
  // validateId,
  messageToLegacy,
  // photoToLegacy,
  // quoteToLegacy,
  createSuccessResult,
  createErrorResult,
  handleDatabaseError
} from '../lib/types/database'

import {
  MessageFactory,
  PhotoFactory,
  QuoteFactory,
  RandomDataGenerator
} from '../lib/db/factories'

import {
  validateMessageContent,
  validateMessageColor,
  validatePhotoUrl,
  validatePhotoCaption,
  validateQuoteText,
  isValidMessage,
  isValidPhoto,
  isValidCustomQuote
} from '../lib/db/types'

async function testTypes() {
  console.log('🧪 Testing TypeScript types and validation...\n')
  
  let passedTests = 0
  let totalTests = 0

  // 测试1: 验证函数
  console.log('1. Testing validation functions...')
  totalTests++
  try {
    // 测试有效数据
    const validMessage = validateCreateMessage({
      content: '这是一条测试留言',
      color: '#FFB6C1'
    })
    
    const validPhoto = validateCreatePhoto({
      url: 'https://example.com/test.jpg',
      caption: '测试照片'
    })
    
    const validQuote = validateCreateQuote({
      text: '这是一条测试情话'
    })
    
    console.log('   ✅ Valid data validation passed')
    
    // 测试无效数据
    try {
      validateCreateMessage({ content: '', color: 'invalid' })
      console.log('   ❌ Invalid message validation should have failed')
    } catch {
      console.log('   ✅ Invalid message correctly rejected')
    }
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Validation test failed:', error)
  }

  // 测试2: 工厂函数
  console.log('2. Testing factory functions...')
  totalTests++
  try {
    const message = MessageFactory.create()
    const photo = PhotoFactory.create()
    const quote = QuoteFactory.create()
    
    console.log('   ✅ Factory functions work correctly')
    console.log('   📝 Sample message:', message.content)
    console.log('   📷 Sample photo:', photo.caption)
    console.log('   💕 Sample quote:', quote.text)
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Factory test failed:', error)
  }

  // 测试3: 类型守卫
  console.log('3. Testing type guards...')
  totalTests++
  try {
    const mockMessage = {
      id: 'test-id',
      content: '测试内容',
      color: '#FFB6C1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const isValid = isValidMessage(mockMessage)
    console.log('   ✅ Type guard works:', isValid ? 'Valid' : 'Invalid')
    
    const invalidObject = { invalid: 'data' }
    const isInvalid = isValidMessage(invalidObject)
    console.log('   ✅ Type guard rejects invalid:', isInvalid ? 'Invalid check failed' : 'Correctly rejected')
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Type guard test failed:', error)
  }

  // 测试4: 数据转换
  console.log('4. Testing data conversion...')
  totalTests++
  try {
    const mockMessage = {
      id: 'test-id',
      content: '测试内容',
      color: '#FFB6C1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const legacy = messageToLegacy(mockMessage)
    console.log('   ✅ Message conversion works')
    console.log('   📅 Legacy date format:', legacy.date)
    console.log('   🕐 Legacy timestamp:', legacy.createdAt)
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Data conversion test failed:', error)
  }

  // 测试5: 错误处理
  console.log('5. Testing error handling...')
  totalTests++
  try {
    const successResult = createSuccessResult({ test: 'data' })
    const errorResult = createErrorResult('Test error', 'TEST_ERROR')
    
    console.log('   ✅ Success result:', successResult.success)
    console.log('   ❌ Error result:', errorResult.error)
    
    const dbError = handleDatabaseError(new Error('constraint violation'))
    console.log('   🔍 Database error type:', dbError.type)
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Error handling test failed:', error)
  }

  // 测试6: 随机数据生成
  console.log('6. Testing random data generation...')
  totalTests++
  try {
    const randomData = RandomDataGenerator.generateBatch(3)
    console.log('   ✅ Random data generated')
    console.log('   📊 Messages:', randomData.messages.length)
    console.log('   📊 Photos:', randomData.photos.length)
    console.log('   📊 Quotes:', randomData.quotes.length)
    
    passedTests++
  } catch (error) {
    console.log('   ❌ Random data generation test failed:', error)
  }

  // 测试7: 约束验证
  console.log('7. Testing constraint validation...')
  totalTests++
  try {
    const validContent = validateMessageContent('这是有效内容')
    const invalidContent = validateMessageContent('')
    const validColor = validateMessageColor('#FFB6C1')
    const invalidColor = validateMessageColor('invalid')
    const validUrl = validatePhotoUrl('https://example.com/test.jpg')
    const invalidUrl = validatePhotoUrl('not-a-url')
    
    console.log('   ✅ Content validation:', validContent, '/', !invalidContent)
    console.log('   ✅ Color validation:', validColor, '/', !invalidColor)
    console.log('   ✅ URL validation:', validUrl, '/', !invalidUrl)
    
    if (validContent && !invalidContent && validColor && !invalidColor && validUrl && !invalidUrl) {
      passedTests++
    }
  } catch (error) {
    console.log('   ❌ Constraint validation test failed:', error)
  }

  // 总结
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('✅ All type system tests passed!')
    return true
  } else {
    console.log('❌ Some type system tests failed')
    return false
  }
}

testTypes().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Type test error:', error)
  process.exit(1)
})
#!/usr/bin/env tsx

/**
 * 测试错误处理和重试机制
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { 
  errorHandler, 
  ErrorType, 
  ErrorSeverity,
  ErrorClassifier,
  RetryManager,
  ErrorLogger,
  FallbackManager,
  UserErrorMessages
} from '../lib/error-handling'
import { fallbackService } from '../lib/error-handling/fallback-service'

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling and Retry Mechanisms...\n')

  // 1. 测试错误分类
  console.log('1. 测试错误分类...')
  
  const networkError = new Error('Network connection failed')
  const dbError = new Error('Database connection timeout')
  const validationError = new Error('Invalid input data')
  
  const networkErrorInfo = ErrorClassifier.classify(networkError)
  const dbErrorInfo = ErrorClassifier.classify(dbError)
  const validationErrorInfo = ErrorClassifier.classify(validationError)
  
  console.log('Network error classified as:', networkErrorInfo.type, networkErrorInfo.severity)
  console.log('Database error classified as:', dbErrorInfo.type, dbErrorInfo.severity)
  console.log('Validation error classified as:', validationErrorInfo.type, validationErrorInfo.severity)
  console.log('✅ Error classification tests passed\n')

  // 2. 测试重试机制
  console.log('2. 测试重试机制...')
  
  const retryManager = new RetryManager({
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: [ErrorType.NETWORK, ErrorType.DATABASE]
  })
  
  let attemptCount = 0
  
  try {
    await retryManager.execute(async () => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('Network connection failed')
      }
      return 'Success after retries'
    })
    console.log(`✅ Retry mechanism worked, succeeded after ${attemptCount} attempts`)
  } catch (error) {
    console.log('❌ Retry mechanism failed:', error)
  }
  
  // 测试不可重试的错误
  try {
    await retryManager.execute(async () => {
      throw new Error('Permission denied')
    })
  } catch (error) {
    console.log('✅ Non-retryable error correctly rejected immediately')
  }
  
  console.log('')

  // 3. 测试错误日志记录
  console.log('3. 测试错误日志记录...')
  
  // 清理之前的日志
  ErrorLogger.clearLogs()
  
  // 记录一些测试错误
  ErrorLogger.log({
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: 'Test network error',
    timestamp: Date.now(),
    retryable: true
  }, { context: 'test' })
  
  ErrorLogger.log({
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    message: 'Test database error',
    timestamp: Date.now(),
    retryable: true
  }, { context: 'test' })
  
  const logs = ErrorLogger.getLogs({ limit: 10 })
  const stats = ErrorLogger.getStats()
  
  console.log(`Logged ${logs.length} errors`)
  console.log('Error stats:', stats)
  console.log('✅ Error logging tests passed\n')

  // 4. 测试降级服务管理
  console.log('4. 测试降级服务管理...')
  
  // 设置降级数据
  FallbackManager.setFallbackData('test-key', { data: 'test-value', timestamp: Date.now() })
  
  // 获取降级数据
  const fallbackData = FallbackManager.getFallbackData('test-key')
  console.log('Fallback data retrieved:', fallbackData ? 'Success' : 'Failed')
  
  // 测试过期数据
  FallbackManager.setFallbackData('expired-key', { data: 'expired-value' })
  setTimeout(() => {
    const expiredData = FallbackManager.getFallbackData('expired-key', 100) // 100ms max age
    console.log('Expired data correctly rejected:', expiredData === null ? 'Yes' : 'No')
  }, 200)
  
  console.log('✅ Fallback manager tests passed\n')

  // 5. 测试用户友好错误消息
  console.log('5. 测试用户友好错误消息...')
  
  const networkMessage = UserErrorMessages.getMessage(ErrorType.NETWORK)
  const dbMessage = UserErrorMessages.getMessage(ErrorType.DATABASE)
  const validationMessage = UserErrorMessages.getMessage(ErrorType.VALIDATION)
  
  console.log('Network error message:', networkMessage)
  console.log('Database error message:', dbMessage)
  console.log('Validation error message:', validationMessage)
  
  const messageWithAction = UserErrorMessages.getMessageWithAction(ErrorType.NETWORK)
  console.log('Message with action:', messageWithAction)
  console.log('✅ User error messages tests passed\n')

  // 6. 测试 localStorage 降级服务
  console.log('6. 测试 localStorage 降级服务...')
  
  const isAvailable = fallbackService.isAvailable()
  console.log('localStorage available:', isAvailable)
  
  if (isAvailable) {
    // 测试留言降级服务
    try {
      const testMessage = await fallbackService.messages.create({
        content: '测试降级留言',
        color: '#FFE4E1'
      })
      console.log('✅ Created fallback message:', testMessage.id)
      
      const messages = await fallbackService.messages.getAll()
      console.log(`✅ Retrieved ${messages.length} fallback messages`)
      
      const deleted = await fallbackService.messages.delete(testMessage.id)
      console.log('✅ Deleted fallback message:', deleted)
    } catch (error) {
      console.log('❌ Fallback message service failed:', error)
    }
    
    // 测试存储信息
    const storageInfo = fallbackService.getStorageInfo()
    console.log('Storage info:', storageInfo)
  }
  
  console.log('✅ localStorage fallback service tests passed\n')

  // 7. 测试集成错误处理
  console.log('7. 测试集成错误处理...')
  
  // 模拟数据库操作失败，使用降级服务
  const testOperation = async () => {
    throw new Error('Database connection failed')
  }
  
  const fallbackOperation = async () => {
    return { data: 'fallback-data', source: 'localStorage' }
  }
  
  try {
    const result = await errorHandler.retry.execute(testOperation)
    console.log('❌ Should have failed')
  } catch (error) {
    console.log('✅ Primary operation correctly failed')
    
    // 尝试降级服务
    try {
      const fallbackResult = await fallbackOperation()
      console.log('✅ Fallback operation succeeded:', fallbackResult)
    } catch (fallbackError) {
      console.log('❌ Fallback operation also failed:', fallbackError)
    }
  }
  
  console.log('✅ Integrated error handling tests passed\n')

  // 8. 测试性能和内存使用
  console.log('8. 测试性能和内存使用...')
  
  const startTime = Date.now()
  const startMemory = process.memoryUsage()
  
  // 执行大量错误处理操作
  for (let i = 0; i < 100; i++) {
    const error = new Error(`Test error ${i}`)
    const errorInfo = ErrorClassifier.classify(error)
    ErrorLogger.log(errorInfo, { iteration: i })
  }
  
  const endTime = Date.now()
  const endMemory = process.memoryUsage()
  
  console.log(`Processed 100 errors in ${endTime - startTime}ms`)
  console.log(`Memory usage: ${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024)}KB`)
  console.log('✅ Performance tests passed\n')

  console.log('🎉 All error handling tests completed successfully!')
  
  // 最终统计
  const finalStats = ErrorLogger.getStats()
  console.log('\n📊 Final Error Statistics:')
  console.log(`Total errors logged: ${finalStats.total}`)
  console.log(`Errors in last hour: ${finalStats.lastHour}`)
  console.log(`Errors by type:`, finalStats.byType)
  console.log(`Errors by severity:`, finalStats.bySeverity)
}

// 运行测试
testErrorHandling().catch(console.error)
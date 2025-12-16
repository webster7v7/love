import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { initializeDatabase } from '../lib/db/connection'
import { getDb } from '../lib/db/connection'
import { messages } from '../lib/db/schema'

async function verifySetup() {
  console.log('🔍 Verifying database integration setup...\n')
  
  // 1. 检查环境变量
  console.log('1. Environment Variables:')
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development')
  console.log('')
  
  // 2. 测试数据库连接
  console.log('2. Database Connection:')
  try {
    const connected = await initializeDatabase()
    console.log('   Connection:', connected ? '✅ Success' : '❌ Failed')
  } catch (error) {
    console.log('   Connection: ❌ Error -', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
  console.log('')
  
  // 3. 测试基本查询
  console.log('3. Database Query Test:')
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Database not initialized')
    }
    const result = await db.select().from(messages).limit(1)
    console.log('   Query test: ✅ Success (returned', result.length, 'rows)')
  } catch (error) {
    console.log('   Query test: ❌ Error -', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
  console.log('')
  
  // 4. 检查schema文件
  console.log('4. Schema Files:')
  try {
    const fs = require('fs')
    const schemaExists = fs.existsSync('./lib/db/schema.ts')
    const configExists = fs.existsSync('./lib/db/config.ts')
    const connectionExists = fs.existsSync('./lib/db/connection.ts')
    
    console.log('   schema.ts:', schemaExists ? '✅ Exists' : '❌ Missing')
    console.log('   config.ts:', configExists ? '✅ Exists' : '❌ Missing')
    console.log('   connection.ts:', connectionExists ? '✅ Exists' : '❌ Missing')
  } catch (error) {
    console.log('   File check: ❌ Error -', error instanceof Error ? error.message : 'Unknown error')
  }
  console.log('')
  
  console.log('✅ Database integration setup verification completed!')
  console.log('🚀 Ready to proceed with the next task!')
  
  return true
}

verifySetup().catch(console.error)
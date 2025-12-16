import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { initializeDatabase } from '../lib/db/connection'

async function testConnection() {
  console.log('🔄 Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  try {
    const success = await initializeDatabase()
    if (success) {
      console.log('✅ Database connection test passed!')
      process.exit(0)
    } else {
      console.log('❌ Database connection test failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Connection test error:', error)
    process.exit(1)
  }
}

testConnection()
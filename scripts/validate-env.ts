#!/usr/bin/env tsx

import { config } from 'dotenv'
import { z } from 'zod'

// 加载环境变量
config({ path: '.env.local' })

// 环境变量验证schema
const EnvSchema = z.object({
  // 数据库配置
  DATABASE_URL: z.string()
    .url('DATABASE_URL must be a valid URL')
    .refine(url => url.includes('neon'), 'DATABASE_URL should be a Neon database URL'),
  
  // Node.js环境
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),
  
  // Next.js配置
  NEXT_PUBLIC_APP_URL: z.string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional(),
  
  // 可选的调试配置
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
})

// 生产环境额外验证
const ProductionEnvSchema = EnvSchema.extend({
  NEXT_PUBLIC_APP_URL: z.string()
    .url('NEXT_PUBLIC_APP_URL is required in production'),
})

async function validateEnvironment() {
  console.log('🔍 Validating environment variables...')
  
  try {
    // 基础验证
    const env = EnvSchema.parse(process.env)
    console.log('✅ Basic environment validation passed')
    
    // 生产环境额外验证
    if (env.NODE_ENV === 'production') {
      ProductionEnvSchema.parse(process.env)
      console.log('✅ Production environment validation passed')
    }
    
    // 数据库连接测试
    console.log('🔄 Testing database connection...')
    
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(env.DATABASE_URL)
      await sql`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      process.exit(1)
    }
    
    // 显示配置摘要
    console.log('\n📋 Environment Configuration:')
    console.log(`   NODE_ENV: ${env.NODE_ENV}`)
    console.log(`   DATABASE_URL: ${env.DATABASE_URL.replace(/\/\/.*@/, '//***@')}`)
    if (env.NEXT_PUBLIC_APP_URL) {
      console.log(`   APP_URL: ${env.NEXT_PUBLIC_APP_URL}`)
    }
    if (env.LOG_LEVEL) {
      console.log(`   LOG_LEVEL: ${env.LOG_LEVEL}`)
    }
    
    console.log('\n✅ Environment validation completed successfully!')
    
  } catch (error) {
    console.error('❌ Environment validation failed:')
    
    if (error instanceof z.ZodError) {
      error.issues.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('   ', error)
    }
    
    console.log('\n💡 Required environment variables:')
    console.log('   DATABASE_URL - Neon PostgreSQL connection string')
    console.log('   NODE_ENV - Environment (development/production/test)')
    console.log('\n💡 Optional environment variables:')
    console.log('   NEXT_PUBLIC_APP_URL - Public app URL (required in production)')
    console.log('   DEBUG - Debug mode flag')
    console.log('   LOG_LEVEL - Logging level (error/warn/info/debug)')
    
    process.exit(1)
  }
}

// 运行验证
if (require.main === module) {
  validateEnvironment()
}

export { validateEnvironment }
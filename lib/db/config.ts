import { z } from 'zod'

// 数据库配置验证schema
const DatabaseConfigSchema = z.object({
  connectionString: z.string().url('Invalid database URL'),
  ssl: z.boolean().default(true),
  maxConnections: z.number().min(1).max(100).default(10),
  idleTimeout: z.number().min(1000).default(30000), // 30 seconds
})

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>

// 环境变量验证
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// 验证环境变量
function validateEnv() {
  try {
    return EnvSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment configuration')
  }
}

// 创建数据库配置
export function createDatabaseConfig(): DatabaseConfig {
  const env = validateEnv()
  
  const config: DatabaseConfig = {
    connectionString: env.DATABASE_URL,
    ssl: true,
    maxConnections: env.NODE_ENV === 'production' ? 20 : 10,
    idleTimeout: 30000,
  }

  // 验证配置
  return DatabaseConfigSchema.parse(config)
}

// 延迟创建配置实例
let _dbConfig: DatabaseConfig | null = null

export function getDbConfig(): DatabaseConfig {
  if (!_dbConfig) {
    _dbConfig = createDatabaseConfig()
  }
  return _dbConfig
}
#!/usr/bin/env tsx

import { config } from 'dotenv'
import { validateEnvironment } from './validate-env'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 加载环境变量
config({ path: '.env.local' })

interface DeploymentChecklist {
  environmentValidation: boolean
  databaseMigrations: boolean
  buildTest: boolean
  typeCheck: boolean
  linting: boolean
  testSuite: boolean
}

async function runCommand(command: string, description: string): Promise<boolean> {
  console.log(`🔄 ${description}...`)
  
  try {
    const { stdout, stderr } = await execAsync(command)
    console.log(`✅ ${description} completed`)
    return true
  } catch (error: any) {
    console.error(`❌ ${description} failed:`)
    console.error(error.stderr || error.stdout || error.message)
    return false
  }
}

async function checkDatabaseMigrations(): Promise<boolean> {
  console.log('🔄 Checking database migrations...')
  
  try {
    // 检查是否有待应用的迁移
    const { drizzle } = await import('drizzle-orm/neon-http')
    const { neon } = await import('@neondatabase/serverless')
    const { migrate } = await import('drizzle-orm/neon-http/migrator')
    
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)
    
    // 尝试运行迁移
    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    
    console.log('✅ Database migrations up to date')
    return true
  } catch (error) {
    console.error('❌ Database migration check failed:', error)
    return false
  }
}

async function runDeploymentChecks(): Promise<DeploymentChecklist> {
  console.log('🚀 Running deployment preparation checks...\n')
  
  const checklist: DeploymentChecklist = {
    environmentValidation: false,
    databaseMigrations: false,
    buildTest: false,
    typeCheck: false,
    linting: false,
    testSuite: false,
  }
  
  // 1. 环境变量验证
  try {
    await validateEnvironment()
    checklist.environmentValidation = true
  } catch (error) {
    console.error('❌ Environment validation failed')
  }
  
  // 2. 数据库迁移检查
  checklist.databaseMigrations = await checkDatabaseMigrations()
  
  // 3. TypeScript类型检查
  checklist.typeCheck = await runCommand('npx tsc --noEmit', 'TypeScript type checking')
  
  // 4. 代码检查
  checklist.linting = await runCommand('npm run lint', 'Code linting')
  
  // 5. 构建测试
  checklist.buildTest = await runCommand('npm run build', 'Production build test')
  
  // 6. 测试套件
  console.log('🔄 Running test suite...')
  const testResults = await Promise.all([
    runCommand('npx tsx scripts/test-db-connection.ts', 'Database connection test'),
    runCommand('npx tsx scripts/test-repositories.ts', 'Repository tests'),
    runCommand('npx tsx scripts/test-server-actions.ts', 'Server Actions tests'),
    runCommand('npx tsx scripts/test-migration.ts', 'Migration tests'),
    runCommand('npx tsx scripts/test-performance.ts', 'Performance tests'),
    runCommand('npx tsx scripts/test-error-handling.ts', 'Error handling tests'),
    runCommand('npx tsx scripts/test-types.ts', 'Type system tests'),
  ])
  
  checklist.testSuite = testResults.every(result => result)
  
  return checklist
}

function printDeploymentReport(checklist: DeploymentChecklist) {
  console.log('\n📋 Deployment Readiness Report:')
  console.log('================================')
  
  const checks = [
    { name: 'Environment Validation', status: checklist.environmentValidation },
    { name: 'Database Migrations', status: checklist.databaseMigrations },
    { name: 'TypeScript Type Check', status: checklist.typeCheck },
    { name: 'Code Linting', status: checklist.linting },
    { name: 'Production Build', status: checklist.buildTest },
    { name: 'Test Suite', status: checklist.testSuite },
  ]
  
  let passedChecks = 0
  
  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌'
    console.log(`${icon} ${check.name}`)
    if (check.status) passedChecks++
  })
  
  console.log(`\n📊 Overall Status: ${passedChecks}/${checks.length} checks passed`)
  
  if (passedChecks === checks.length) {
    console.log('🎉 All checks passed! Ready for deployment.')
    return true
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues before deploying.')
    
    console.log('\n💡 Deployment Checklist:')
    if (!checklist.environmentValidation) {
      console.log('   - Fix environment variable configuration')
    }
    if (!checklist.databaseMigrations) {
      console.log('   - Ensure database migrations are up to date')
    }
    if (!checklist.typeCheck) {
      console.log('   - Fix TypeScript type errors')
    }
    if (!checklist.linting) {
      console.log('   - Fix linting errors')
    }
    if (!checklist.buildTest) {
      console.log('   - Fix build errors')
    }
    if (!checklist.testSuite) {
      console.log('   - Fix failing tests')
    }
    
    return false
  }
}

async function generateDeploymentConfig() {
  console.log('\n🔧 Generating deployment configuration...')
  
  const env = process.env.NODE_ENV || 'development'
  
  // 生成环境变量模板
  const envTemplate = `# Environment Variables for ${env.toUpperCase()}
# Copy this to your deployment platform (Vercel, Netlify, etc.)

# Database Configuration
DATABASE_URL=your_neon_database_url_here

# Application Configuration
NODE_ENV=${env}
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional Configuration
# DEBUG=true
# LOG_LEVEL=info
`
  
  // 写入部署配置文件
  const fs = await import('fs/promises')
  await fs.writeFile('.env.deployment.template', envTemplate)
  
  console.log('✅ Deployment configuration template created: .env.deployment.template')
  
  // 生成部署说明
  const deploymentGuide = `# Deployment Guide

## Pre-deployment Checklist

1. **Environment Variables**
   - Copy variables from \`.env.deployment.template\`
   - Set \`DATABASE_URL\` to your Neon database connection string
   - Set \`NEXT_PUBLIC_APP_URL\` to your production domain
   - Set \`NODE_ENV=production\`

2. **Database Setup**
   - Ensure your Neon database is created and accessible
   - Run migrations: \`npm run db:migrate\`
   - Optionally seed data: \`npm run db:seed\`

3. **Build Configuration**
   - Ensure all dependencies are in \`package.json\`
   - Test build locally: \`npm run build\`
   - Verify all environment variables are set

## Deployment Platforms

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository
2. Set build command: \`npm run build\`
3. Set publish directory: \`.next\`
4. Set environment variables in Netlify dashboard

### Other Platforms
- Ensure Node.js 18+ is available
- Set build command: \`npm run build\`
- Set start command: \`npm start\`
- Configure environment variables

## Post-deployment

1. Test all functionality
2. Monitor error logs
3. Verify database connectivity
4. Test data migration (if applicable)

## Rollback Plan

If deployment fails:
1. Revert to previous version
2. Check error logs
3. Fix issues locally
4. Re-run deployment checks
5. Deploy again
`
  
  await fs.writeFile('DEPLOYMENT.md', deploymentGuide)
  console.log('✅ Deployment guide created: DEPLOYMENT.md')
}

async function main() {
  console.log('🚀 Love Website - Deployment Preparation')
  console.log('=====================================\n')
  
  // 运行部署检查
  const checklist = await runDeploymentChecks()
  
  // 打印报告
  const isReady = printDeploymentReport(checklist)
  
  // 生成部署配置
  await generateDeploymentConfig()
  
  // 退出状态
  process.exit(isReady ? 0 : 1)
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment preparation failed:', error)
    process.exit(1)
  })
}

export { runDeploymentChecks, printDeploymentReport }
#!/usr/bin/env tsx

import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

interface ProductionCheckResult {
  environmentVariables: boolean
  databaseConnection: boolean
  buildConfiguration: boolean
  securityHeaders: boolean
  performanceOptimization: boolean
}

async function checkEnvironmentVariables(): Promise<boolean> {
  console.log('🔍 Checking environment variables...')
  
  const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV'
  ]
  
  const optionalVars = [
    'NEXT_PUBLIC_APP_URL'
  ]
  
  let allRequired = true
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`❌ Missing required environment variable: ${varName}`)
      allRequired = false
    } else {
      console.log(`✅ ${varName}: Set`)
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`)
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`)
    }
  }
  
  return allRequired
}

async function checkDatabaseConnection(): Promise<boolean> {
  console.log('🔍 Checking database connection...')
  
  try {
    const { initializeDatabase } = await import('../lib/db/connection')
    const connected = await initializeDatabase()
    
    if (connected) {
      console.log('✅ Database connection successful')
      return true
    } else {
      console.log('❌ Database connection failed')
      return false
    }
  } catch (error) {
    console.log('❌ Database connection error:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

async function checkBuildConfiguration(): Promise<boolean> {
  console.log('🔍 Checking build configuration...')
  
  try {
    const fs = await import('fs/promises')
    
    // 检查package.json
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'))
    
    const requiredScripts = ['build', 'start', 'dev']
    let allScriptsPresent = true
    
    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        console.log(`✅ Script "${script}": Present`)
      } else {
        console.log(`❌ Script "${script}": Missing`)
        allScriptsPresent = false
      }
    }
    
    // 检查关键依赖
    const requiredDeps = ['next', 'react', 'drizzle-orm', '@neondatabase/serverless']
    let allDepsPresent = true
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        console.log(`✅ Dependency "${dep}": Present`)
      } else {
        console.log(`❌ Dependency "${dep}": Missing`)
        allDepsPresent = false
      }
    }
    
    return allScriptsPresent && allDepsPresent
  } catch (error) {
    console.log('❌ Build configuration check failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

async function checkSecurityHeaders(): Promise<boolean> {
  console.log('🔍 Checking security configuration...')
  
  try {
    const fs = await import('fs/promises')
    
    // 检查vercel.json中的安全头
    const vercelConfig = JSON.parse(await fs.readFile('vercel.json', 'utf-8'))
    
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
      const headers = vercelConfig.headers[0].headers
      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
      ]
      
      let allHeadersPresent = true
      
      for (const headerName of securityHeaders) {
        const header = headers.find((h: any) => h.key === headerName)
        if (header) {
          console.log(`✅ Security header "${headerName}": ${header.value}`)
        } else {
          console.log(`❌ Security header "${headerName}": Missing`)
          allHeadersPresent = false
        }
      }
      
      return allHeadersPresent
    } else {
      console.log('❌ No security headers configured')
      return false
    }
  } catch (error) {
    console.log('❌ Security headers check failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

async function checkPerformanceOptimization(): Promise<boolean> {
  console.log('🔍 Checking performance optimization...')
  
  try {
    const fs = await import('fs/promises')
    
    // 检查Next.js配置
    let nextConfigExists = false
    try {
      await fs.access('next.config.ts')
      nextConfigExists = true
      console.log('✅ Next.js config file: Present')
    } catch {
      try {
        await fs.access('next.config.js')
        nextConfigExists = true
        console.log('✅ Next.js config file: Present')
      } catch {
        console.log('⚠️  Next.js config file: Not found (using defaults)')
      }
    }
    
    // 检查TypeScript配置
    try {
      const tsConfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf-8'))
      if (tsConfig.compilerOptions && tsConfig.compilerOptions.strict) {
        console.log('✅ TypeScript strict mode: Enabled')
      } else {
        console.log('⚠️  TypeScript strict mode: Disabled')
      }
    } catch {
      console.log('❌ TypeScript config: Not found')
      return false
    }
    
    // 检查ESLint配置
    try {
      await fs.access('eslint.config.mjs')
      console.log('✅ ESLint configuration: Present')
    } catch {
      console.log('⚠️  ESLint configuration: Not found')
    }
    
    return true
  } catch (error) {
    console.log('❌ Performance optimization check failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

function generateProductionChecklist(results: ProductionCheckResult) {
  console.log('\n📋 Production Readiness Checklist:')
  console.log('==================================')
  
  const checks = [
    { name: 'Environment Variables', status: results.environmentVariables, critical: true },
    { name: 'Database Connection', status: results.databaseConnection, critical: true },
    { name: 'Build Configuration', status: results.buildConfiguration, critical: true },
    { name: 'Security Headers', status: results.securityHeaders, critical: false },
    { name: 'Performance Optimization', status: results.performanceOptimization, critical: false },
  ]
  
  let criticalPassed = 0
  let totalCritical = 0
  let allPassed = 0
  
  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌'
    const criticalMark = check.critical ? ' (Critical)' : ''
    console.log(`${icon} ${check.name}${criticalMark}`)
    
    if (check.status) allPassed++
    if (check.critical) {
      totalCritical++
      if (check.status) criticalPassed++
    }
  })
  
  console.log(`\n📊 Overall Status: ${allPassed}/${checks.length} checks passed`)
  console.log(`🔥 Critical Status: ${criticalPassed}/${totalCritical} critical checks passed`)
  
  const isProductionReady = criticalPassed === totalCritical
  
  if (isProductionReady) {
    console.log('\n🎉 System is ready for production deployment!')
    console.log('\n📝 Pre-deployment Steps:')
    console.log('1. Set NODE_ENV=production in your deployment platform')
    console.log('2. Configure DATABASE_URL with your production database')
    console.log('3. Set NEXT_PUBLIC_APP_URL to your production domain')
    console.log('4. Deploy and monitor for any issues')
  } else {
    console.log('\n⚠️  Critical issues must be resolved before production deployment.')
    console.log('\n🔧 Required Actions:')
    
    if (!results.environmentVariables) {
      console.log('   - Configure all required environment variables')
    }
    if (!results.databaseConnection) {
      console.log('   - Fix database connection issues')
    }
    if (!results.buildConfiguration) {
      console.log('   - Fix build configuration problems')
    }
  }
  
  return isProductionReady
}

async function main() {
  console.log('🚀 Production Readiness Check')
  console.log('============================\n')
  
  const results: ProductionCheckResult = {
    environmentVariables: await checkEnvironmentVariables(),
    databaseConnection: await checkDatabaseConnection(),
    buildConfiguration: await checkBuildConfiguration(),
    securityHeaders: await checkSecurityHeaders(),
    performanceOptimization: await checkPerformanceOptimization(),
  }
  
  const isReady = generateProductionChecklist(results)
  
  process.exit(isReady ? 0 : 1)
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Production check failed:', error)
    process.exit(1)
  })
}

export { main as runProductionCheck }
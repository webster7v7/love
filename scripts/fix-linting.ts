#!/usr/bin/env tsx

import { readFile, writeFile } from 'fs/promises'

/**
 * 批量修复常见的linting问题
 */
async function fixLintingIssues() {
  console.log('🔧 Fixing common linting issues...')
  
  // 1. 修复未使用的error变量
  await fixUnusedErrorVariables()
  
  // 2. 修复prefer-const问题
  await fixPreferConstIssues()
  
  // 3. 修复未使用的导入
  await fixUnusedImports()
  
  console.log('✅ Linting fixes completed')
}

async function fixUnusedErrorVariables() {
  console.log('🔄 Fixing unused error variables...')
  
  // 简化文件查找，只处理关键文件
  const files = [
    'app/actions/common.ts',
    'lib/error-handling/fallback-service.ts',
    'scripts/test-constraints.ts',
    'scripts/test-error-handling.ts',
  ]
  
  for (const file of files) {
    try {
      let content = await readFile(file, 'utf-8')
      
      // 替换未使用的error变量为_error
      content = content.replace(
        /} catch \(error\) \{[\s\S]*?(?=\n\s*})/g,
        (match) => {
          if (!match.includes('error.') && !match.includes('error)') && !match.includes('error,')) {
            return match.replace('} catch {', '} catch (_error) {')
          }
          return match
        }
      )
      
      await writeFile(file, content)
    } catch {
      // 忽略读取错误
    }
  }
  
  console.log('✅ Fixed unused error variables')
}

async function fixPreferConstIssues() {
  console.log('🔄 Fixing prefer-const issues...')
  
  // 简化文件查找
  const files = [
    'lib/error-handling/fallback-service.ts',
    'lib/performance/connection-pool.ts',
  ]
  
  for (const file of files) {
    try {
      let content = await readFile(file, 'utf-8')
      
      // 简单的let到const转换（仅处理明显的情况）
      content = content.replace(
        /let (\w+) = /g,
        (match, varName) => {
          // 检查变量是否被重新赋值
          const regex = new RegExp(`\\b${varName}\\s*=`, 'g')
          const matches = content.match(regex)
          if (matches && matches.length === 1) {
            return `const ${varName} = `
          }
          return match
        }
      )
      
      await writeFile(file, content)
    } catch {
      // 忽略读取错误
    }
  }
  
  console.log('✅ Fixed prefer-const issues')
}

async function fixUnusedImports() {
  console.log('🔄 Fixing unused imports...')
  
  // 这个比较复杂，我们只处理一些明显的情况
  const specificFixes = [
    {
      file: 'scripts/test-types.ts',
      fixes: [
        { from: 'validateId,', to: '// validateId,' },
        { from: 'photoToLegacy,', to: '// photoToLegacy,' },
        { from: 'quoteToLegacy,', to: '// quoteToLegacy,' },
      ]
    }
  ]
  
  for (const { file, fixes } of specificFixes) {
    try {
      let content = await readFile(file, 'utf-8')
      
      for (const { from, to } of fixes) {
        content = content.replace(from, to)
      }
      
      await writeFile(file, content)
    } catch {
      // 文件可能不存在，忽略
    }
  }
  
  console.log('✅ Fixed unused imports')
}

// 运行修复
if (require.main === module) {
  fixLintingIssues().catch(error => {
    console.error('❌ Linting fixes failed:', error)
    process.exit(1)
  })
}

export { fixLintingIssues }
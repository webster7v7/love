#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// 递归获取所有 TypeScript 文件
function getAllTsFiles(dir: string): string[] {
  const files: string[] = []
  
  try {
    const items = readdirSync(dir)
    
    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllTsFiles(fullPath))
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // 忽略无法访问的目录
  }
  
  return files
}

// 修复单个文件中的 catch 块
function fixCatchBlocks(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    let modified = false
    
    // 简单的正则替换：} catch (error) { -> } catch (error) {
    // 但只在该 catch 块中使用了 error 变量时才替换
    const lines = content.split('\n')
    const newLines = [...lines]
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // 找到 } catch (error) { 行
      if (line.includes('} catch (error) {')) {
        // 检查后续几行是否使用了 error 变量
        let usesError = false
        let braceCount = 1
        
        for (let j = i + 1; j < lines.length && braceCount > 0; j++) {
          const nextLine = lines[j]
          
          // 计算大括号平衡
          braceCount += (nextLine.match(/\{/g) || []).length
          braceCount -= (nextLine.match(/\}/g) || []).length
          
          // 检查是否使用了 error 变量（但不是在字符串中）
          if (nextLine.includes('error') && 
              !nextLine.includes('"error"') && 
              !nextLine.includes("'error'") &&
              !nextLine.includes('error:') &&
              !nextLine.includes('// error')) {
            usesError = true
            break
          }
        }
        
        // 如果使用了 error 变量，则添加参数
        if (usesError) {
          newLines[i] = line.replace('} catch {', '} catch (error) {')
          modified = true
        }
      }
    }
    
    if (modified) {
      writeFileSync(filePath, newLines.join('\n'), 'utf-8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
    return false
  }
}

function main() {
  console.log('🔧 批量修复 catch 块错误...\n')
  
  // 获取所有需要检查的文件
  const allFiles = [
    ...getAllTsFiles('app'),
    ...getAllTsFiles('lib'),
    ...getAllTsFiles('scripts')
  ]
  
  let fixedCount = 0
  
  for (const file of allFiles) {
    if (fixCatchBlocks(file)) {
      console.log(`✅ 修复: ${file}`)
      fixedCount++
    }
  }
  
  console.log(`\n🎉 总共修复了 ${fixedCount} 个文件`)
  console.log('🚀 现在可以尝试运行: npm run build')
}

if (require.main === module) {
  main()
}
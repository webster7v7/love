import * as fs from 'fs'
import * as path from 'path'

// 修复Repository文件中的数据库连接问题
function fixRepositoryFile(filePath: string) {
  console.log(`🔧 Fixing ${filePath}...`)
  
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // 替换 private db = getDb() 为 private getDatabase() { return getDb() }
  content = content.replace(
    /private db = getDb\(\)/g,
    'private getDatabase() {\n    return getDb()\n  }'
  )
  
  // 替换所有的 this.db 为 this.getDatabase()
  content = content.replace(/this\.db/g, 'this.getDatabase()')
  
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`✅ Fixed ${filePath}`)
}

// 修复所有Repository文件
const repositoryFiles = [
  'lib/repositories/messages.ts',
  'lib/repositories/photos.ts', 
  'lib/repositories/quotes.ts'
]

repositoryFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    fixRepositoryFile(fullPath)
  } else {
    console.log(`⚠️ File not found: ${fullPath}`)
  }
})

console.log('🎉 All repository files fixed!')
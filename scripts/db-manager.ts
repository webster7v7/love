import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

import { runMigrations, checkMigrationStatus, resetDatabase } from '../lib/db/migrate'
import { seedDatabase, clearSeedData, reseedDatabase } from '../lib/db/seed'
import { initializeDatabase } from '../lib/db/connection'

// 命令行参数处理
const command = process.argv[2]

async function main() {
  console.log('🗄️ Database Manager\n')
  
  switch (command) {
    case 'migrate':
      console.log('Running migrations...')
      const migrated = await runMigrations()
      process.exit(migrated ? 0 : 1)
      
    case 'seed':
      console.log('Seeding database...')
      const seeded = await seedDatabase()
      process.exit(seeded ? 0 : 1)
      
    case 'reset':
      console.log('Resetting database...')
      const reset = await resetDatabase()
      process.exit(reset ? 0 : 1)
      
    case 'reseed':
      console.log('Re-seeding database...')
      const reseeded = await reseedDatabase()
      process.exit(reseeded ? 0 : 1)
      
    case 'status':
      console.log('Checking database status...')
      const connected = await initializeDatabase()
      const status = await checkMigrationStatus()
      
      console.log('Connection:', connected ? '✅ Connected' : '❌ Failed')
      console.log('Migration Status:', status.success ? '✅ OK' : `❌ ${status.error}`)
      process.exit(connected && status.success ? 0 : 1)
      
    case 'init':
      console.log('Initializing database (migrate + seed)...')
      const initMigrated = await runMigrations()
      if (!initMigrated) {
        console.error('❌ Migration failed')
        process.exit(1)
      }
      
      const initSeeded = await seedDatabase()
      if (!initSeeded) {
        console.error('❌ Seeding failed')
        process.exit(1)
      }
      
      console.log('✅ Database initialization completed')
      process.exit(0)
      
    default:
      console.log('Available commands:')
      console.log('  migrate  - Run database migrations')
      console.log('  seed     - Seed database with default data')
      console.log('  reset    - Reset database (development only)')
      console.log('  reseed   - Clear and re-seed database')
      console.log('  status   - Check database connection and migration status')
      console.log('  init     - Initialize database (migrate + seed)')
      console.log('')
      console.log('Usage: npx tsx scripts/db-manager.ts <command>')
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Database manager error:', error)
  process.exit(1)
})
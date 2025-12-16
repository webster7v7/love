import { getDb } from './connection'
import { photos } from './schema'
import { initializeDatabase } from './connection'

// 默认照片数据
const DEFAULT_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop',
    caption: '添加你们的美好回忆 💕',
    isCustom: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop',
    caption: '记录每一个甜蜜瞬间 🌸',
    isCustom: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop',
    caption: '珍藏两人的温馨时光 ✨',
    isCustom: false,
  },
]

// 种子数据函数
export async function seedDatabase(): Promise<boolean> {
  console.log('🌱 Seeding database with default data...')
  
  try {
    // 确保数据库连接正常
    const connected = await initializeDatabase()
    if (!connected) {
      throw new Error('Database connection failed')
    }

    const db = getDb()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // 检查是否已经有默认照片
    const existingPhotos = await db.select().from(photos).where(eq(photos.isCustom, false))
    
    if (existingPhotos.length === 0) {
      // 插入默认照片
      await db.insert(photos).values(DEFAULT_PHOTOS)
      console.log('✅ Default photos inserted')
    } else {
      console.log('ℹ️ Default photos already exist, skipping...')
    }
    
    console.log('✅ Database seeding completed successfully')
    return true
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    return false
  }
}

// 清理种子数据（仅用于开发环境）
export async function clearSeedData(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed data clearing is not allowed in production')
    return false
  }

  console.log('🧹 Clearing seed data (development only)...')
  
  try {
    const db = getDb()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // 删除默认照片
    await db.delete(photos).where(eq(photos.isCustom, false))
    
    console.log('✅ Seed data cleared')
    return true
  } catch (error) {
    console.error('❌ Seed data clearing failed:', error)
    return false
  }
}

// 重新种子数据
export async function reseedDatabase(): Promise<boolean> {
  console.log('🔄 Re-seeding database...')
  
  const cleared = await clearSeedData()
  if (!cleared) {
    return false
  }
  
  return await seedDatabase()
}

// 导入必要的函数
import { eq } from 'drizzle-orm'
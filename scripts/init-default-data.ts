#!/usr/bin/env tsx

import { getDb } from '../lib/db/connection'
import { photos, customQuotes } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

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

async function initDefaultData() {
  try {
    console.log('🔄 Initializing default data...')
    
    const db = getDb()
    if (!db) {
      throw new Error('Database not available')
    }

    // 检查是否已有默认照片
    const existingPhotos = await db.select().from(photos).where(eq(photos.isCustom, false))
    
    if (existingPhotos.length === 0) {
      console.log('📸 Adding default photos...')
      await db.insert(photos).values(DEFAULT_PHOTOS)
      console.log('✅ Default photos added')
    } else {
      console.log('📸 Default photos already exist')
    }

    console.log('✅ Default data initialization completed')
  } catch (error) {
    console.error('❌ Failed to initialize default data:', error)
    process.exit(1)
  }
}

// 运行初始化
if (require.main === module) {
  initDefaultData()
}
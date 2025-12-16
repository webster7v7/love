'use server'

// 带缓存的数据获取函数

import { dataCache } from '@/lib/cache'
import { getMessages } from './messages'
import { getPhotos } from './photos'
import { getQuotes } from './quotes'
import { getVisitStatsWithCache } from './visits'
import type { LegacyMessage, LegacyPhoto, LegacyQuote } from '@/lib/types/database'

/**
 * 获取缓存的留言数据
 */
export async function getCachedMessages(): Promise<LegacyMessage[]> {
  return dataCache.getOrSet(
    'messages-list',
    async () => {
      const result = await getMessages()
      if (result.success && result.data) {
        return result.data
      }
      return []
    },
    2 * 60 * 1000 // 2分钟缓存
  )
}

/**
 * 获取缓存的照片数据
 */
export async function getCachedPhotos(): Promise<LegacyPhoto[]> {
  return dataCache.getOrSet(
    'photos-list',
    async () => {
      const result = await getPhotos()
      if (result.success && result.data) {
        return result.data
      }
      return []
    },
    5 * 60 * 1000 // 5分钟缓存，照片变化较少
  )
}

/**
 * 获取缓存的情话数据
 */
export async function getCachedQuotes(): Promise<LegacyQuote[]> {
  return dataCache.getOrSet(
    'quotes-list',
    async () => {
      const result = await getQuotes()
      if (result.success && result.data) {
        return result.data
      }
      return []
    },
    10 * 60 * 1000 // 10分钟缓存，情话变化最少
  )
}

/**
 * 批量获取所有缓存数据
 */
export async function getCachedAllData() {
  const [messages, photos, quotes, stats] = await Promise.all([
    getCachedMessages(),
    getCachedPhotos(), 
    getCachedQuotes(),
    getVisitStatsWithCache()
  ])

  return {
    messages,
    photos,
    quotes,
    stats
  }
}

/**
 * 预热缓存
 */
export async function warmupCache(): Promise<void> {
  try {
    // 并行预加载所有数据
    await Promise.all([
      getCachedMessages(),
      getCachedPhotos(),
      getCachedQuotes(),
      getVisitStatsWithCache()
    ])
    
    console.log('Cache warmed up successfully')
  } catch (error) {
    console.warn('Cache warmup failed:', error)
  }
}

/**
 * 失效特定资源缓存
 */
export async function invalidateCache(resource: 'messages' | 'photos' | 'quotes' | 'all'): Promise<void> {
  switch (resource) {
    case 'messages':
      await dataCache.delete('messages-list')
      break
    case 'photos':
      await dataCache.delete('photos-list')
      break
    case 'quotes':
      await dataCache.delete('quotes-list')
      break
    case 'all':
      await dataCache.clear()
      break
  }
}
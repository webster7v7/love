'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, Suspense } from 'react'
import { FaHeart, FaSpinner } from 'react-icons/fa'
import { usePreloader, useCache } from '../hooks/useCache'
import { getCachedAllData, warmupCache } from '../actions/cached-data'

// 懒加载组件
import dynamic from 'next/dynamic'

const FloatingHearts = dynamic(() => import('./FloatingHearts'), {
  ssr: false,
  loading: () => null
})

const FloatingStars = dynamic(() => import('./FloatingStars'), {
  ssr: false,
  loading: () => null
})

const MouseParticles = dynamic(() => import('./MouseParticles'), {
  ssr: false,
  loading: () => null
})

const CountdownTimer = dynamic(() => import('./CountdownTimer'), {
  ssr: false,
  loading: () => <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
})

const LoveQuotes = dynamic(() => import('./LoveQuotes'), {
  loading: () => <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
})

const PhotoGallery = dynamic(() => import('./PhotoGallery'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
})

const MessageBoard = dynamic(() => import('./MessageBoard'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
})

const VisitCounter = dynamic(() => import('./VisitCounter'), {
  ssr: false,
  loading: () => <div className="h-8 bg-gray-100 rounded animate-pulse" />
})

const AdminPanel = dynamic(() => import('./AdminPanel'), {
  ssr: false
})

import { nicknames } from '../data/nicknames'

/**
 * 优化的主页组件
 */
export default function OptimizedPage() {
  const [currentNickname, setCurrentNickname] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // 预加载数据
  const preloaded = usePreloader([
    () => warmupCache()
  ])

  // 缓存所有数据
  const { data: allData, loading: dataLoading } = useCache(
    'page-data',
    getCachedAllData,
    {
      ttl: 2 * 60 * 1000, // 2分钟缓存
      refreshInterval: 5 * 60 * 1000 // 5分钟自动刷新
    }
  )

  // 昵称轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNickname((prev) => (prev + 1) % nicknames.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // 渐进式显示
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // 性能监控
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.duration)
          }
        })
      })
      
      observer.observe({ entryTypes: ['navigation'] })
      
      return () => observer.disconnect()
    }
  }, [])

  if (!isVisible) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-pink-500"
        >
          <FaSpinner className="animate-spin text-2xl" />
          <span className="text-lg">加载中...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* 背景特效层 - 延迟加载 */}
      <Suspense fallback={null}>
        <FloatingHearts />
        <FloatingStars />
        <MouseParticles />
      </Suspense>

      {/* 主要内容 */}
      <main className="relative z-10 flex flex-col items-center justify-start px-4 py-12 md:py-20 gap-16 md:gap-24">
        
        {/* 欢迎区 */}
        <motion.section 
          className="flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-800">
            <motion.span
              key={currentNickname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"
            >
              {nicknames[currentNickname]}
            </motion.span>
          </h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            这里记录着我们的美好时光，每一个瞬间都值得珍藏 💕
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <FaHeart className="text-4xl md:text-5xl text-pink-500 animate-pulse" />
          </motion.div>
        </motion.section>

        {/* 倒计时器 */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
            <CountdownTimer />
          </Suspense>
        </motion.section>

        {/* 情话墙 */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
            <LoveQuotes />
          </Suspense>
        </motion.section>

        {/* 照片墙 */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="w-full max-w-6xl"
        >
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <PhotoGallery />
          </Suspense>
        </motion.section>

        {/* 留言板 */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
            <MessageBoard />
          </Suspense>
        </motion.section>

        {/* 访问统计 */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse" />}>
            <VisitCounter />
          </Suspense>
        </motion.section>

        {/* 管理面板 */}
        <Suspense fallback={null}>
          <AdminPanel />
        </Suspense>

        {/* 数据预加载状态 */}
        {dataLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaSpinner className="animate-spin" />
              <span>数据加载中...</span>
            </div>
          </motion.div>
        )}

        {/* 缓存状态指示器 */}
        {preloaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 left-4 bg-green-500/80 backdrop-blur-sm rounded-lg p-2 shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm text-white">
              <FaHeart className="text-xs" />
              <span>已优化</span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FaHeart } from 'react-icons/fa'
import FloatingHearts from './components/FloatingHearts'
import FloatingStars from './components/FloatingStars'
import MouseParticles from './components/MouseParticles'
import ClientOnly from './components/ClientOnly'
import CountdownTimer from './components/CountdownTimer'
import LoveQuotes from './components/LoveQuotes'
import PhotoGallery from './components/PhotoGallery'
import MessageBoard from './components/MessageBoard'
import VisitCounter from './components/VisitCounter'
import AdminPanel from './components/AdminPanel'

import { nicknames } from './data/nicknames'

export default function Home() {
  const [currentNickname, setCurrentNickname] = useState(0)

  // 昵称轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNickname((prev) => (prev + 1) % nicknames.length)
    }, 3000) // 每3秒切换一次

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* 背景特效层 */}
      <ClientOnly>
        <FloatingHearts />
        <FloatingStars />
        <MouseParticles />
      </ClientOnly>

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
            致我最爱的
          </h1>
          
          <div className="h-20 md:h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentNickname}
                initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold gradient-text"
              >
                {nicknames[currentNickname]}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* 大爱心装饰 */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <FaHeart className="text-5xl md:text-7xl text-pink-500" />
          </motion.div>
        </motion.section>

        {/* 访问统计区 */}
        <VisitCounter />

        {/* 倒计时区 */}
        <motion.section 
          className="flex flex-col items-center gap-8 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">
            我们已经相识
          </h3>
          
          <CountdownTimer />
          
          <motion.p 
            className="text-lg md:text-2xl text-center font-medium text-gray-600 max-w-2xl px-4 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            因为有你陪着身边
            <br />
            <span className="gradient-text text-xl md:text-3xl font-bold">
              我感到很幸福
            </span>
          </motion.p>
        </motion.section>

        {/* 情话墙区 */}
        <motion.section 
          className="flex flex-col items-center gap-12 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <div className="flex items-center gap-4">
            <FaHeart className="text-2xl text-pink-500" />
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-700">
              想对你说的话
            </h3>
            <FaHeart className="text-2xl text-pink-500" />
          </div>
          
          <LoveQuotes />
        </motion.section>

        {/* 照片墙区 */}
        <motion.section 
          className="flex flex-col items-center gap-12 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <PhotoGallery />
        </motion.section>

        {/* 留言板区 */}
        <motion.section 
          className="flex flex-col items-center gap-12 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <MessageBoard />
        </motion.section>

        {/* 底部装饰 */}
        <motion.div
          className="flex items-center gap-2 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          <FaHeart className="text-pink-400" />
          <span>永远爱你</span>
          <FaHeart className="text-pink-400" />
        </motion.div>
      </main>

      {/* 管理员面板 */}
      <ClientOnly>
        <AdminPanel />
      </ClientOnly>
    </div>
  )
}

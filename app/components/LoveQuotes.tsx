'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { FaHeart, FaPlus, FaTrash, FaTimes } from 'react-icons/fa'
import { loveQuotes } from '../data/loveQuotes'
import { getRandomNickname } from '../data/nicknames'

interface Quote {
  id: string
  text: string
  isCustom: boolean
  createdAt: number
}

const STORAGE_KEY = 'custom-love-quotes'

export default function LoveQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuoteText, setNewQuoteText] = useState('')
  const [isClient, setIsClient] = useState(false)

  // 加载情话（预设 + 自定义）
  useEffect(() => {
    // 使用 setTimeout 避免同步 setState
    setTimeout(() => setIsClient(true), 0)
    
    // 将预设情话（520条）转换为 Quote 对象
    const defaultQuoteObjects: Quote[] = loveQuotes.map((text, index) => ({
      id: `default-${index}`,
      text,
      isCustom: false,
      createdAt: Date.now() - (loveQuotes.length - index) * 1000,
    }))

    // 从 localStorage 加载自定义情话
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const customQuotes: Quote[] = JSON.parse(stored)
        setTimeout(() => setQuotes([...defaultQuoteObjects, ...customQuotes]), 0)
      } else {
        setTimeout(() => setQuotes(defaultQuoteObjects), 0)
      }
    } catch (error) {
      console.error('Failed to load custom quotes:', error)
      setTimeout(() => setQuotes(defaultQuoteObjects), 0)
    }
  }, [])

  // 自动轮播
  useEffect(() => {
    if (quotes.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length)
    }, 5000) // 每5秒切换
    
    return () => clearInterval(interval)
  }, [quotes.length])

  // 添加自定义情话
  const addQuote = () => {
    const trimmedText = newQuoteText.trim()
    
    if (!trimmedText) return
    if (trimmedText.length > 200) {
      alert('情话太长了，请控制在200字以内～')
      return
    }

    const newQuote: Quote = {
      id: `custom-${Date.now()}`,
      text: trimmedText,
      isCustom: true,
      createdAt: Date.now(),
    }

    const updatedQuotes = [...quotes, newQuote]
    setQuotes(updatedQuotes)
    
    // 保存自定义情话到 localStorage
    const customQuotes = updatedQuotes.filter(q => q.isCustom)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuotes))
    } catch (error) {
      console.error('Failed to save custom quote:', error)
    }

    // 重置表单
    setNewQuoteText('')
    setShowAddForm(false)
    
    // 自动切换到新添加的情话
    setCurrentIndex(updatedQuotes.length - 1)
  }

  // 删除自定义情话
  const deleteQuote = (id: string) => {
    if (!confirm('确定要删除这条情话吗？')) return

    const updatedQuotes = quotes.filter(q => q.id !== id)
    setQuotes(updatedQuotes)

    // 更新 localStorage
    const customQuotes = updatedQuotes.filter(q => q.isCustom)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuotes))
    } catch (error) {
      console.error('Failed to delete custom quote:', error)
    }

    // 调整当前索引
    if (currentIndex >= updatedQuotes.length) {
      setCurrentIndex(Math.max(0, updatedQuotes.length - 1))
    }
  }

  const customQuoteCount = quotes.filter(q => q.isCustom).length
  const currentQuote = quotes[currentIndex]

  // 动态替换昵称 - 每次切换情话时选择新的随机昵称
  const displayText = useMemo(() => {
    if (!currentQuote) return ''
    const randomNickname = getRandomNickname()
    return currentQuote.text.replace(/\{nickname\}/g, randomNickname)
  }, [currentQuote])

  if (!isClient || quotes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      {/* 控制面板 */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="romantic-button flex items-center gap-2 text-sm"
        >
          {showAddForm ? <FaTimes /> : <FaPlus />}
          {showAddForm ? '取消' : '添加情话'}
        </button>
        
        {customQuoteCount > 0 && (
          <div className="text-sm text-gray-600 bg-white/60 px-4 py-2 rounded-lg">
            已添加 <span className="font-bold gradient-text">{customQuoteCount}</span> 条自定义情话
          </div>
        )}
      </div>

      {/* 添加表单 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl overflow-hidden"
          >
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h4 className="text-lg font-semibold gradient-text flex items-center gap-2">
                <FaHeart className="text-pink-500" />
                添加你的专属情话
              </h4>
              
              <textarea
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                placeholder="写下你想对 TA 说的话..."
                className="romantic-input w-full min-h-[100px] resize-none"
                maxLength={200}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {newQuoteText.length} / 200
                </div>
                
                <button
                  onClick={addQuote}
                  disabled={!newQuoteText.trim()}
                  className="romantic-button text-sm"
                >
                  确认添加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主显示区 */}
      <div className="relative min-h-[200px] w-full flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          >
            <div className="flex items-center gap-3">
              <FaHeart className="text-4xl text-pink-500 heartbeat" />
              {currentQuote?.isCustom && (
                <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                  自定义
                </span>
              )}
            </div>
            
            <p className="text-2xl md:text-3xl lg:text-4xl text-center font-medium gradient-text leading-relaxed px-4">
              {displayText}
            </p>

            {/* 删除按钮 - 仅自定义情话显示 */}
            {currentQuote?.isCustom && (
              <motion.button
                onClick={() => deleteQuote(currentQuote.id)}
                className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTrash />
                删除这条情话
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 进度指示器 */}
      <div className="flex flex-wrap gap-2 justify-center max-w-full px-4">
        {quotes.map((quote, index) => (
          <button
            key={quote.id}
            onClick={() => setCurrentIndex(index)}
            className={`transition-all rounded-full ${
              index === currentIndex 
                ? `${quote.isCustom ? 'bg-purple-500' : 'bg-pink-500'} w-8 h-2` 
                : `${quote.isCustom ? 'bg-purple-300 hover:bg-purple-400' : 'bg-pink-300 hover:bg-pink-400'} w-2 h-2`
            }`}
            aria-label={`切换到第${index + 1}条情话${quote.isCustom ? '（自定义）' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

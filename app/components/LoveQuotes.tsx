'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { FaHeart, FaPlus, FaTrash, FaTimes } from 'react-icons/fa'
import { loveQuotes } from '../data/loveQuotes'
import { getRandomNickname } from '../data/nicknames'
import { 
  createQuote, 
  getQuotes, 
  deleteQuote as deleteQuoteAction 
} from '../actions/quotes'
import { LegacyQuote } from '@/lib/types/database'

type Quote = LegacyQuote

export default function LoveQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuoteText, setNewQuoteText] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)

  // 加载情话数据
  const loadQuotes = async () => {
    try {
      // 将预设情话转换为 Quote 对象
      const defaultQuoteObjects: Quote[] = loveQuotes.map((text, index) => ({
        id: `default-${index}`,
        text,
        isCustom: false,
        createdAt: Date.now() - (loveQuotes.length - index) * 1000,
      }))

      // 从数据库加载自定义情话
      const result = await getQuotes({ limit: 100 })
      if (result.success && result.data) {
        setQuotes([...defaultQuoteObjects, ...result.data])
      } else {
        setQuotes(defaultQuoteObjects)
      }
    } catch (error) {
      console.error('Failed to load quotes:', error)
      // 如果数据库失败，至少显示预设情话
      const defaultQuoteObjects: Quote[] = loveQuotes.map((text, index) => ({
        id: `default-${index}`,
        text,
        isCustom: false,
        createdAt: Date.now() - (loveQuotes.length - index) * 1000,
      }))
      setQuotes(defaultQuoteObjects)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true)
      loadQuotes()
    }, 0)
    
    return () => clearTimeout(timer)
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
  const addQuote = async () => {
    const trimmedText = newQuoteText.trim()
    
    if (!trimmedText) return
    if (trimmedText.length > 200) {
      alert('情话太长了，请控制在200字以内～')
      return
    }

    try {
      const result = await createQuote({ text: trimmedText, isCustom: true })
      
      if (result.success && result.data) {
        const updatedQuotes = [...quotes, result.data]
        setQuotes(updatedQuotes)
        
        // 重置表单
        setNewQuoteText('')
        setShowAddForm(false)
        
        // 自动切换到新添加的情话
        setCurrentIndex(updatedQuotes.length - 1)
      } else {
        alert('添加情话失败，请重试')
      }
    } catch (error) {
      console.error('Failed to add quote:', error)
      alert('添加情话失败，请重试')
    }
  }

  // 删除自定义情话
  const handleDeleteQuote = async (id: string) => {
    // 不能删除预设情话
    if (id.startsWith('default-')) return
    
    if (!confirm('确定要删除这条情话吗？')) return

    try {
      const result = await deleteQuoteAction(id)
      if (result.success) {
        const updatedQuotes = quotes.filter(q => q.id !== id)
        setQuotes(updatedQuotes)

        // 调整当前索引
        if (currentIndex >= updatedQuotes.length) {
          setCurrentIndex(Math.max(0, updatedQuotes.length - 1))
        }
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
      alert('删除失败，请重试')
    }
  }

  const customQuoteCount = quotes.filter(q => !q.id.startsWith('default-')).length
  const currentQuote = quotes[currentIndex]
  const isCustomQuote = currentQuote && !currentQuote.id.startsWith('default-')

  // 动态替换昵称 - 每次切换情话时选择新的随机昵称
  const displayText = useMemo(() => {
    if (!currentQuote) return ''
    const randomNickname = getRandomNickname()
    return currentQuote.text.replace(/\{nickname\}/g, randomNickname)
  }, [currentQuote])

  if (!isClient) return null

  if (loading || quotes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-400">加载情话中...</div>
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
              {isCustomQuote && (
                <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                  自定义
                </span>
              )}
            </div>
            
            <p className="text-2xl md:text-3xl lg:text-4xl text-center font-medium gradient-text leading-relaxed px-4">
              {displayText}
            </p>

            {/* 删除按钮 - 仅自定义情话显示 */}
            {isCustomQuote && (
              <motion.button
                onClick={() => handleDeleteQuote(currentQuote.id)}
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
        {quotes.map((quote, index) => {
          const isCustom = !quote.id.startsWith('default-')
          return (
            <button
              key={quote.id}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all rounded-full ${
                index === currentIndex 
                  ? `${isCustom ? 'bg-purple-500' : 'bg-pink-500'} w-8 h-2` 
                  : `${isCustom ? 'bg-purple-300 hover:bg-purple-400' : 'bg-pink-300 hover:bg-pink-400'} w-2 h-2`
              }`}
              aria-label={`切换到第${index + 1}条情话${isCustom ? '（自定义）' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}

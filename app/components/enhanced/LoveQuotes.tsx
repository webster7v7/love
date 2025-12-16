'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { FaHeart, FaPlus, FaTrash, FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { createQuote, getQuotes, deleteQuote } from '@/app/actions/quotes'
import { migrationManager } from '@/lib/migration'
import { loveQuotes } from '@/app/data/loveQuotes'
import { getRandomNickname } from '@/app/data/nicknames'
import type { LegacyQuote } from '@/lib/types/database'

interface ComponentState {
  quotes: LegacyQuote[]
  loading: boolean
  error: string | null
  migrating: boolean
  migrationProgress: number
  fallbackMode: boolean
}

export default function EnhancedLoveQuotes() {
  const [state, setState] = useState<ComponentState>({
    quotes: [],
    loading: true,
    error: null,
    migrating: false,
    migrationProgress: 0,
    fallbackMode: false
  })
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuoteText, setNewQuoteText] = useState('')

  // 加载情话数据
  const loadQuotes = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await getQuotes()
      
      if (result.success) {
        // 将预设情话转换为 LegacyQuote 对象
        const defaultQuoteObjects: LegacyQuote[] = loveQuotes.map((text, index) => ({
          id: `default-${index}`,
          text,
          isCustom: false,
          createdAt: Date.now() - (loveQuotes.length - index) * 1000,
        }))

        // 合并预设情话和自定义情话
        const customQuotes = result.data || []
        const allQuotes = [...defaultQuoteObjects, ...customQuotes.filter(q => q.isCustom)]
        
        setState(prev => ({
          ...prev,
          quotes: allQuotes,
          loading: false,
          fallbackMode: result.fallbackUsed || false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '加载情话失败',
          loading: false
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: '网络连接失败，请稍后重试',
        loading: false
      }))
    }
  }, [])

  // 数据迁移
  const performMigration = useCallback(async () => {
    setState(prev => ({ ...prev, migrating: true, migrationProgress: 0 }))
    
    try {
      await migrationManager.migrateFromLocalStorage({
        onProgress: (progress) => {
          setState(prev => ({ ...prev, migrationProgress: progress }))
        }
      })
      
      // 迁移完成后重新加载数据
      await loadQuotes()
      
      setState(prev => ({ ...prev, migrating: false }))
    } catch (error) {
      console.error('Migration failed:', error)
      setState(prev => ({
        ...prev,
        migrating: false,
        error: '数据迁移失败，将继续使用本地存储'
      }))
    }
  }, [loadQuotes])

  // 组件初始化
  useEffect(() => {
    const initializeComponent = async () => {
      // 检查是否需要迁移
      const hasLocalData = await migrationManager.detectLocalStorageData()
      
      if (hasLocalData.hasData && hasLocalData.quotes.length > 0) {
        // 询问用户是否要迁移数据
        const shouldMigrate = window.confirm(
          `检测到本地存储中有 ${hasLocalData.quotes.length} 条自定义情话。是否要迁移到云端数据库？`
        )
        
        if (shouldMigrate) {
          await performMigration()
          return
        }
      }
      
      // 直接加载数据
      await loadQuotes()
    }
    
    initializeComponent()
  }, [loadQuotes, performMigration])

  // 自动轮播
  useEffect(() => {
    if (state.quotes.length === 0 || state.loading || state.migrating) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % state.quotes.length)
    }, 5000) // 每5秒切换
    
    return () => clearInterval(interval)
  }, [state.quotes.length, state.loading, state.migrating])

  // 添加自定义情话
  const addQuote = async () => {
    const trimmedText = newQuoteText.trim()
    
    if (!trimmedText) return
    if (trimmedText.length > 200) {
      alert('情话太长了，请控制在200字以内～')
      return
    }

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await createQuote({
        text: trimmedText,
        isCustom: true
      })

      if (result.success) {
        setNewQuoteText('')
        setShowAddForm(false)
        await loadQuotes() // 重新加载数据
        
        // 自动切换到新添加的情话
        const newIndex = state.quotes.length
        setCurrentIndex(newIndex)
        
        if (result.fallbackUsed) {
          setState(prev => ({
            ...prev,
            fallbackMode: true,
            error: '当前使用本地存储模式'
          }))
        }
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '添加情话失败',
          loading: false
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: '网络连接失败，请稍后重试',
        loading: false
      }))
    }
  }

  // 删除自定义情话
  const handleDeleteQuote = async (id: string) => {
    if (!confirm('确定要删除这条情话吗？')) return

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await deleteQuote(id)

      if (result.success) {
        await loadQuotes() // 重新加载数据
        
        // 调整当前索引
        if (currentIndex >= state.quotes.length - 1) {
          setCurrentIndex(Math.max(0, state.quotes.length - 2))
        }
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '删除情话失败',
          loading: false
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: '网络连接失败，请稍后重试',
        loading: false
      }))
    }
  }

  // 重试操作
  const retryOperation = () => {
    setState(prev => ({ ...prev, error: null }))
    loadQuotes()
  }

  const customQuoteCount = state.quotes.filter(q => q.isCustom).length
  const currentQuote = state.quotes[currentIndex]

  // 动态替换昵称 - 每次切换情话时选择新的随机昵称
  const displayText = useMemo(() => {
    if (!currentQuote) return ''
    const randomNickname = getRandomNickname()
    return currentQuote.text.replace(/\{nickname\}/g, randomNickname)
  }, [currentQuote])

  if (state.loading && !state.migrating && state.quotes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <FaSpinner className="animate-spin text-4xl text-pink-500 mr-4" />
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
      {/* 错误提示 */}
      {state.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500" />
            <span className="text-red-700">{state.error}</span>
          </div>
          <button
            onClick={retryOperation}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            重试
          </button>
        </motion.div>
      )}

      {/* 迁移进度 */}
      {state.migrating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <FaSpinner className="text-blue-500 animate-spin" />
            <span className="text-blue-700">正在迁移情话到云端...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.migrationProgress}%` }}
            />
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {state.migrationProgress}% 完成
          </div>
        </motion.div>
      )}

      {/* 控制面板 */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={state.loading || state.migrating}
          className="romantic-button flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {showAddForm ? <FaTimes /> : <FaPlus />}
          {showAddForm ? '取消' : '添加情话'}
        </button>
        
        {customQuoteCount > 0 && (
          <div className="text-sm text-gray-600 bg-white/60 px-4 py-2 rounded-lg flex items-center gap-2">
            已添加 <span className="font-bold gradient-text">{customQuoteCount}</span> 条自定义情话
            {state.fallbackMode && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                本地模式
              </span>
            )}
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
                disabled={state.loading || state.migrating}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {newQuoteText.length} / 200
                </div>
                
                <button
                  onClick={addQuote}
                  disabled={!newQuoteText.trim() || state.loading || state.migrating}
                  className="romantic-button text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {state.loading && <FaSpinner className="animate-spin" />}
                  确认添加
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主显示区 */}
      <div className="relative min-h-[200px] w-full flex items-center justify-center px-4">
        {state.loading && !state.migrating ? (
          <div className="flex items-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-pink-500" />
            <span className="text-gray-500">加载中...</span>
          </div>
        ) : (
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
                  onClick={() => handleDeleteQuote(currentQuote.id)}
                  disabled={state.loading}
                  className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {state.loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                  删除这条情话
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* 进度指示器 */}
      {!state.loading && !state.migrating && state.quotes.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-full px-4">
          {state.quotes.map((quote, index) => (
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
      )}
    </div>
  )
}
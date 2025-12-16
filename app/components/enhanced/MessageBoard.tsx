'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaTimes, FaEdit, FaHeart, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { createMessage, getMessages, updateMessage, deleteMessage } from '@/app/actions/messages'
import { migrationManager } from '@/lib/migration'
import type { LegacyMessage } from '@/lib/types/database'

const NOTE_COLORS = [
  '#FFE4E1', // 淡粉
  '#FFF0F5', // 薰衣草红
  '#FFB6C1', // 浅粉红
  '#FFDAB9', // 桃色
  '#FFE4B5', // 淡黄
  '#E6E6FA', // 薰衣草
]

interface ComponentState {
  messages: LegacyMessage[]
  loading: boolean
  error: string | null
  migrating: boolean
  migrationProgress: number
  fallbackMode: boolean
}

export default function EnhancedMessageBoard() {
  const [state, setState] = useState<ComponentState>({
    messages: [],
    loading: true,
    error: null,
    migrating: false,
    migrationProgress: 0,
    fallbackMode: false
  })
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMessageContent, setNewMessageContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // 加载留言数据
  const loadMessages = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await getMessages()
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          messages: result.data || [],
          loading: false,
          fallbackMode: result.fallbackUsed || false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '加载留言失败',
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
      await loadMessages()
      
      setState(prev => ({ ...prev, migrating: false }))
    } catch (error) {
      console.error('Migration failed:', error)
      setState(prev => ({
        ...prev,
        migrating: false,
        error: '数据迁移失败，将继续使用本地存储'
      }))
    }
  }, [loadMessages])

  // 组件初始化
  useEffect(() => {
    const initializeComponent = async () => {
      // 检查是否需要迁移
      const hasLocalData = await migrationManager.detectLocalStorageData()
      
      if (hasLocalData.hasData && hasLocalData.totalItems > 0) {
        // 询问用户是否要迁移数据
        const shouldMigrate = window.confirm(
          `检测到本地存储中有 ${hasLocalData.messages.length} 条留言。是否要迁移到云端数据库？`
        )
        
        if (shouldMigrate) {
          await performMigration()
          return
        }
      }
      
      // 直接加载数据
      await loadMessages()
    }
    
    initializeComponent()
  }, [loadMessages, performMigration])

  // 添加留言
  const addMessage = async () => {
    const trimmedContent = newMessageContent.trim()

    if (!trimmedContent) {
      alert('请输入留言内容')
      return
    }

    if (trimmedContent.length > 200) {
      alert('留言太长了，请控制在200字以内')
      return
    }

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await createMessage({
        content: trimmedContent,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      })

      if (result.success) {
        setNewMessageContent('')
        setShowAddForm(false)
        await loadMessages() // 重新加载数据
        
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
          error: result.error || '添加留言失败',
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

  // 删除留言
  const handleDeleteMessage = async (id: string) => {
    if (!confirm('确定要删除这条留言吗？')) return

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await deleteMessage(id)

      if (result.success) {
        await loadMessages() // 重新加载数据
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '删除留言失败',
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

  // 编辑留言
  const startEditing = (message: LegacyMessage) => {
    setEditingId(message.id)
    setEditingContent(message.content)
  }

  const saveEdit = async (id: string) => {
    const trimmedContent = editingContent.trim()

    if (!trimmedContent) {
      alert('留言内容不能为空')
      return
    }

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await updateMessage(id, { content: trimmedContent })

      if (result.success) {
        setEditingId(null)
        setEditingContent('')
        await loadMessages() // 重新加载数据
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '更新留言失败',
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

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  // 重试操作
  const retryOperation = () => {
    setState(prev => ({ ...prev, error: null }))
    loadMessages()
  }

  return (
    <div className="w-full max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3 flex items-center justify-center gap-3">
            <FaHeart className="text-pink-500" />
            爱的留言板
            {state.fallbackMode && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                本地模式
              </span>
            )}
          </h2>
          <p className="text-gray-600">记录每天的心情和想说的话</p>
        </div>

        {/* 错误提示 */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
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
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaSpinner className="text-blue-500 animate-spin" />
              <span className="text-blue-700">正在迁移数据到云端...</span>
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

        {/* 添加按钮 */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={state.loading || state.migrating}
            className="romantic-button flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {showAddForm ? <FaTimes /> : <FaPlus />}
            {showAddForm ? '取消' : '添加留言'}
          </button>
        </div>

        {/* 添加表单 */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-6 rounded-2xl space-y-4 max-w-2xl mx-auto">
                <textarea
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  placeholder="写下你想说的话..."
                  className="romantic-input w-full min-h-[120px] resize-none"
                  maxLength={200}
                  disabled={state.loading || state.migrating}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {newMessageContent.length} / 200
                  </span>
                  <button 
                    onClick={addMessage} 
                    disabled={state.loading || state.migrating}
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

        {/* 加载状态 */}
        {state.loading && !state.migrating && (
          <div className="text-center py-12">
            <FaSpinner className="animate-spin text-4xl text-pink-500 mx-auto mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        )}

        {/* 留言展示 */}
        {!state.loading && !state.migrating && (
          <>
            {state.messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                还没有留言，快来添加第一条吧～
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                  >
                    <div
                      className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
                      style={{
                        backgroundColor: message.color,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      }}
                    >
                      {/* 装饰元素 */}
                      <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                        <FaHeart className="w-full h-full text-pink-600" />
                      </div>

                      {/* 日期 */}
                      <div className="text-xs text-gray-600 mb-3 font-medium">
                        {message.date}
                      </div>

                      {/* 内容 */}
                      {editingId === message.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-2 rounded-lg border-2 border-pink-300 focus:border-pink-500 outline-none resize-none"
                            rows={4}
                            maxLength={200}
                            disabled={state.loading}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(message.id)}
                              disabled={state.loading}
                              className="flex-1 bg-pink-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {state.loading && <FaSpinner className="animate-spin" />}
                              保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={state.loading}
                              className="flex-1 bg-gray-400 text-white py-1 px-3 rounded-lg text-sm hover:bg-gray-500 transition-colors disabled:opacity-50"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}

                      {/* 操作按钮 */}
                      {editingId !== message.id && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(message)}
                            disabled={state.loading}
                            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                            title="编辑"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={state.loading}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="删除"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
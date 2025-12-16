'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaEdit, FaHeart, FaLock } from 'react-icons/fa'
import { 
  createMessage, 
  getMessages, 
  updateMessage, 
  deleteMessage as deleteMessageAction 
} from '../actions/messages'
import PasswordModal from './PasswordModal'
import { useAuth } from '../hooks/useAuth'

import { LegacyMessage } from '@/lib/types/database'

type Message = LegacyMessage

const NOTE_COLORS = [
  '#FFE4E1', // 淡粉
  '#FFF0F5', // 薰衣草红
  '#FFB6C1', // 浅粉红
  '#FFDAB9', // 桃色
  '#FFE4B5', // 淡黄
  '#E6E6FA', // 薰衣草
]

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMessageContent, setNewMessageContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  
  const { isAuthenticated, login, extendSession } = useAuth()

  // 加载留言数据
  const loadMessages = async () => {
    try {
      const result = await getMessages({ limit: 50 })
      if (result.success && result.data) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true)
      loadMessages()
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

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

    try {
      const result = await createMessage({
        content: trimmedContent,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      })

      if (result.success && result.data) {
        setMessages(prev => [...prev, result.data!])
        setNewMessageContent('')
        setShowAddForm(false)
      } else {
        alert('添加留言失败，请重试')
      }
    } catch (error) {
      console.error('Failed to add message:', error)
      alert('添加留言失败，请重试')
    }
  }

  const handleDeleteMessage = async (id: string) => {
    // 检查权限
    if (!isAuthenticated) {
      setPendingDeleteId(id)
      setShowPasswordModal(true)
      return
    }

    // 延长会话
    extendSession()

    if (!confirm('确定要删除这条留言吗？')) return

    try {
      const result = await deleteMessageAction(id)
      if (result.success) {
        setMessages(prev => prev.filter(m => m.id !== id))
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert('删除失败，请重试')
    }
  }

  const handlePasswordSuccess = () => {
    login()
    if (pendingDeleteId) {
      // 延迟执行删除，让用户看到认证成功
      setTimeout(() => {
        handleDeleteMessage(pendingDeleteId)
        setPendingDeleteId(null)
      }, 300)
    }
  }

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false)
    setPendingDeleteId(null)
  }

  const startEditing = (message: Message) => {
    setEditingId(message.id)
    setEditingContent(message.content)
  }

  const saveEdit = async (id: string) => {
    const trimmedContent = editingContent.trim()

    if (!trimmedContent) {
      alert('留言内容不能为空')
      return
    }

    try {
      const result = await updateMessage(id, { content: trimmedContent })
      if (result.success && result.data) {
        setMessages(prev => prev.map(m => 
          m.id === id ? result.data! : m
        ))
        setEditingId(null)
        setEditingContent('')
      } else {
        alert('更新失败，请重试')
      }
    } catch (error) {
      console.error('Failed to update message:', error)
      alert('更新失败，请重试')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  if (!isClient) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-400">加载留言中...</div>
      </div>
    )
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
          </h2>
          <p className="text-gray-600">记录每天的心情和想说的话</p>
        </div>

        {/* 添加按钮 */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="romantic-button flex items-center gap-2 text-sm"
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
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {newMessageContent.length} / 200
                  </span>
                  <button onClick={addMessage} className="romantic-button text-sm">
                    确认添加
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 留言展示 */}
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            还没有留言，快来添加第一条吧～
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((message, index) => (
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
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(message.id)}
                          className="flex-1 bg-pink-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-pink-600 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-400 text-white py-1 px-3 rounded-lg text-sm hover:bg-gray-500 transition-colors"
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
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                        title="编辑"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors relative group"
                        title={isAuthenticated ? "删除" : "删除 (需要权限)"}
                      >
                        {isAuthenticated ? <FaTimes size={12} /> : <FaLock size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 权限验证模态框 */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSuccess={handlePasswordSuccess}
        title="删除权限验证"
        message="删除留言需要管理员权限，请输入密码"
      />
    </div>
  )
}


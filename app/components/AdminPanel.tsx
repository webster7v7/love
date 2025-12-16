'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FaLock, FaUnlock, FaTimes, FaClock, FaShieldAlt } from 'react-icons/fa'
import { useAuth } from '../hooks/useAuth'

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const { isAuthenticated, logout, sessionExpiry, extendSession } = useAuth()

  // 计算剩余时间
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return

    const updateTimeLeft = () => {
      const now = Date.now()
      const remaining = sessionExpiry - now

      if (remaining <= 0) {
        setTimeLeft('已过期')
        return
      }

      const minutes = Math.floor(remaining / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, sessionExpiry])

  if (!isAuthenticated) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-500 text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition-colors z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="管理员面板"
      >
        <FaLock size={20} />
      </motion.button>
    )
  }

  return (
    <>
      {/* 管理员状态指示器 */}
      <motion.div
        className="fixed bottom-4 right-4 z-40"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2"
          title="管理员已登录"
        >
          <FaUnlock size={20} />
          <span className="text-xs font-medium hidden sm:block">管理员</span>
        </button>
      </motion.div>

      {/* 管理面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>

              {/* 标题 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4">
                  <FaShieldAlt className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold gradient-text mb-2">管理员面板</h3>
                <p className="text-gray-600 text-sm">权限管理和会话状态</p>
              </div>

              {/* 状态信息 */}
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUnlock className="text-green-600" />
                    <span className="font-medium text-green-800">管理员权限已激活</span>
                  </div>
                  <div className="text-sm text-green-700">
                    您现在可以删除留言、照片和情话
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaClock className="text-blue-600" />
                    <span className="font-medium text-blue-800">会话剩余时间</span>
                  </div>
                  <div className="text-lg font-mono text-blue-700">
                    {timeLeft}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    extendSession()
                    setIsOpen(false)
                  }}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaClock />
                  延长会话 (30分钟)
                </button>

                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaLock />
                  退出管理员模式
                </button>
              </div>

              {/* 提示信息 */}
              <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
                <p>💡 会话将在30分钟后自动过期</p>
                <p>🔒 退出后需要重新输入密码</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
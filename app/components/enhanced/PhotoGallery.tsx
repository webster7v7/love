'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaTimes, FaImage, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { createPhoto, getPhotos, deletePhoto } from '@/app/actions/photos'
import { migrationManager } from '@/lib/migration'
import type { LegacyPhoto } from '@/lib/types/database'

// 默认占位照片
const DEFAULT_PHOTOS: LegacyPhoto[] = [
  {
    id: 'default-1',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop',
    caption: '添加你们的美好回忆 💕',
    createdAt: Date.now() - 3000,
  },
  {
    id: 'default-2',
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop',
    caption: '记录每一个甜蜜瞬间 🌸',
    createdAt: Date.now() - 2000,
  },
  {
    id: 'default-3',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop',
    caption: '珍藏两人的温馨时光 ✨',
    createdAt: Date.now() - 1000,
  },
]

interface ComponentState {
  photos: LegacyPhoto[]
  loading: boolean
  error: string | null
  migrating: boolean
  migrationProgress: number
  fallbackMode: boolean
}

export default function EnhancedPhotoGallery() {
  const [state, setState] = useState<ComponentState>({
    photos: DEFAULT_PHOTOS,
    loading: true,
    error: null,
    migrating: false,
    migrationProgress: 0,
    fallbackMode: false
  })
  
  const [selectedPhoto, setSelectedPhoto] = useState<LegacyPhoto | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')

  // 加载照片数据
  const loadPhotos = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await getPhotos()
      
      if (result.success) {
        // 合并默认照片和自定义照片
        const customPhotos = result.data || []
        const allPhotos = [...DEFAULT_PHOTOS, ...customPhotos.filter(p => !p.id.startsWith('default-'))]
        
        setState(prev => ({
          ...prev,
          photos: allPhotos,
          loading: false,
          fallbackMode: result.fallbackUsed || false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '加载照片失败',
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
      await loadPhotos()
      
      setState(prev => ({ ...prev, migrating: false }))
    } catch (error) {
      console.error('Migration failed:', error)
      setState(prev => ({
        ...prev,
        migrating: false,
        error: '数据迁移失败，将继续使用本地存储'
      }))
    }
  }, [loadPhotos])

  // 组件初始化
  useEffect(() => {
    const initializeComponent = async () => {
      // 检查是否需要迁移
      const hasLocalData = await migrationManager.detectLocalStorageData()
      
      if (hasLocalData.hasData && hasLocalData.photos.length > 0) {
        // 询问用户是否要迁移数据
        const shouldMigrate = window.confirm(
          `检测到本地存储中有 ${hasLocalData.photos.length} 张照片。是否要迁移到云端数据库？`
        )
        
        if (shouldMigrate) {
          await performMigration()
          return
        }
      }
      
      // 直接加载数据
      await loadPhotos()
    }
    
    initializeComponent()
  }, [loadPhotos, performMigration])

  // 添加照片
  const addPhoto = async () => {
    const trimmedUrl = newPhotoUrl.trim()
    const trimmedCaption = newPhotoCaption.trim()

    if (!trimmedUrl) {
      alert('请输入照片链接')
      return
    }

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await createPhoto({
        url: trimmedUrl,
        caption: trimmedCaption || '美好回忆',
        isCustom: true
      })

      if (result.success) {
        setNewPhotoUrl('')
        setNewPhotoCaption('')
        setShowAddForm(false)
        await loadPhotos() // 重新加载数据
        
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
          error: result.error || '添加照片失败',
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

  // 删除照片
  const handleDeletePhoto = async (id: string) => {
    if (id.startsWith('default-')) return // 不能删除默认照片

    if (!confirm('确定要删除这张照片吗？')) return

    setState(prev => ({ ...prev, loading: true }))

    try {
      const result = await deletePhoto(id)

      if (result.success) {
        await loadPhotos() // 重新加载数据
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || '删除照片失败',
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
    loadPhotos()
  }

  return (
    <div className="w-full max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3 flex items-center justify-center gap-3">
            <FaImage className="text-pink-500" />
            我们的美好回忆
            {state.fallbackMode && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                本地模式
              </span>
            )}
          </h2>
          <p className="text-gray-600">记录每一个甜蜜的瞬间</p>
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
              <span className="text-blue-700">正在迁移照片到云端...</span>
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
            {showAddForm ? '取消' : '添加照片'}
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
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="照片链接 (例如: https://example.com/image.jpg)"
                  className="romantic-input w-full"
                  disabled={state.loading || state.migrating}
                />
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="照片描述（可选）"
                  className="romantic-input w-full"
                  maxLength={50}
                  disabled={state.loading || state.migrating}
                />
                <button 
                  onClick={addPhoto} 
                  disabled={state.loading || state.migrating}
                  className="romantic-button w-full disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {state.loading && <FaSpinner className="animate-spin" />}
                  确认添加
                </button>
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

        {/* 照片网格 */}
        {!state.loading && !state.migrating && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden group cursor-pointer relative"
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x400/FFB6C1/FFFFFF?text=💕'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 text-center font-medium">
                    {photo.caption}
                  </p>
                </div>
                {!photo.id.startsWith('default-') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo.id)
                    }}
                    disabled={state.loading}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 大图预览 Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <p className="text-white text-center mt-4 text-xl">
                {selectedPhoto.caption}
              </p>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
              >
                <FaTimes size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
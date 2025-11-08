'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaImage } from 'react-icons/fa'

interface Photo {
  id: string
  url: string
  caption: string
  createdAt: number
}

const STORAGE_KEY = 'love-photo-gallery'

// 默认占位照片
const DEFAULT_PHOTOS: Photo[] = [
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

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>(DEFAULT_PHOTOS)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const customPhotos: Photo[] = JSON.parse(stored)
        setPhotos([...DEFAULT_PHOTOS, ...customPhotos])
      }
    } catch (error) {
      console.error('Failed to load photos:', error)
    }
  }, [])

  const addPhoto = () => {
    const trimmedUrl = newPhotoUrl.trim()
    const trimmedCaption = newPhotoCaption.trim()

    if (!trimmedUrl) {
      alert('请输入照片链接')
      return
    }

    const newPhoto: Photo = {
      id: `custom-${Date.now()}`,
      url: trimmedUrl,
      caption: trimmedCaption || '美好回忆',
      createdAt: Date.now(),
    }

    const updatedPhotos = [...photos, newPhoto]
    setPhotos(updatedPhotos)

    // 保存到 localStorage（只保存自定义照片）
    const customPhotos = updatedPhotos.filter(p => p.id.startsWith('custom-'))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPhotos))
    } catch (error) {
      console.error('Failed to save photo:', error)
    }

    setNewPhotoUrl('')
    setNewPhotoCaption('')
    setShowAddForm(false)
  }

  const deletePhoto = (id: string) => {
    if (!id.startsWith('custom-')) return // 不能删除默认照片

    if (!confirm('确定要删除这张照片吗？')) return

    const updatedPhotos = photos.filter(p => p.id !== id)
    setPhotos(updatedPhotos)

    const customPhotos = updatedPhotos.filter(p => p.id.startsWith('custom-'))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPhotos))
    } catch (error) {
      console.error('Failed to delete photo:', error)
    }
  }

  if (!isClient) return null

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
          </h2>
          <p className="text-gray-600">记录每一个甜蜜的瞬间</p>
        </div>

        {/* 添加按钮 */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="romantic-button flex items-center gap-2 text-sm"
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
                />
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="照片描述（可选）"
                  className="romantic-input w-full"
                  maxLength={50}
                />
                <button onClick={addPhoto} className="romantic-button w-full">
                  确认添加
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 照片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
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
              {photo.id.startsWith('custom-') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePhoto(photo.id)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
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


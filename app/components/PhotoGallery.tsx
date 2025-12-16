'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaImage, FaLock, FaUpload, FaLink } from 'react-icons/fa'
import { 
  createPhoto, 
  getPhotos, 
  deletePhoto as deletePhotoAction 
} from '../actions/photos'
import PasswordModal from './PasswordModal'
import { useAuth } from '../hooks/useAuth'

import { LegacyPhoto } from '@/lib/types/database'

type Photo = LegacyPhoto & {
  isCustom: boolean
}



export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  
  const { isAuthenticated, login, extendSession } = useAuth()

  // 加载照片数据
  const loadPhotos = async () => {
    try {
      const result = await getPhotos({ limit: 50 })
      if (result.success && result.data) {
        // 转换 LegacyPhoto 为 Photo，添加 isCustom 字段
        const photos: Photo[] = result.data.map(photo => ({
          ...photo,
          isCustom: true, // 从数据库来的都是自定义照片
        }))
        setPhotos(photos)
      }
    } catch (error) {
      console.error('Failed to load photos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true)
      loadPhotos()
    }, 0)
    
    return () => clearTimeout(timer)
  }, [])

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件不能超过 5MB')
      return
    }

    setSelectedFile(file)
    
    // 创建预览URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // 将文件转换为 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const addPhoto = async () => {
    setUploading(true)
    
    try {
      let photoUrl = ''
      const trimmedCaption = newPhotoCaption.trim()

      if (uploadMethod === 'file' && selectedFile) {
        // 将文件转换为 Base64 URL
        photoUrl = await fileToBase64(selectedFile)
      } else if (uploadMethod === 'url') {
        const trimmedUrl = newPhotoUrl.trim()
        if (!trimmedUrl) {
          alert('请输入照片链接')
          return
        }
        photoUrl = trimmedUrl
      } else {
        alert('请选择照片或输入照片链接')
        return
      }

      const result = await createPhoto({
        url: photoUrl,
        caption: trimmedCaption || '美好回忆',
        isCustom: true,
      })

      if (result.success && result.data) {
        const newPhoto: Photo = {
          ...result.data,
          isCustom: true,
        }
        setPhotos(prev => [...prev, newPhoto])
        
        // 重置表单
        setNewPhotoUrl('')
        setNewPhotoCaption('')
        setSelectedFile(null)
        setPreviewUrl('')
        setShowAddForm(false)
        
        // 清理预览URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      } else {
        console.error('Photo creation failed:', result.error)
        alert(`添加照片失败：${result.error || '请重试'}`)
      }
    } catch (error) {
      console.error('Failed to add photo:', error)
      alert(`添加照片失败：${error instanceof Error ? error.message : '请重试'}`)
    } finally {
      setUploading(false)
    }
  }

  // 清理预览URL
  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    setSelectedFile(null)
  }

  const handleDeletePhoto = async (id: string, isCustom: boolean) => {
    if (!isCustom) return // 不能删除默认照片

    // 检查权限
    if (!isAuthenticated) {
      setPendingDeleteId(id)
      setShowPasswordModal(true)
      return
    }

    // 延长会话
    extendSession()

    if (!confirm('确定要删除这张照片吗？')) return

    try {
      const result = await deletePhotoAction(id)
      if (result.success) {
        setPhotos(prev => prev.filter(p => p.id !== id))
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('删除失败，请重试')
    }
  }

  const handlePasswordSuccess = () => {
    login()
    if (pendingDeleteId) {
      const photo = photos.find(p => p.id === pendingDeleteId)
      if (photo) {
        // 延迟执行删除，让用户看到认证成功
        setTimeout(() => {
          handleDeletePhoto(pendingDeleteId, photo.isCustom)
          setPendingDeleteId(null)
        }, 300)
      }
    }
  }

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false)
    setPendingDeleteId(null)
  }

  if (!isClient) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-400">加载照片中...</div>
      </div>
    )
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
              <div className="glass-card p-6 rounded-2xl space-y-6 max-w-2xl mx-auto">
                {/* 上传方式选择 */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => {
                      setUploadMethod('file')
                      clearPreview()
                      setNewPhotoUrl('')
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      uploadMethod === 'file'
                        ? 'bg-white text-pink-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FaUpload />
                    上传图片
                  </button>
                  <button
                    onClick={() => {
                      setUploadMethod('url')
                      clearPreview()
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      uploadMethod === 'url'
                        ? 'bg-white text-pink-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FaLink />
                    图片链接
                  </button>
                </div>

                {/* 文件上传区域 */}
                {uploadMethod === 'file' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <FaUpload className="text-3xl text-pink-400" />
                        <div>
                          <p className="text-gray-700 font-medium">点击选择图片</p>
                          <p className="text-sm text-gray-500 mt-1">
                            支持 JPG、PNG、GIF 格式，最大 5MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* 图片预览 */}
                    {previewUrl && (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="预览"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={clearPreview}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* URL 输入区域 */}
                {uploadMethod === 'url' && (
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="照片链接 (例如: https://example.com/image.jpg)"
                    className="romantic-input w-full"
                  />
                )}

                {/* 照片描述 */}
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="照片描述（可选）"
                  className="romantic-input w-full"
                  maxLength={50}
                />

                {/* 提交按钮 */}
                <button 
                  onClick={addPhoto} 
                  disabled={uploading || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !newPhotoUrl.trim())}
                  className="romantic-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '上传中...' : '确认添加'}
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
              {photo.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id, photo.isCustom)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title={isAuthenticated ? "删除照片" : "删除照片 (需要权限)"}
                >
                  {isAuthenticated ? <FaTimes size={12} /> : <FaLock size={12} />}
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

      {/* 权限验证模态框 */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSuccess={handlePasswordSuccess}
        title="删除权限验证"
        message="删除照片需要管理员权限，请输入密码"
      />
    </div>
  )
}


'use server'

import { revalidatePath } from 'next/cache'
import { repositories } from '@/lib/repositories'
import { 
  type ActionResult,
  type CreatePhotoInput,
  type UpdatePhotoInput,
  type LegacyPhoto,
  type QueryOptions,
  createSuccessResult,
  createErrorResult,
  validateCreatePhoto,
  validateUpdatePhoto,
  validateId,
  validateQueryOptions,
  photoToLegacy,
  photosToLegacy,
  handleDatabaseError
} from '@/lib/types/database'
// import { withErrorHandling } from './common'
// import { fallbackService } from '@/lib/error-handling/fallback-service'

// 安全的revalidatePath包装器
function safeRevalidatePath(path: string) {
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    try {
      revalidatePath(path)
    } catch (error) {
      // 在测试环境中忽略revalidatePath错误
      console.warn('revalidatePath failed (likely in test environment):', error)
    }
  }
}

// 创建照片
export async function createPhoto(data: CreatePhotoInput): Promise<ActionResult<LegacyPhoto>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedData = validateCreatePhoto(data)
    
    // 创建照片
    const photo = await repositories.photos.create(validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(photoToLegacy(photo))
  } catch (error) {
    console.error('Failed to create photo:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取所有照片
export async function getPhotos(options?: QueryOptions): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 获取照片列表
    const photos = await repositories.photos.findAll(validatedOptions)
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to get photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取自定义照片
export async function getCustomPhotos(options?: QueryOptions): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 获取自定义照片列表
    const photos = await repositories.photos.findCustomPhotos(validatedOptions)
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to get custom photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取默认照片
export async function getDefaultPhotos(options?: QueryOptions): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 获取默认照片列表
    const photos = await repositories.photos.findDefaultPhotos(validatedOptions)
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to get default photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取单个照片
export async function getPhoto(id: string): Promise<ActionResult<LegacyPhoto>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证ID
    const validatedId = validateId(id)
    
    // 获取照片
    const photo = await repositories.photos.findById(validatedId)
    
    if (!photo) {
      return createErrorResult('照片不存在', 'NOT_FOUND')
    }
    
    return createSuccessResult(photoToLegacy(photo))
  } catch (error) {
    console.error('Failed to get photo:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 更新照片
export async function updatePhoto(id: string, data: UpdatePhotoInput): Promise<ActionResult<LegacyPhoto>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedId = validateId(id)
    const validatedData = validateUpdatePhoto(data)
    
    // 更新照片
    const photo = await repositories.photos.update(validatedId, validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(photoToLegacy(photo))
  } catch (error) {
    console.error('Failed to update photo:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 删除照片
export async function deletePhoto(id: string): Promise<ActionResult<boolean>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证ID
    const validatedId = validateId(id)
    
    // 删除照片
    const deleted = await repositories.photos.delete(validatedId)
    
    if (!deleted) {
      return createErrorResult('照片不存在或删除失败', 'DELETE_FAILED')
    }
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(true)
  } catch (error) {
    console.error('Failed to delete photo:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取最近的照片
export async function getRecentPhotos(limit: number = 10): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取最近照片
    const photos = await repositories.photos.findRecent(limit)
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to get recent photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 搜索照片描述
export async function searchPhotos(searchTerm: string, options?: QueryOptions): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证查询参数
    const validatedOptions = options ? validateQueryOptions(options) : {}
    
    // 搜索照片
    const photos = await repositories.photos.searchByCaption(searchTerm, validatedOptions)
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to search photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 删除所有自定义照片
export async function deleteAllCustomPhotos(): Promise<ActionResult<number>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 删除所有自定义照片
    const deletedCount = await repositories.photos.deleteCustomPhotos()
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(deletedCount)
  } catch (error) {
    console.error('Failed to delete all custom photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 批量创建照片
export async function createManyPhotos(data: CreatePhotoInput[]): Promise<ActionResult<LegacyPhoto[]>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证输入数据
    const validatedData = data.map(item => validateCreatePhoto(item))
    
    // 批量创建照片
    const photos = await repositories.photos.createMany(validatedData)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(photosToLegacy(photos))
  } catch (error) {
    console.error('Failed to create many photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 批量删除照片
export async function deleteManyPhotos(ids: string[]): Promise<ActionResult<number>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 验证所有ID
    const validatedIds = ids.map(id => validateId(id))
    
    // 批量删除照片
    const deletedCount = await repositories.photos.deleteMany(validatedIds)
    
    // 重新验证相关页面
    safeRevalidatePath('/')
    
    return createSuccessResult(deletedCount)
  } catch (error) {
    console.error('Failed to delete many photos:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}

// 获取照片统计
export async function getPhotoStats(): Promise<ActionResult<{ 
  total: number
  custom: number
  default: number 
}>> {
  try {
    // 确保repositories已初始化
    if (!repositories.isInitialized()) {
      await repositories.initialize()
    }

    // 获取照片统计
    const [total, customCount, defaultCount] = await Promise.all([
      repositories.photos.count(),
      repositories.photos.countCustomPhotos(),
      repositories.photos.countDefaultPhotos(),
    ])
    
    return createSuccessResult({ 
      total, 
      custom: customCount, 
      default: defaultCount 
    })
  } catch (error) {
    console.error('Failed to get photo stats:', error)
    const dbError = handleDatabaseError(error)
    return createErrorResult(dbError.message, dbError.type)
  }
}
// Server Actions统一导出

// 留言相关的Server Actions
export {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  getRecentMessages,
  getMessagesByColor,
  searchMessages,
  getMessageStats,
  createManyMessages,
} from './messages'

// 照片相关的Server Actions
export {
  createPhoto,
  getPhotos,
  getCustomPhotos,
  getDefaultPhotos,
  getPhoto,
  updatePhoto,
  deletePhoto,
  getRecentPhotos,
  searchPhotos,
  deleteAllCustomPhotos,
  createManyPhotos,
  deleteManyPhotos,
  getPhotoStats,
} from './photos'

// 情话相关的Server Actions
export {
  createQuote,
  getQuotes,
  getQuote,
  deleteQuote,
  getRecentQuotes,
  getRandomQuotes,
  searchQuotes,
  deleteAllQuotes,
  createManyQuotes,
  deleteManyQuotes,
  getQuoteStats,
} from './quotes'

// 访问统计相关的Server Actions
export {
  recordVisit,
  getVisitStats,
  getVisitStatsWithCache,
} from './visits'

// 通用功能的Server Actions
export {
  withErrorHandling,
  healthCheck,
  getAllStats,
  initializeSystem,
  resetSystem,
  withRetry,
  processBatch,
  validateEnvironment,
} from './common'

// 类型导出
export type {
  ActionResult,
  CreateMessageInput,
  UpdateMessageInput,
  CreatePhotoInput,
  UpdatePhotoInput,
  CreateQuoteInput,
  LegacyMessage,
  LegacyPhoto,
  LegacyQuote,
  QueryOptions,
} from '@/lib/types/database'
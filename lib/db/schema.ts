import { pgTable, uuid, text, varchar, boolean, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Messages表 - 添加长度约束
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  content: text('content').notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#FFE4E1'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`NOW()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`NOW()`),
}, (table) => ({
  createdAtIdx: index('idx_messages_created_at').on(table.createdAt.desc()),
  // 添加内容长度约束
  contentLengthCheck: check('messages_content_length_check', sql`length(${table.content}) > 0 AND length(${table.content}) <= 200`),
  // 添加颜色格式约束
  colorFormatCheck: check('messages_color_format_check', sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`),
}))

// Photos表 - 添加URL和描述约束
export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  url: text('url').notNull(),
  caption: varchar('caption', { length: 50 }).default(''),
  isCustom: boolean('is_custom').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`NOW()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`NOW()`),
}, (table) => ({
  createdAtIdx: index('idx_photos_created_at').on(table.createdAt.desc()),
  isCustomIdx: index('idx_photos_is_custom').on(table.isCustom),
  // 添加URL格式约束（基本检查）
  urlNotEmptyCheck: check('photos_url_not_empty_check', sql`length(${table.url}) > 0`),
  // 添加描述长度约束
  captionLengthCheck: check('photos_caption_length_check', sql`length(${table.caption}) <= 50`),
}))

// Custom Quotes表 - 添加文本长度约束
export const customQuotes = pgTable('custom_quotes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`NOW()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`NOW()`),
}, (table) => ({
  createdAtIdx: index('idx_custom_quotes_created_at').on(table.createdAt.desc()),
  // 添加文本长度约束
  textLengthCheck: check('custom_quotes_text_length_check', sql`length(${table.text}) > 0 AND length(${table.text}) <= 200`),
}))

// Visits表 - 全局访问统计
export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar('session_id', { length: 64 }).notNull(), // 会话ID，防止重复计数
  userAgent: text('user_agent'), // 用户代理（可选）
  ipHash: varchar('ip_hash', { length: 64 }), // IP哈希（隐私保护）
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`NOW()`),
}, (table) => ({
  createdAtIdx: index('idx_visits_created_at').on(table.createdAt.desc()),
  sessionIdIdx: index('idx_visits_session_id').on(table.sessionId),
  // 确保同一会话ID不重复
  sessionIdUnique: index('idx_visits_session_unique').on(table.sessionId),
}))

// 导出表类型
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert

export type CustomQuote = typeof customQuotes.$inferSelect
export type NewCustomQuote = typeof customQuotes.$inferInsert

export type Visit = typeof visits.$inferSelect
export type NewVisit = typeof visits.$inferInsert
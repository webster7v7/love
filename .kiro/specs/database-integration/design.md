# 数据库集成设计文档

## 概述

本设计文档描述了将爱情主题网站从localStorage迁移到Neon PostgreSQL数据库的完整方案。系统将采用Next.js App Router架构，使用Server Actions进行数据库操作，确保数据的持久化存储和多设备同步。

## 架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Next.js Server │───▶│ Neon PostgreSQL │
│   Components    │    │    Actions      │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   localStorage  │    │   Validation    │    │   Connection    │
│   (Migration)   │    │   & Error       │    │     Pool        │
│                 │    │   Handling      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈
- **前端**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **后端**: Next.js 16 App Router, Server Actions
- **数据库**: Neon PostgreSQL
- **ORM**: Drizzle ORM (推荐用于Neon)
- **验证**: Zod
- **连接池**: @neondatabase/serverless

## 组件和接口

### 数据库连接层
```typescript
// lib/db/connection.ts
interface DatabaseConnection {
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>
}

// lib/db/config.ts
interface DatabaseConfig {
  connectionString: string
  ssl: boolean
  maxConnections: number
  idleTimeout: number
}
```

### 数据访问层 (Repository Pattern)
```typescript
// lib/repositories/base.ts
interface BaseRepository<T> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  findById(id: string): Promise<T | null>
  findAll(options?: QueryOptions): Promise<T[]>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
}

// lib/repositories/messages.ts
interface MessageRepository extends BaseRepository<Message> {
  findByDateRange(startDate: Date, endDate: Date): Promise<Message[]>
  findRecent(limit: number): Promise<Message[]>
}
```

### Server Actions接口
```typescript
// lib/actions/messages.ts
interface MessageActions {
  createMessage(data: CreateMessageData): Promise<ActionResult<Message>>
  updateMessage(id: string, data: UpdateMessageData): Promise<ActionResult<Message>>
  deleteMessage(id: string): Promise<ActionResult<boolean>>
  getMessages(): Promise<ActionResult<Message[]>>
}

// lib/actions/types.ts
interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}
```

## 数据模型

### 数据库表结构

#### Messages表
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 200),
  color VARCHAR(7) NOT NULL DEFAULT '#FFE4E1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### Photos表
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption VARCHAR(50) DEFAULT '',
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_is_custom ON photos(is_custom);
```

#### Custom_Quotes表
```sql
CREATE TABLE custom_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_quotes_created_at ON custom_quotes(created_at DESC);
```

### TypeScript类型定义
```typescript
// lib/types/database.ts
interface Message {
  id: string
  content: string
  color: string
  createdAt: Date
  updatedAt: Date
}

interface Photo {
  id: string
  url: string
  caption: string
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
}

interface CustomQuote {
  id: string
  text: string
  createdAt: Date
  updatedAt: Date
}

// 用于前端组件的类型（兼容现有代码）
interface LegacyMessage {
  id: string
  content: string
  date: string
  createdAt: number
  color: string
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性1：留言数据持久性
*对于任何*有效的留言数据，当保存到数据库后，后续查询应该能够检索到相同的内容、颜色和时间信息
**验证：需求 1.1**

### 属性2：留言CRUD操作一致性
*对于任何*留言记录，更新操作应该正确修改数据库中的对应记录，删除操作应该完全移除记录
**验证：需求 1.3, 1.4**

### 属性3：留言时间排序
*对于任何*留言查询操作，返回的结果应该按照创建时间正确排序
**验证：需求 1.2**

### 属性4：照片数据持久性和类型区分
*对于任何*照片记录，系统应该正确存储URL、描述和类型标记，并能够区分默认照片和自定义照片
**验证：需求 2.1, 2.2, 2.5**

### 属性5：自定义内容删除权限
*对于任何*标记为自定义的内容（照片、情话），删除操作应该成功移除记录，而默认内容不应被删除
**验证：需求 2.3, 3.3**

### 属性6：情话存储和显示
*对于任何*自定义情话，系统应该正确存储内容并标记为自定义类型，显示时应该正确替换昵称占位符
**验证：需求 3.1, 3.2, 3.5**

### 属性7：输入验证约束
*对于任何*用户输入，当违反长度限制或格式要求时，系统应该拒绝保存并返回具体的错误信息
**验证：需求 1.5, 2.4, 3.4, 7.1, 7.2**

### 属性8：数据库连接降级
*对于任何*数据库连接失败的情况，系统应该自动切换到localStorage模式并记录错误信息
**验证：需求 4.2**

### 属性9：连接重试机制
*对于任何*数据库连接超时，系统应该按照配置的重试策略自动重试，并记录重试次数
**验证：需求 4.4**

### 属性10：迁移数据完整性
*对于任何*localStorage中的现有数据，迁移到数据库后应该保持相同的内容，迁移完成后应该清除localStorage数据
**验证：需求 5.2, 5.3**

### 属性11：迁移错误恢复
*对于任何*迁移过程中的错误，系统应该保留原始localStorage数据并记录详细错误信息
**验证：需求 5.4**

### 属性12：分页查询限制
*对于任何*返回大量数据的查询，系统应该实现分页或数量限制以防止性能问题
**验证：需求 6.2**

### 属性13：并发操作安全性
*对于任何*并发的数据库操作，系统应该正确处理竞态条件，确保数据一致性不被破坏
**验证：需求 6.3**

### 属性14：网络错误重试
*对于任何*网络连接不稳定的情况，系统应该提供重试机制和用户友好的错误提示
**验证：需求 6.4**

### 属性15：数据库约束错误处理
*对于任何*数据库约束违反，系统应该捕获错误并提供用户友好的提示而不是技术错误信息
**验证：需求 7.3**

### 属性16：安全防护
*对于任何*用户输入，系统应该防止SQL注入和其他安全攻击，确保数据库操作的安全性
**验证：需求 7.5**

### 属性17：错误信息安全性
*对于任何*未预期的系统错误，系统应该记录详细信息用于调试，但只向用户返回安全的错误响应
**验证：需求 7.4**

## 错误处理

### 错误分类和处理策略

#### 数据库连接错误
```typescript
enum DatabaseErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  SSL_ERROR = 'SSL_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED'
}

interface ErrorHandler {
  handleConnectionError(error: DatabaseError): Promise<FallbackResponse>
  handleQueryError(error: QueryError): Promise<ErrorResponse>
  handleValidationError(error: ValidationError): ErrorResponse
}
```

#### 降级策略
1. **数据库不可用时**: 自动切换到localStorage模式
2. **部分功能失败时**: 显示错误提示但保持其他功能可用
3. **网络超时时**: 提供重试机制和用户友好的提示

#### 错误恢复机制
```typescript
interface RetryConfig {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

class DatabaseService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>
}
```

## 测试策略

### 双重测试方法

本项目将采用单元测试和属性测试相结合的方法：

- **单元测试**验证具体示例、边界情况和错误条件
- **属性测试**验证应该在所有输入中保持的通用属性
- 两者结合提供全面覆盖：单元测试捕获具体错误，属性测试验证一般正确性

### 单元测试策略

单元测试将覆盖：
- 数据库连接和配置
- Server Actions的具体行为
- 数据验证逻辑
- 错误处理路径
- 迁移逻辑的具体场景

### 属性测试策略

我们将使用**fast-check**作为属性测试库，配置每个属性测试运行最少100次迭代。

每个属性测试必须：
- 使用注释明确引用设计文档中的正确性属性
- 使用格式：'**Feature: database-integration, Property {number}: {property_text}**'
- 实现设计文档中定义的单个正确性属性

属性测试将验证：
- 数据持久性属性（保存后能检索）
- 数据完整性约束（违反约束时正确拒绝）
- 迁移一致性（localStorage到数据库的数据保持一致）
- 并发安全性（多个操作不会破坏数据一致性）
- 错误处理完整性（失败时返回有意义的错误）
- 连接恢复能力（连接失败时的恢复机制）

### 测试环境配置

```typescript
// 测试数据库配置
interface TestDatabaseConfig {
  useInMemoryDatabase: boolean
  seedData: boolean
  cleanupAfterTests: boolean
}

// 属性测试生成器
interface TestGenerators {
  validMessage(): Arbitrary<CreateMessageData>
  invalidMessage(): Arbitrary<InvalidMessageData>
  validPhoto(): Arbitrary<CreatePhotoData>
  validQuote(): Arbitrary<CreateQuoteData>
}
```
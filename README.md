# 💕 爱情网站项目

一个浪漫的爱情主题网站，包含动画效果、留言板、照片墙、情话展示等功能。

## 🌟 项目特色

- 💖 **浪漫动画**: 飘落的爱心和星星动画效果
- ⏰ **倒计时器**: 显示相识时间的实时倒计时
- 💌 **留言板**: 可以添加和管理爱情留言
- 📸 **照片墙**: 上传和展示美好回忆照片
- 💭 **情话墙**: 自动轮播和自定义情话
- 📊 **访问统计**: 全局访问量统计（所有访问者共享）
- 📱 **响应式设计**: 完美适配手机和电脑

## 🚀 技术栈

- **前端**: Next.js 15, React 18, TypeScript
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion
- **数据库**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **部署**: Vercel
- **图标**: React Icons

## 📦 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
复制 `.env.deployment.template` 为 `.env.local` 并配置：
```bash
DATABASE_URL=your_neon_database_url
NODE_ENV=development
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看网站

### 数据库设置
```bash
# 生成数据库迁移
npm run db:generate

# 推送到数据库
npm run db:push

# 初始化数据库
npm run db:init
```

## 🎯 主要功能

### 💖 动画效果
- 飘落的爱心动画
- 闪烁的星星效果
- 鼠标跟随粒子效果
- 平滑的页面过渡动画

### 📝 内容管理
- **留言板**: 添加、编辑、删除留言，支持颜色选择
- **照片墙**: 上传照片，添加描述，支持自定义和默认照片
- **情话墙**: 自动轮播情话，支持添加自定义情话

### 📊 数据统计
- **访问统计**: 今日/本周/本月/总计访问量
- **全局统计**: 所有访问者共享的统计数据
- **防重复计数**: 同一会话不重复统计

## 🚀 部署指南

### Vercel 部署（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "🎉 爱情网站完成"
git push origin main
```

2. **连接 Vercel**
- 访问 [vercel.com](https://vercel.com)
- Import Project 选择你的 GitHub 仓库
- 配置环境变量 `DATABASE_URL`
- 点击 Deploy

3. **环境变量配置**
在 Vercel Dashboard 设置：
```
DATABASE_URL=your_neon_database_url
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 其他平台部署
- 构建命令: `npm run build`
- 启动命令: `npm start`
- Node.js 版本: 18+

## 📁 项目结构

```
├── app/                    # Next.js 应用目录
│   ├── components/         # React 组件
│   ├── actions/           # Server Actions
│   ├── data/              # 静态数据
│   └── utils/             # 工具函数
├── lib/                   # 核心库
│   ├── db/                # 数据库配置和 Schema
│   ├── repositories/      # 数据访问层
│   ├── types/             # TypeScript 类型定义
│   ├── error-handling/    # 错误处理
│   ├── migration/         # 数据迁移
│   └── performance/       # 性能优化
├── docs/                  # 项目文档
├── scripts/               # 工具脚本
└── public/                # 静态资源
```

## 🛠️ 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:generate      # 生成数据库迁移
npm run db:push          # 推送到数据库
npm run db:studio        # 打开数据库管理界面
npm run db:status        # 检查数据库状态

# 检查和验证
npm run lint             # 代码检查
npm run validate-env     # 验证环境变量
npm run production:check # 生产环境检查
```

## 📊 项目状态

- ✅ **核心功能**: 完全实现
- ✅ **数据库集成**: Neon PostgreSQL
- ✅ **访问统计**: 全局统计已实现
- ✅ **响应式设计**: 移动端适配完成
- ✅ **性能优化**: 已优化
- ✅ **部署就绪**: 可直接部署到 Vercel

## 🎨 自定义配置

### 修改开始时间
在 `app/components/CountdownTimer.tsx` 中修改：
```typescript
const START_DATE = new Date('2025-02-04T20:05:00').getTime()
```

### 修改昵称
在 `app/data/nicknames.ts` 中添加或修改昵称。

### 修改默认情话
在 `app/data/loveQuotes.ts` 中添加或修改情话内容。

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 是否正确
   - 确认 Neon 数据库状态正常

2. **构建失败**
   - 运行 `npm run build` 检查错误
   - 确保所有依赖已正确安装

3. **访问统计不工作**
   - 检查数据库连接
   - 确认 visits 表已创建

### 获取帮助

- 查看 `docs/` 目录中的详细文档
- 运行 `npm run production:check` 进行系统检查

## 💖 致谢

这个项目是用爱制作的，希望能为你们的爱情故事增添美好的回忆。

---

**Made with ❤️ for love**
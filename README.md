# 💕 浪漫网页 - 给我最爱的你

一个充满爱意的个人网页，记录你们之间的美好时光。

![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

## ✨ 功能特性

### 🎨 视觉效果
- 🌸 **浮动爱心** - 浪漫的爱心雨动画
- ⭐ **闪烁星星** - 温馨的星光特效
- 🎆 **鼠标粒子** - 跟随鼠标的彩色粒子
- 🌈 **渐变配色** - 粉紫色系梦幻主题

### ⏰ 倒计时模块
- 📅 记录你们相识的每一天、小时、分钟、秒
- 🔢 单数字流畅动画（像手机时钟一样）
- 💫 Spring 动画效果，自然流畅

### 💬 情话墙
- 📝 **520 条精选情话** - 每 5 秒自动切换
- ✍️ **自定义情话** - 添加专属于你们的话语
- 🎲 **随机昵称** - 宝宝、乖乖、小晴妈咪（随机切换）
- 🗑️ **管理功能** - 可编辑和删除自定义情话

### 📸 照片墙
- 🖼️ **照片展示** - 上传和展示美好回忆
- 🔍 **大图预览** - 点击查看大图
- 📝 **照片说明** - 为每张照片添加描述
- 💾 **本地存储** - 数据保存在浏览器

### 📋 留言板
- 📌 **便签样式** - 多彩的留言卡片
- ✏️ **随时记录** - 添加每天的心情和想法
- 🎨 **随机颜色** - 每条留言自动分配颜色
- 🔄 **编辑删除** - 灵活管理留言内容

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## 📦 部署到 Vercel

### 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/仓库名)

### 手动部署

详细步骤请查看：
- 📖 [完整部署指南](./DEPLOYMENT.md)
- ✅ [部署清单](./VERCEL-CHECKLIST.md)

**简易步骤：**
1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 点击 Deploy
4. ✅ 完成！

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.0.1 | React 框架 |
| **React** | 19.2.0 | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 样式框架 |
| **Framer Motion** | 11.18.2 | 动画库 |
| **React Icons** | 5.5.0 | 图标库 |

---

## 📂 项目结构

```
love/
├── app/
│   ├── components/          # React 组件
│   │   ├── CountdownTimer.tsx
│   │   ├── FloatingHearts.tsx
│   │   ├── FloatingStars.tsx
│   │   ├── LoveQuotes.tsx
│   │   ├── MessageBoard.tsx
│   │   ├── MouseParticles.tsx
│   │   └── PhotoGallery.tsx
│   ├── data/               # 数据文件
│   │   ├── loveQuotes.ts   # 520 条情话
│   │   └── nicknames.ts    # 昵称列表
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 布局组件
│   └── page.tsx            # 首页
├── public/                 # 静态资源
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 💾 数据存储

### 本地存储（localStorage）
- ✅ 自定义情话
- ✅ 上传的照片
- ✅ 留言板内容

### 优点
- 🚀 无需后端服务器
- 💸 完全免费
- 🔒 数据私密安全
- ⚡ 访问速度快

### 注意
- 数据保存在用户浏览器中
- 清除浏览器数据会丢失自定义内容
- 建议定期截图备份重要内容

---

## 🎯 自定义配置

### 修改相识时间
编辑 `app/components/CountdownTimer.tsx`：
```typescript
const START_DATE = new Date('2025-02-04T20:05:00').getTime()
// 改为你们的相识时间
```

### 修改昵称列表
编辑 `app/data/nicknames.ts`：
```typescript
export const nicknames = [
  '宝宝',
  '乖乖',
  '小晴妈咪',
  // 添加更多昵称
]
```

### 修改情话内容
编辑 `app/data/loveQuotes.ts`：
```typescript
export const loveQuotes = [
  '你的情话...',
  // 添加或修改
]
```

---

## 📱 响应式设计

- ✅ 桌面端（1920x1080+）
- ✅ 笔记本（1366x768+）
- ✅ 平板（768x1024）
- ✅ 手机（375x667+）

---

## 🌟 未来计划

- [ ] PWA 支持（离线访问）
- [ ] 导出数据功能（JSON/PDF）
- [ ] 更多动画主题
- [ ] 音乐播放器
- [ ] 情侣日历
- [ ] 纪念日提醒

---

## 📄 许可证

MIT License - 自由使用和修改

---

## 💖 致谢

感谢所有为爱付出的人们。

---

**Made with ❤️ for the one you love**

> *"因为有你陪着身边，我感到很幸福"*

# 自律目标监控小程序 - 开发指南

## 📋 项目概述

### 应用定位

这是一个支持社交群组功能的自律目标监控小程序，帮助用户通过群组互动和好友分享来保持自律习惯。应用强调社交性、实时性和互动性，让用户可以和朋友一起监督、激励、分享自律进度。

### 核心价值

- **社交驱动**: 通过群组和好友圈增强用户粘性
- **实时同步**: 所有数据实时共享，好友可以看到彼此的进度
- **游戏化**: 通过打卡、连胜、活动比赛等机制提升参与度
- **数据可视化**: 清晰展示个人和群组的完成情况

---

## 🎯 功能模块

### 1. 首页（Home）

**路径**: `/`

**功能**:

- 展示今日所有目标和打卡状态
- 快速打卡功能，支持添加心情和备注
- 打卡时可选择分享到多个群组
- 显示当前连胜天数和完成率
- 展示今日群组动态预览

**核心组件**:

- 目标卡片列表（含打卡按钮）
- 打卡弹窗（支持多群组选择）
- 统计数据卡片
- 每日励志语

### 2. 目标管理（Goals）

**路径**: `/goals`

**功能**:

- 创建新目标（标题、描述、图标、目标天数、分类）
- 查看所有目标列表
- 编辑和删除目标
- 查看每个目标的历史打卡记录
- 目标分类：健康、学习、工作、生活、通用

**数据结构**:

```typescript
interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  targetDays: number;
  category:
    | "health"
    | "study"
    | "work"
    | "lifestyle"
    | "general";
  createdAt: string;
}
```

### 3. 群组功能（Groups）

**路径**: `/groups`

**功能**:

- 浏览所有已加入的群组
- 创建新群组（名称、描述、头像、分类）
- 加入/退出群组
- 查看群组成员列表
- 快速进入群组详情

**数据结构**:

```typescript
interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string; // emoji
  creatorId: string;
  memberIds: string[];
  createdAt: string;
  category:
    | "health"
    | "study"
    | "work"
    | "lifestyle"
    | "general";
}
```

### 4. 群组详情（GroupDetail）

**路径**: `/groups/:groupId`

这是应用最复杂、最具交互性的模块，包含四个主要标签页：

#### 4.1 群聊（Chat）

**功能**:

- 实时群组聊天
- 三种消息类型：
  - 文本消息：普通聊天
  - 打卡消息：自动分享打卡信息（含目标、连胜数）
  - 系统消息：加入、退出、活动通知
- 头像可点击跳转到用户主页
- 消息时间戳显示

**消息数据结构**:

```typescript
interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: "text" | "checkin" | "system";
  metadata?: {
    goalTitle?: string;
    goalIcon?: string;
    streak?: number;
  };
  timestamp: string;
}
```

#### 4.2 成员（Members）

**功能**:

- 展示所有群组成员
- 显示每个成员的头像、昵称、个人签名
- 点击成员可跳转到用户主页
- 显示群组创建者标识

#### 4.3 活动（Challenges）

**功能**:

- 所有群组成员都可以发起活动
- 三种活动类型：
  - **总打卡数**（total_checkins）：比拼打卡次数
  - **最长连胜**（streak）：比拼连续打卡天数
  - **完成率**（consistency）：比拼完成百分比
- 活动状态：即将开始、进行中、已结束
- 参与/退出活动
- 实时排行榜
- 奖励设置

**活动数据结构**:

```typescript
interface GroupChallenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: "total_checkins" | "streak" | "consistency";
  startDate: string;
  endDate: string;
  creatorId: string;
  participants: string[];
  prizes?: string[];
  status: "upcoming" | "active" | "completed";
}
```

#### 4.4 数据（Stats）

**功能**:

- 展示每位组员当日完成目标数据
- 实时汇总统计
- 按完成数量排序
- 显示每个成员的：
  - 完成目标数 / 总目标数
  - 完成率
  - 当前连胜天数
- 数据可视化（进度条）

**统计数据结构**:

```typescript
interface MemberDailyStats {
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  completedCount: number;
  totalGoals: number;
  completionRate: number;
  currentStreak: number;
}
```

### 5. 好友圈（Social）

**路径**: `/social`

**功能**:

- 查看所有好友的打卡分享
- 显示打卡目标、连胜数、心情、备注
- 点赞功能
- 评论功能
- 时间线展示
- 用户头像可跳转到用户主页

**社交动态数据结构**:

```typescript
interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalTitle: string;
  checkInStreak: number;
  note: string;
  mood: "great" | "good" | "okay";
  timestamp: string;
  likes: string[];
  comments: Comment[];
}
```

### 6. 个人中心（Profile）

**路径**: `/profile`

**功能**:

- 查看个人信息（头像、昵称、签名）
- 编辑个人资料
- 查看个人统计数据：
  - 总打卡天数
  - 当前连胜
  - 完成率
- 查看个人所有目标
- 查看个人历史打卡记录

### 7. 用户主页（UserProfile）

**路径**: `/user/:userId`

**功能**:

- 查看其他用户的公开信息
- 展示用户的目标列表
- 显示用户的打卡统计
- 查看用户最近的打卡动态
- 从群聊、好友圈等处点击头像可跳转

---

## 🏗️ 技术架构

### 前端技术栈

#### 核心框架

- **React 18.3.1**: 使用函数组件和 Hooks
- **TypeScript**: 类型安全
- **Vite 6.3.5**: 构建工具

#### 路由

- **react-router 7.13.0**: 客户端路由
- 路由配置位于 `/src/app/routes.tsx`

#### UI 组件库

- **shadcn/ui**: 基于 Radix UI 的组件库
  - 位于 `/src/app/components/ui/`
  - 主要使用：Button, Dialog, Tabs, Card, Avatar, Badge, ScrollArea
- **Material-UI (MUI) 7.3.5**: 部分组件使用
- **Lucide React**: 图标库

#### 样式

- **Tailwind CSS 4.1.12**: 实用优先的 CSS 框架
- **@tailwindcss/vite**: Vite 插件
- 全局样式：`/src/styles/theme.css`
- 自定义样式：`/src/styles/index.css`

#### 动画和交互

- **Motion (Framer Motion) 12.23.24**: 动画库
  - 导入方式：`import { motion } from 'motion/react'`
- **Sonner**: Toast 通知

#### 其他工具库

- **date-fns 3.6.0**: 日期处理
- **clsx + tailwind-merge**: 类名合并
- **react-hook-form 7.55.0**: 表单处理

### 数据管理

#### 当前实现（模拟数据）

- 所有数据存储在 `/src/app/data/mockData.ts`
- 使用内存状态管理（JavaScript 对象）
- 两个主要数据存储：
  - `dataStore`: 目标、打卡、社交相关
  - `groupStore`: 群组、消息、活动、统计相关

#### 数据存储函数

```typescript
// 目标相关
dataStore.getGoals()
dataStore.addGoal(goal)
dataStore.updateGoal(id, updates)
dataStore.deleteGoal(id)

// 打卡相关
dataStore.getCheckIns(userId?, goalId?)
dataStore.addCheckIn(checkIn)

// 社交相关
dataStore.getSocialPosts()
dataStore.likePost(postId, userId)
dataStore.addComment(postId, comment)

// 群组相关
groupStore.getGroups()
groupStore.createGroup(group)
groupStore.joinGroup(groupId, userId)
groupStore.leaveGroup(groupId, userId)

// 消息相关
groupStore.getGroupMessages(groupId)
groupStore.sendMessage(message)
groupStore.shareCheckInToGroup(groupId, checkIn)

// 活动相关
groupStore.getGroupChallenges(groupId)
groupStore.createChallenge(challenge)
groupStore.joinChallenge(challengeId, userId)
groupStore.getChallengeLeaderboard(challengeId)

// 统计相关
groupStore.getGroupDailyStats(groupId, date)
```

### 后端架构（待实现）

#### Supabase 集成

- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **实时订阅**: Supabase Realtime
- **边缘函数**: Supabase Edge Functions

#### 服务端代码

- 位置：`/supabase/functions/server/`
- 主文件：`/supabase/functions/server/index.tsx`
- KV 存储工具：`/supabase/functions/server/kv_store.tsx`（受保护）

#### API 端点设计（待实现）

所有端点前缀：`/make-server-129677f0`

**认证相关**:

- `POST /signup`: 用户注册
- `POST /signin`: 用户登录（由 Supabase 处理）
- `GET /session`: 获取当前会话

**用户相关**:

- `GET /users/:userId`: 获取用户信息
- `PUT /users/:userId`: 更新用户信息

**目标相关**:

- `GET /goals`: 获取用户所有目标
- `POST /goals`: 创建新目标
- `PUT /goals/:goalId`: 更新目标
- `DELETE /goals/:goalId`: 删除目标

**打卡相关**:

- `GET /checkins`: 获取打卡记录
- `POST /checkins`: 创建打卡
- `POST /checkins/share`: 分享打卡到群组

**群组相关**:

- `GET /groups`: 获取用户群组
- `POST /groups`: 创建群组
- `POST /groups/:groupId/join`: 加入群组
- `POST /groups/:groupId/leave`: 退出群组
- `GET /groups/:groupId/members`: 获取成员列表
- `GET /groups/:groupId/stats`: 获取群组统计

**消息相关**:

- `GET /groups/:groupId/messages`: 获取群组消息
- `POST /groups/:groupId/messages`: 发送消息
- WebSocket/Realtime 订阅用于实时消息

**活动相关**:

- `GET /groups/:groupId/challenges`: 获取群组活动
- `POST /challenges`: 创建活动
- `POST /challenges/:challengeId/join`: 参加活动
- `GET /challenges/:challengeId/leaderboard`: 获取排行榜

**社交相关**:

- `GET /social/posts`: 获取好友圈动态
- `POST /posts/:postId/like`: 点赞
- `POST /posts/:postId/comments`: 评论

---

## 📐 文件结构

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # 应用入口
│   │   ├── routes.tsx             # 路由配置
│   │   ├── types.ts               # TypeScript 类型定义
│   │   ├── components/
│   │   │   ├── BottomNav.tsx      # 底部导航栏
│   │   │   ├── figma/             # Figma 相关组件
│   │   │   └── ui/                # shadcn/ui 组件库
│   │   ├── data/
│   │   │   └── mockData.ts        # 模拟数据和数据存储
│   │   └── pages/
│   │       ├── Home.tsx           # 首页
│   │       ├── Goals.tsx          # 目标管理页
│   │       ├── Groups.tsx         # 群组列表页
│   │       ├── GroupDetail.tsx    # 群组详情页
│   │       ├── Social.tsx         # 好友圈页
│   │       ├── Profile.tsx        # 个人中心页
│   │       └── UserProfile.tsx    # 用户主页
│   └── styles/
│       ├── index.css              # 全局样式入口
│       ├── theme.css              # 主题变量
│       ├── tailwind.css           # Tailwind 配置
│       └── fonts.css              # 字体配置
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx          # 服务端入口
│           └── kv_store.tsx       # KV 存储工具（受保护）
├── utils/
│   └── supabase/
│       └── info.tsx               # Supabase 配置信息
├── guidelines/
│   └── Guidelines.md              # 本文件
├── package.json                    # 依赖配置
├── vite.config.ts                 # Vite 配置
└── README.md                       # 项目说明
```

---

## 🎨 设计规范

### 色彩系统

使用 Tailwind CSS 默认调色板 + 自定义主题色（定义在 `theme.css`）

**主要颜色用途**:

- **Primary**: 主要操作按钮、强调元素
- **Success**: 完成状态、打卡成功
- **Warning**: 提醒、即将到期
- **Destructive**: 删除操作、错误状态
- **Muted**: 次要信息、背景

### 组件规范

#### 按钮（Button）

- **Primary**: 主要操作（打卡、创建、保存）
- **Secondary**: 次要操作（取消、返回）
- **Outline**: 可选操作（加入群组、参加活动）
- **Ghost**: 图标按钮、链接式按钮

#### 卡片（Card）

- 使用 shadcn Card 组件
- 圆角：`rounded-lg`
- 阴影：`shadow-sm`
- 边框：`border`

#### 头像（Avatar）

- 使用 shadcn Avatar 组件
- 尺寸规范：
  - 小：`w-8 h-8`
  - 中：`w-12 h-12`
  - 大：`w-20 h-20`

#### 徽章（Badge）

- 用于状态标识：活动状态、分类标签
- 变体：`default`, `secondary`, `outline`, `destructive`

### 布局规范

#### 移动优先

- 默认适配移动端
- 使用响应式断点：`sm:`, `md:`, `lg:`, `xl:`

#### 间距系统

- 小间距：`gap-2`, `p-2`, `m-2`
- 中间距：`gap-4`, `p-4`, `m-4`
- 大间距：`gap-6`, `p-6`, `m-6`

#### 底部导航

- 固定在底部：`fixed bottom-0`
- 五个导航项：首页、目标、群组、好友圈、我的
- 活动项高亮显示

---

## 💾 数据模型

### 核心实体

#### User（用户）

```typescript
interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  email?: string;
  createdAt?: string;
}
```

#### Goal（目标）

```typescript
interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetDays: number;
  category:
    | "health"
    | "study"
    | "work"
    | "lifestyle"
    | "general";
  createdAt: string;
  userId?: string; // 后端实现时添加
}
```

#### CheckIn（打卡记录）

```typescript
interface CheckIn {
  id: string;
  goalId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
  mood?: "great" | "good" | "okay";
  timestamp: string; // ISO 8601
  sharedGroupIds?: string[]; // 分享到的群组
}
```

#### Group（群组）

```typescript
interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
  category:
    | "health"
    | "study"
    | "work"
    | "lifestyle"
    | "general";
}
```

#### GroupMessage（群组消息）

```typescript
interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: "text" | "checkin" | "system";
  metadata?: {
    goalTitle?: string;
    goalIcon?: string;
    streak?: number;
  };
  timestamp: string;
}
```

#### GroupChallenge（群组活动）

```typescript
interface GroupChallenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: "total_checkins" | "streak" | "consistency";
  startDate: string;
  endDate: string;
  creatorId: string;
  participants: string[];
  prizes?: string[];
  status: "upcoming" | "active" | "completed";
}
```

#### SocialPost（社交动态）

```typescript
interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalTitle: string;
  checkInStreak: number;
  note: string;
  mood: "great" | "good" | "okay";
  timestamp: string;
  likes: string[];
  comments: Comment[];
}
```

#### Comment（评论）

```typescript
interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}
```

#### MemberDailyStats（成员每日统计）

```typescript
interface MemberDailyStats {
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  completedCount: number;
  totalGoals: number;
  completionRate: number;
  currentStreak: number;
}
```

---

## 🔄 业务逻辑

### 打卡流程

1. 用户在首页点击目标的"打卡"按钮
2. 弹出打卡弹窗，可选择：
   - 心情（great/good/okay）
   - 备注文字
   - 分享到的群组（多选）
3. 确认后：
   - 创建 CheckIn 记录
   - 如果有备注，自动创建 SocialPost
   - 对每个选中的群组，创建 GroupMessage（类型为 checkin）
   - 更新连胜数据
4. 显示成功提示

### 连胜计算逻辑

从今天开始往前查找：

- 如果今天有打卡，streak = 1
- 继续查找昨天、前天...
- 连续的每一天 streak +1
- 遇到中断日期则停止
- 返回最终 streak 值

### 活动排行榜计算

#### 总打卡数（total_checkins）

- 统计活动期间内的所有完成打卡数
- score = checkIns.length

#### 最长连胜（streak）

- 统计活动期间内的最长连续打卡天数
- 需要计算所有连续区间，取最大值

#### 完成率（consistency）

- 计算打卡天数占活动总天数的百分比
- score = (uniqueCheckInDays / totalDays) \* 100

### 群组统计计算

每个成员的当日统计：

- **completedCount**: 当天完成的目标数
- **totalGoals**: 用户的总目标数
- **completionRate**: completedCount / totalGoals \* 100
- **currentStreak**: 当前连胜天数（全局，不限于群组）

按 completedCount 降序排列

---

## 🚀 待实现功能

### 1. 用户认证系统（优先级：高）

（**revise： 注册与登录功能优先考虑创建符合中国大陆Wechat微信小程序模式的注册/登录模式：如关联微信号直接登录或中国大陆手机-验证码一键式注册/登录）

#### 注册功能

- 创建注册页面：`/signup`
- 表单字段：用户名、邮箱、密码、确认密码
- 使用 Supabase Auth 的 `createUser` API
- 由于未配置邮件服务器，需设置 `email_confirm: true`

#### 登录功能

- 创建登录页面：`/login`
- 表单字段：邮箱、密码
- 使用 Supabase Auth 的 `signInWithPassword` API
- 登录成功后保存 access_token

#### 会话管理

- 检查用户是否已登录：`getSession()`
- 如果有 session，自动登录
- 退出登录：`signOut()`

#### 路由保护

- 创建 ProtectedRoute 组件
- 未登录用户自动重定向到登录页
- 登录后重定向到首页

#### 实现步骤

1. 在 `/supabase/functions/server/index.tsx` 创建 `/signup` 端点
2. 创建 `/src/app/pages/Login.tsx` 和 `/src/app/pages/Signup.tsx`
3. 创建 `/src/app/components/ProtectedRoute.tsx`
4. 更新 `/src/app/routes.tsx` 添加路由保护
5. 创建 AuthContext 管理全局认证状态
6. 更新 mockData 中的 currentUser 为实际登录用户

### 2. 后端数据持久化（优先级：高）

#### 数据库设计

使用 Supabase KV Store 或创建专用表：

**表结构建议**（如需扩展）：

- `users`: 用户信息
- `goals`: 目标
- `checkins`: 打卡记录
- `groups`: 群组
- `group_members`: 群组成员关系
- `group_messages`: 群组消息
- `group_challenges`: 群组活动
- `challenge_participants`: 活动参与者
- `social_posts`: 社交动态
- `comments`: 评论

**注意**：

- 不要编写 migration 文件或 DDL 语句
- 优先使用现有的 KV Store（`/supabase/functions/server/kv_store.tsx`）
- KV Store 足够灵活，适合大多数原型需求

#### API 实现

- 将 mockData 中的所有函数改为 API 调用
- 使用 fetch 调用后端端点
- 添加错误处理和加载状态
- 使用 React Query 或 SWR 进行数据缓存（可选）

### 3. 实时同步（优先级：中）

#### Supabase Realtime

- 订阅群组消息更新
- 订阅群组成员统计更新
- 订阅好友圈新动态

#### 实现方式

```typescript
// 示例：订阅群组消息
const channel = supabase
  .channel(`group-${groupId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "group_messages",
    },
    (payload) => {
      // 更新本地状态
    },
  )
  .subscribe();
```

### 4. 通知系统（优先级：低）

#### 通知类型

- 好友打卡提醒
- 群组新消息
- 活动开始/结束
- 有人@我
- 点赞和评论通知

#### 实现方式

- 使用 Sonner toast 显示应用内通知
- 可选：集成浏览器推送通知 API

### 5. 数据分析和图表（优先级：低）

#### 个人统计

- 打卡日历热力图
- 目标完成趋势图
- 各分类目标占比饼图

#### 群组统计

- 群组活跃度趋势
- 成员排行榜历史
- 活动完成情况统计

#### 使用库

- **Recharts**: 已安装，用于图表展示
- 位置：个人中心、群组详情-数据标签页

### 6. 搜索和筛选（优先级：低）

#### 功能

- 搜索群组
- 筛选目标（按分类、状态）
- 搜索好友
- 筛选好友圈动态（按用户、目标）

### 7. 图片上传（优先级：低）

#### 使用场景

- 用户头像上传
- 群组头像上传
- 打卡图片分享

#### 实现方式

- 使用 Supabase Storage
- 创建私有 bucket：`make-129677f0-images`
- 使用 createSignedUrl 生成临时访问链接

---

## 📝 开发注意事项

### 代码规范

#### TypeScript

- 所有组件和函数必须有明确的类型定义
- 避免使用 `any`，优先使用具体类型或 `unknown`
- 接口定义统一放在 `/src/app/types.ts`

#### React

- 优先使用函数组件和 Hooks
- 使用 `React.memo` 优化性能（需要时）
- 避免在组件内定义函数，提取到外部或使用 `useCallback`

#### 样式

- 优先使用 Tailwind 类名
- 避免内联样式（除非必要）
- 使用语义化的类名组合
- 响应式设计使用断点前缀

#### 文件组织

- 每个页面一个文件
- 复杂组件拆分成子组件
- 工具函数放在独立文件
- 保持文件小于 500 行（建议）

### 性能优化

#### 列表渲染

- 使用唯一且稳定的 `key` prop
- 避免使用数组索引作为 key
- 考虑使用虚拟滚动（如 react-window）处理长列表

#### 图片优化

- 使用适当的图片尺寸
- 使用 ImageWithFallback 组件
- 考虑懒加载（React.lazy）

#### 数据获取

- 避免过度获取数据
- 使用分页或无限滚动
- 缓存已获取的数据

### 错误处理

#### API 调用

- 所有 API 调用必须包含 try-catch
- 使用 toast 显示用户友好的错误信息
- 记录详细错误到 console

#### 表单验证

- 使用 react-hook-form 进行表单管理
- 客户端和服务端都要验证
- 显示清晰的验证错误信息

### 测试策略（未实现）

#### 单元测试

- 工具函数测试
- 数据计算逻辑测试（连胜、统计等）

#### 集成测试

- 关键用户流程测试
- API 端点测试

#### E2E 测试

- 主要用户旅程
- 跨页面交互

---

## 🔐 安全考虑

### 认证和授权

- 所有需要认证的路由都要保护
- 服务端验证用户身份：`getUser(accessToken)`
- 不要在客户端存储敏感信息

### 数据访问控制

- 用户只能访问自己的数据
- 群组数据只对成员可见
- 服务端必须验证权限

### API 密钥

- `SUPABASE_SERVICE_ROLE_KEY` 只能在服务端使用
- 客户端只使用 `SUPABASE_ANON_KEY`
- 使用环境变量存储密钥

### 输入验证

- 所有用户输入必须验证和清理
- 防止 XSS 攻击
- 防止 SQL 注入（使用参数化查询）

---

## 🎯 项目里程碑

### 阶段一：核心功能（已完成 ✅）

- [x] 基础页面结构
- [x] 目标管理功能
- [x] 打卡功能
- [x] 群组功能
- [x] 群组详情（聊天、成员、活动、统计）
- [x] 好友圈功能
- [x] 用户主页
- [x] 模拟数据系统
- [x] UI 组件库集成
- [x] 响应式布局

### 阶段二：用户系统（待实现 🚧）

- [ ] 用户注册
- [ ] 用户登录
- [ ] 会话管理
- [ ] 路由保护
- [ ] 个人资料编辑

### 阶段三：后端集成（进行中 🚧）

- [x] Supabase 配置（KV Store 已就绪）
- [x] API 端点实现（`/supabase/functions/server/index.tsx` + `store.ts`）
- [x] 数据持久化（基于 KV Store：users、goals、checkins、groups、messages、challenges、social_posts）
- [x] 前端 API 客户端（`/src/app/data/apiClient.ts`，可通过 `VITE_API_BASE_URL` 与 `setAuthToken`/`setDevUserId` 对接后端）
- [ ] 前端全面切换为 API 调用（当前仍默认使用 mockData；接入时改为调用 apiClient 并处理异步与认证）
- [ ] 错误处理与加载状态完善

### 阶段四：实时功能（待实现 📋）

- [ ] 实时消息
- [ ] 实时统计更新
- [ ] 在线状态
- [ ] 通知系统

### 阶段五：优化和完善（待实现 📋）

- [ ] 性能优化
- [ ] 数据分析图表
- [ ] 搜索和筛选
- [ ] 图片上传
- [ ] 测试覆盖

---

## 📚 参考资源

### 官方文档

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/docs)
- [Vite](https://vite.dev/)

### 组件库

- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)

### 工具库

- [date-fns](https://date-fns.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Motion (Framer Motion)](https://motion.dev/)

---

## 🤝 开发流程

### 新增功能

1. 在 Guidelines.md 中记录功能需求
2. 更新类型定义（types.ts）
3. 实现数据层（mockData.ts 或 API）
4. 创建/更新 UI 组件
5. 测试功能
6. 更新文档

### Bug 修复

1. 重现问题
2. 定位代码位置
3. 修复并测试
4. 确认无其他影响
5. 记录修复内容

### 代码审查要点

- 类型安全
- 性能影响
- 用户体验
- 代码可读性
- 错误处理

---

## 📱 移动适配

### 屏幕尺寸

- 小屏（手机）：< 640px
- 中屏（平板）：640px - 1024px
- 大屏（桌面）：> 1024px

### 适配策略

- 移动优先设计
- 使用 Tailwind 响应式类
- 触摸友好的按钮尺寸（最小 44x44px）
- 简化移动端导航
- 考虑横屏模式

### 测试设备

- iPhone 13 Pro (390x844)
- iPhone SE (375x667)
- Samsung Galaxy S21 (360x800)
- iPad (768x1024)

---

## 📱 微信小程序交付方案

当前项目为 **React + Vite 的 Web 应用**。若最终需以 **微信小程序** 形式发布，可采用以下三种思路，按投入与体验权衡选择。

### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **A. Taro（React → 小程序）** | 复用大部分 React 代码与业务逻辑；一套代码可发 H5 + 微信/支付宝等小程序；原生体验好 | 需替换部分 Web 专有 API/组件；构建与调试要按 Taro 规范来 | **推荐**：希望保留 React、兼顾多端且要较好体验 |
| **B. web-view 内嵌 H5** | 几乎不用改现有 H5；上线最快 | 体验非原生、有缓存/内存等限制；微信不推荐大面积用 H5；域名需配置、仅部分能力可用 | 快速验证、或仅个别页面用 H5 |
| **C. 原生小程序重写** | 体验与性能最优；完全符合微信规范 | 需用 WXML/WXSS/小程序 JS 重写，工作量大 | 对体验和可控性要求极高、有专门前端人力 |

### 推荐路径：Taro 迁移（方案 A）

1. **技术栈关系**
   - 现有：React + TypeScript + Vite + react-router + shadcn/ui + Tailwind。
   - Taro 支持用 **React** 写页面，编译为微信小程序（及 H5/其他端），因此可最大程度复用组件与逻辑，仅做适配与替换。

2. **主要迁移工作**
   - **工程**：新建 Taro 项目（如 `taro init`），将现有 `src` 下页面/组件逐步迁入，路由改为 Taro 的 `Taro.navigateTo` / 页面配置。
   - **组件**：优先使用 **Taro 自带组件**（`<View>`、`<Text>`、`<Button>` 等）替代 DOM 标签；shadcn/ui 等依赖 DOM 的库需替换为 Taro 兼容 UI 或自写。
   - **样式**：Taro 支持类 CSS（WXSS），可继续用类似 Tailwind 的写法或迁为 Taro 推荐样式方案；注意单位（如 750 设计稿 + rpx）。
   - **接口与状态**：现有调用后端 API 的 `apiClient` / `dataStore` 可保留逻辑，仅将 `fetch` 换为 `Taro.request`，认证头与错误处理保持一致。

3. **微信登录与后端对接**
   - 小程序内使用 **微信登录**：`wx.login()` 取 `code`，将 `code` 发到你的后端；后端用微信接口（`code2Session`）换 `openid`/`session_key`，再生成或绑定你现有用户（如 Supabase user），并返回自定义 token 或 session。
   - 现有后端（Supabase + Edge Functions）可增加一个端点，例如 `POST /auth/wechat`：入参 `{ code }`，内部调微信接口，完成用户创建/绑定后返回 JWT 或 session；小程序端拿到后写入 storage，请求 API 时带该 token（与当前 `setAuthToken` 思路一致）。

4. **实施步骤建议**
   - 在文档或迭代计划中拆分为：① Taro 项目初始化与目录对齐；② 首页/目标/群组等核心页面与路由迁移；③ 替换 Web 专有组件与 API；④ 接入微信登录与现有后端；⑤ 真机与体验版测试、提审前合规与隐私说明。

### web-view 方案（方案 B）注意点

- 仅适合「先上架、再逐步原生化」或个别 H5 页。需在小程序后台配置 **业务域名**，且 H5 与小程序间通信依赖 `wx.miniProgram.postMessage` 等有限能力。
- 若采用：当前 Vite 打包出的 H5 部署到 HTTPS 域名，小程序里用 `<web-view src="https://你的域名/..." />` 打开；登录可考虑 H5 内微信开放标签或小程序侧先登录再通过 URL 传 token 给 H5。

### 参考资源

- [Taro 文档](https://docs.taro.zone/)（多端开发、React 语法、从 0 到 1）
- [Taro 从 React 项目迁移](https://docs.taro.zone/docs/3.x/convert-to-react)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信登录（小程序）](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)

若确定采用 Taro，可在本仓库中新增 `docs/wechat-miniprogram.md` 记录：Taro 版本、编译命令、与现有后端的对接方式及微信登录流程图，便于团队协作与后续维护。

---

## 🎉 结语

这个自律目标监控小程序旨在通过社交化的方式帮助用户养成良好习惯。核心理念是：

**一个人走得快，一群人走得远。**

通过群组互动、好友分享、活动比赛等社交功能，让自律变得有趣、有动力、有陪伴。

当前应用已经具备完整的前端功能和模拟数据系统，后端 API 与前端 API 客户端已就绪。若最终以**微信小程序**形式发布，可参考上文「微信小程序交付方案」选择 Taro 迁移、web-view 或原生重写，并优先完成微信登录与现有后端的对接。

**继续加油！** 💪
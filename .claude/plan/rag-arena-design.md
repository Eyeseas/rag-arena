# RAG 问答竞技场 Web 系统设计计划

## 项目概述

设计一个 RAG 问答竞技场 Web 系统，用户提问后页面匿名展示 4 个供应商的回答，用户可以给其中一个点赞。

## 技术栈

- **框架**: React 19 + TypeScript + Vite
- **路由**: TanStack Router
- **状态管理**: Zustand + TanStack Query
- **UI 组件**: Ant Design 6 + Tailwind CSS
- **HTTP 请求**: Axios (已有封装)

## 文件结构

```
src/
├── components/
│   └── arena/
│       ├── QuestionInput.tsx      # 问题输入组件
│       ├── AnswerCard.tsx         # 单个回答卡片组件
│       ├── AnswerGrid.tsx         # 4 个回答的网格布局
│       └── index.ts               # 组件导出
├── routes/
│   └── arena.tsx                  # 竞技场主页面路由
├── services/
│   └── arena.ts                   # 竞技场 API 服务
├── stores/
│   └── arena.ts                   # 竞技场状态管理
└── types/
    └── arena.ts                   # 竞技场相关类型定义
```

## 详细实现步骤

### 步骤 1: 定义类型和接口

**文件**: `src/types/arena.ts`

```typescript
// 单个回答类型
interface Answer {
  id: string           // 回答唯一标识
  content: string      // 回答内容 (Markdown)
  providerId: string   // 供应商 ID (匿名，如 A/B/C/D)
}

// 竞技场回答响应
interface ArenaResponse {
  questionId: string   // 问题 ID
  question: string     // 原始问题
  answers: Answer[]    // 4 个回答
}

// 点赞请求
interface VoteRequest {
  questionId: string
  answerId: string
}
```

**预期结果**: 类型定义完成，为后续开发提供类型安全

---

### 步骤 2: 创建 Arena Store 状态管理

**文件**: `src/stores/arena.ts`

**功能**:
- 存储当前问题和回答
- 管理加载状态
- 记录用户点赞状态

**状态结构**:
```typescript
interface ArenaState {
  question: string
  answers: Answer[]
  isLoading: boolean
  votedAnswerId: string | null
  setQuestion: (q: string) => void
  setAnswers: (answers: Answer[]) => void
  setLoading: (loading: boolean) => void
  vote: (answerId: string) => void
  reset: () => void
}
```

**预期结果**: 状态管理逻辑完成，支持问答流程

---

### 步骤 3: 创建 API 服务层

**文件**: `src/services/arena.ts`

**接口**:
```typescript
// 提交问题，获取 4 个回答
submitQuestion(question: string): Promise<ArenaResponse>

// 提交点赞
submitVote(request: VoteRequest): Promise<void>
```

**预期结果**: API 调用封装完成

---

### 步骤 4: 实现问答输入组件

**文件**: `src/components/arena/QuestionInput.tsx`

**功能**:
- 文本输入框 (Ant Design Input.TextArea)
- 提交按钮
- 加载状态显示
- 输入验证 (非空)

**UI 设计**:
- 居中布局
- 清晰的占位符提示
- 提交按钮带 loading 状态

**预期结果**: 用户可输入问题并提交

---

### 步骤 5: 实现回答卡片组件

**文件**: `src/components/arena/AnswerCard.tsx`

**功能**:
- 展示单个回答内容 (支持 Markdown 渲染)
- 匿名供应商标识 (A/B/C/D)
- 点赞按钮 (LikeOutlined 图标)
- 点赞后状态变化 (已点赞高亮)
- 禁止重复点赞

**Props**:
```typescript
interface AnswerCardProps {
  answer: Answer
  isVoted: boolean
  disabled: boolean  // 已投票给其他答案时禁用
  onVote: () => void
}
```

**UI 设计**:
- Ant Design Card 组件
- 卡片头部显示供应商标识
- 内容区域支持滚动 (max-height)
- 底部点赞按钮区域

**预期结果**: 单个回答卡片展示完成

---

### 步骤 6: 实现回答网格组件

**文件**: `src/components/arena/AnswerGrid.tsx`

**功能**:
- 2x2 网格布局展示 4 个回答卡片
- 响应式设计 (移动端单列)
- 传递点赞状态和回调

**预期结果**: 4 个回答并列展示

---

### 步骤 7: 实现竞技场主页面

**文件**: `src/routes/arena.tsx`

**页面流程**:
1. 初始状态: 显示问题输入框
2. 提交问题: 显示加载状态
3. 获取回答: 展示 4 个回答卡片
4. 用户点赞: 调用 API，更新 UI
5. 重新提问: 重置状态

**布局**:
```
┌─────────────────────────────────────┐
│           RAG 问答竞技场             │
├─────────────────────────────────────┤
│     [问题输入框]  [提交按钮]          │
├─────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐        │
│  │ 回答 A  │    │ 回答 B  │        │
│  │         │    │         │        │
│  │ [点赞]  │    │ [点赞]  │        │
│  └─────────┘    └─────────┘        │
│  ┌─────────┐    ┌─────────┐        │
│  │ 回答 C  │    │ 回答 D  │        │
│  │         │    │         │        │
│  │ [点赞]  │    │ [点赞]  │        │
│  └─────────┘    └─────────┘        │
└─────────────────────────────────────┘
```

**预期结果**: 完整的竞技场页面功能

---

### 步骤 8: 集成路由和测试

**任务**:
1. 在 Header 组件添加导航链接
2. 验证页面路由正常
3. 测试完整流程

**预期结果**: 系统可正常运行

---

## 交互设计细节

### 点赞交互
1. 用户只能给一个回答点赞
2. 点赞后，该卡片高亮显示
3. 其他卡片的点赞按钮变为禁用状态
4. 点赞后可以切换到其他回答（取消原点赞）

### 加载状态
1. 提交问题时显示全局 loading
2. 点赞时显示按钮 loading

### 错误处理
1. 网络错误时显示 message 提示
2. 支持重试

---

## 依赖说明

- `react-markdown`: 已安装，用于渲染 Markdown 回答
- `@ant-design/icons`: 已安装，用于点赞图标
- 无需新增依赖

---

## 后续扩展（本次不实现）

- 历史问答记录
- 点赞统计排行榜
- 用户认证系统
- 回答质量评分

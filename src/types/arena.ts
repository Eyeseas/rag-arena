/**
 * Arena - RAG 问答竞技场类型定义
 *
 * 这些类型定义用于前后端接口对接，请确保与后端 API 保持一致
 */

// ============================================================================
// 任务 (Task) 相关类型
// ============================================================================

/**
 * 任务 - 会话的分组容器
 * 用于组织和管理多个相关会话
 */
export interface Task {
  /** 任务唯一标识 */
  id: string
  /** 任务标题 */
  title: string
  /** 创建时间（毫秒时间戳） */
  createdAt: number
  /** 更新时间（毫秒时间戳） */
  updatedAt: number
  /** 是否展开（UI 状态） */
  expanded: boolean
}

// ============================================================================
// 引用 (Citation) 相关类型
// ============================================================================

/** 文档类型枚举 */
export type DocType = 'pdf' | 'webpage' | 'database' | 'api' | 'file' | 'other'

/**
 * 单个引用摘要
 * 表示回答中引用的外部文档或知识来源
 */
export interface Citation {
  /** 引用唯一标识 */
  id: string
  /** 文档标题 */
  title: string
  /** 摘要内容 - 从源文档中提取的相关片段 */
  content: string
  /** 文档来源/URL (可选) - 用于跳转到原始文档 */
  source?: string
  /** 相关性分数 (0-1，可选) - 表示该引用与问题的相关程度 */
  relevanceScore?: number
  /** 页码或章节 (可选) - 精确定位信息 */
  location?: string
  /** 文档类型标签 (可选) - 用于展示不同的图标或样式 */
  docType?: DocType
}

// ============================================================================
// 回答 (Answer) 相关类型
// ============================================================================

/**
 * 单个回答
 * 表示某个 RAG 模型对问题的回答
 */
export interface Answer {
  /** 回答唯一标识 */
  id: string
  /** 回答内容 (支持 Markdown 格式) */
  content: string
  /** 供应商标识 (匿名，如 A/B/C/D) - 用于盲测投票 */
  providerId: string
  /** 引用摘要列表 (可选) - 回答中引用的文档来源 */
  citations?: Citation[]
  /** 错误信息 (可选) - 当该回答生成失败时的错误提示 */
  error?: string
}

// ============================================================================
// 问答 (Arena) 相关类型
// ============================================================================

/**
 * 竞技场回答响应
 * 后端返回的完整问答结果
 * 
 * @remarks
 * 对应 API: POST /api/arena/ask
 */
export interface ArenaResponse {
  /** 问题 ID - 由后端生成的唯一标识 */
  questionId: string
  /** 原始问题 - 用户提交的问题文本 */
  question: string
  /** 回答列表 - 通常包含 4 个不同模型的回答 */
  answers: Answer[]
}

// ============================================================================
// 投票 (Vote) 相关类型
// ============================================================================

/**
 * 投票请求
 * 用户为某个回答投票时发送的请求
 * 
 * @remarks
 * 对应 API: POST /api/arena/vote
 */
export interface VoteRequest {
  /** 问题 ID - 关联到具体的问答会话 */
  questionId: string
  /** 回答 ID - 用户选择的最佳回答 */
  answerId: string
}

/**
 * 投票响应
 * 投票操作的结果
 */
export interface VoteResponse {
  /** 是否成功 */
  success: boolean
  /** 错误信息 (可选) - 投票失败时的错误提示 */
  message?: string
}

// ============================================================================
// 统计 (Stats) 相关类型
// ============================================================================

/**
 * 统计数据响应
 * 各个模型/提供商的投票统计
 * 
 * @remarks
 * 对应 API: GET /api/arena/stats
 * 
 * key: 提供商标识 (如 'openai', 'deepseek', 'claude', 'gemini')
 * value: 投票数量
 * 
 * @example
 * ```ts
 * const stats: StatsResponse = {
 *   openai: 150,
 *   deepseek: 120,
 *   claude: 80,
 *   gemini: 50,
 * }
 * ```
 */
export type StatsResponse = Record<string, number>

// ============================================================================
// 请求参数类型 (用于真实接口对接)
// ============================================================================

/**
 * 提问请求参数
 * 用于 POST /api/arena/ask 接口
 */
export interface AskRequest {
  /** 用户问题 */
  question: string
  /** 开始日期 (可选) - ISO 8601 格式 */
  startDate?: string
  /** 结束日期 (可选) - ISO 8601 格式 */
  endDate?: string
}

/**
 * 流式提问请求参数
 * 用于 POST /api/arena/ask?stream=1 接口
 */
export interface AskStreamRequest extends AskRequest {
  /** 是否启用流式响应 (query param) */
  stream?: boolean
}

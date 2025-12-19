// Arena - RAG 问答竞技场类型定义

/**
 * 单个回答
 */
export interface Answer {
  /** 回答唯一标识 */
  id: string
  /** 回答内容 (支持 Markdown) */
  content: string
  /** 供应商标识 (匿名，如 A/B/C/D) */
  providerId: string
}

/**
 * 竞技场回答响应
 */
export interface ArenaResponse {
  /** 问题 ID */
  questionId: string
  /** 原始问题 */
  question: string
  /** 4 个回答 */
  answers: Answer[]
}

/**
 * 点赞请求
 */
export interface VoteRequest {
  /** 问题 ID */
  questionId: string
  /** 回答 ID */
  answerId: string
}

/**
 * 点赞响应
 */
export interface VoteResponse {
  /** 是否成功 */
  success: boolean
}

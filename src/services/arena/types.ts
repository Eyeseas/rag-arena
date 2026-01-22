/**
 * Arena SSE 流式事件类型定义
 */

import type { Citation } from '@/types/arena'

// ============================================================================
// SSE 流式事件类型定义
// ============================================================================

/** SSE Meta 事件 - 包含问题和回答的基本信息 */
export interface ArenaSseMetaEvent {
  /** 协议版本 */
  protocolVersion: number
  /** 请求 ID */
  requestId: string
  /** 问题 ID */
  questionId: string
  /** 用户问题 */
  question: string
  /** 回答列表元信息 */
  answers: { answerId: string; providerId: string }[]
}

/** SSE 回答增量事件 - 流式回答内容 */
export interface ArenaSseAnswerDeltaEvent {
  /** 回答 ID */
  answerId: string
  /** 序列号 */
  seq: number
  /** 增量内容 */
  delta: string
}

/** SSE 回答完成事件 - 单个回答完成 */
export interface ArenaSseAnswerDoneEvent {
  /** 回答 ID */
  answerId: string
  /** 完整回答内容 */
  content: string
  /** 引用列表 */
  citations?: Citation[]
  /** 模型名称 */
  model?: string
  /** 响应延迟 (毫秒) */
  latencyMs?: number
}

/** SSE 回答错误事件 */
export interface ArenaSseAnswerErrorEvent {
  /** 回答 ID */
  answerId: string
  /** 错误信息 */
  message: string
}

/** SSE 完成事件 - 整个请求完成 */
export interface ArenaSseDoneEvent {
  /** 问题 ID */
  questionId?: string
  /** 是否成功 */
  ok: boolean
  /** 总耗时 (毫秒) */
  durationMs: number
  /** 附加消息 */
  message?: string
}

/** 流式问题提交回调处理器 */
export interface SubmitQuestionStreamHandlers {
  /** Meta 事件回调 */
  onMeta: (e: ArenaSseMetaEvent) => void
  /** 增量内容回调 */
  onDelta: (e: ArenaSseAnswerDeltaEvent) => void
  /** 单个回答完成回调 */
  onAnswerDone: (e: ArenaSseAnswerDoneEvent) => void
  /** 回答错误回调 */
  onAnswerError: (e: ArenaSseAnswerErrorEvent) => void
  /** 整体完成回调 */
  onDone: (e: ArenaSseDoneEvent) => void
}

/**
 * 对话流式响应事件
 */
export interface ChatStreamEvent {
  /** 会话ID */
  session_id?: string
  /** 对象类型 */
  object?: string
  /** 创建时间 */
  created?: number
  /** 选择列表 */
  choices?: Array<{
    /** 索引 */
    index?: number
    /** 增量内容 */
    delta?: {
      content?: string
    }
    /** 完成原因 */
    finish_reason?: string
  }>
  /** 引用列表 */
  citations?: Citation[]
  /** 模型名称 */
  maskName?: string
  /** 模型代码 */
  maskCode?: string
  /** 私有ID */
  privateId?: string
}

/**
 * 对话流式回调处理器
 */
export interface ChatStreamHandlers {
  /** 增量内容回调 */
  onDelta: (sessionId: string, content: string, privateId?: string, maskCode?: string, maskName?: string) => void
  /** 完成回调 */
  onDone: (sessionId: string, citations?: Citation[], privateId?: string) => void
  /** 错误回调 */
  onError: (error: Error, maskCode?: string) => void
}

/**
 * 多模型对话流式回调处理器
 */
export interface MultiModelChatStreamHandlers {
  /** 增量内容回调 - maskCode用于标识是哪个模型 */
  onDelta: (maskCode: string, content: string) => void
  /** 完成回调 - maskCode用于标识是哪个模型 */
  onDone: (maskCode: string, citations?: Citation[]) => void
  /** 错误回调 - maskCode用于标识是哪个模型 */
  onError: (maskCode: string, error: Error) => void
}

/**
 * Arena API - RAG 问答竞技场接口服务
 *
 * 支持三种模式：
 * - mock 模式：使用模拟数据，不调用真实接口
 * - dev 模式：调用开发环境接口（通过 Vite proxy）
 * - prod 模式：调用正式环境接口
 */

// 导出类型
export type {
  ArenaSseMetaEvent,
  ArenaSseAnswerDeltaEvent,
  ArenaSseAnswerDoneEvent,
  ArenaSseAnswerErrorEvent,
  ArenaSseDoneEvent,
  SubmitQuestionStreamHandlers,
  ChatStreamEvent,
  ChatStreamHandlers,
  MultiModelChatStreamHandlers,
} from './types'

// 导出工具函数
export { shouldUseMock, maskCodeToProviderId, orderedMaskCodes } from './utils'

// 导出各模块函数
export { submitQuestion, submitQuestionStream } from './question'
export { submitVote, submitVoteFeedback, getStats } from './vote'
export { getTaskList, addTask } from './task'
export { createConversation, chatConversationMultiModel, chatConversation } from './conversation'
export { getCitationDetail } from './citation'

// 导入函数用于构建 arenaApi 对象
import { submitQuestion, submitQuestionStream } from './question'
import { submitVote, submitVoteFeedback, getStats } from './vote'
import { getTaskList, addTask } from './task'
import { createConversation, chatConversationMultiModel, chatConversation } from './conversation'
import { getCitationDetail } from './citation'

/**
 * Arena API 接口对象
 * 包含所有竞技场相关的 API 方法
 */
export const arenaApi = {
  /** 提交问题 (非流式) */
  submitQuestion,
  /** 提交问题 (流式 SSE) */
  submitQuestionStream,
  /** 提交投票 */
  submitVote,
  /** 提交投票反馈 */
  submitVoteFeedback,
  /** 获取统计数据 */
  getStats,
  /** 获取引用详情 */
  getCitationDetail,
  /** 获取任务列表 */
  getTaskList,
  /** 创建对话 */
  createConversation,
  /** 对话开始 (流式) - 单模型版本 */
  chatConversation,
  /** 对话开始 (流式) - 多模型并行版本 */
  chatConversationMultiModel,
  /** 添加任务 */
  addTask,
}

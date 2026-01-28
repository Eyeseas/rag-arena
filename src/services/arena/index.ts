/**
 * Arena API - RAG 问答竞技场接口服务
 *
 * 支持两种模式：
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
export { maskCodeToProviderId, orderedMaskCodes } from './utils'

// 导出各模块函数
export { submitQuestion, submitQuestionStream } from './question'
export { submitVote, submitVoteFeedback, getStats } from './vote'
export { getTaskList, addTask } from './task'
export { createConversation, chatConversationMultiModel, chatConversation, chatPrivate, getConversationHistory, renameConversation, deleteConversation } from './conversation'
export { getCitationDetail } from './citation'

// 导入函数用于构建 arenaApi 对象
import { submitQuestion, submitQuestionStream } from './question'
import { submitVote, submitVoteFeedback, getStats } from './vote'
import { getTaskList, addTask } from './task'
import { createConversation, chatConversationMultiModel, chatConversation, chatPrivate, getConversationHistory, renameConversation, deleteConversation } from './conversation'
import { getCitationDetail } from './citation'

/**
 * Arena API 接口对象
 * 包含所有竞技场相关的 API 方法
 */
export const arenaApi = {
  submitQuestion,
  submitQuestionStream,
  submitVote,
  submitVoteFeedback,
  getStats,
  getCitationDetail,
  getTaskList,
  createConversation,
  chatConversation,
  chatConversationMultiModel,
  chatPrivate,
  addTask,
  getConversationHistory,
  renameConversation,
  deleteConversation,
}

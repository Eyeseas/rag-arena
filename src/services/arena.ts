/**
 * Arena API - RAG 问答竞技场接口服务
 * 
 * 当前为 Mock 模式，使用模拟数据进行开发
 * 后续对接真实接口时，只需替换此文件中的实现即可
 */

import type { ArenaResponse, VoteRequest, VoteResponse, StatsResponse, Citation, CitationDetail } from '@/types/arena'
import type { DateRange } from '@/components/arena'
import {
  MOCK_DELAY,
  delay,
  generateMockArenaResponse,
  generateMockVoteResponse,
  generateMockStatsResponse,
  splitTextToChunks,
} from '@/data/mock'

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

// ============================================================================
// API 接口实现 (Mock 版本)
// ============================================================================

/**
 * 提交问题，获取 4 个匿名回答 (非流式)
 * 
 * @param question 用户问题
 * @param _dateRange 可选的时间范围 (当前 mock 未使用)
 * @returns 竞技场回答响应
 * 
 * @example
 * ```ts
 * const response = await submitQuestion('什么是 RAG?')
 * console.log(response.answers) // 4 个回答
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /api/arena/ask
 * Body: { question: string, startDate?: string, endDate?: string }
 */
export async function submitQuestion(
  question: string,
  _dateRange?: DateRange,
): Promise<ArenaResponse> {
  // 模拟网络延迟
  await delay(MOCK_DELAY.question)
  return generateMockArenaResponse(question)
}

/**
 * 提交流式问题 (SSE)
 * 
 * @param question 用户问题
 * @param _dateRange 可选的时间范围 (当前 mock 未使用)
 * @param handlers SSE 事件回调处理器
 * 
 * @example
 * ```ts
 * await submitQuestionStream('什么是 RAG?', undefined, {
 *   onMeta: (e) => console.log('Meta:', e),
 *   onDelta: (e) => console.log('Delta:', e),
 *   onAnswerDone: (e) => console.log('Answer done:', e),
 *   onAnswerError: (e) => console.log('Error:', e),
 *   onDone: (e) => console.log('Done:', e),
 * })
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /api/arena/ask?stream=1
 * Headers: { Accept: 'text/event-stream' }
 * Body: { question: string, startDate?: string, endDate?: string }
 * 
 * SSE 事件格式:
 * - event: meta     - 问题和回答基本信息
 * - event: answer.delta - 流式回答内容
 * - event: answer.done  - 单个回答完成
 * - event: answer.error - 回答错误
 * - event: done     - 整体完成
 */
export async function submitQuestionStream(
  question: string,
  _dateRange: DateRange | undefined,
  handlers: SubmitQuestionStreamHandlers,
): Promise<void> {
  // 模拟初始延迟
  await delay(MOCK_DELAY.streamInit)
  
  const mock = generateMockArenaResponse(question)
  
  // 发送 Meta 事件
  handlers.onMeta({
    protocolVersion: 1,
    requestId: `mock_${Date.now()}`,
    questionId: mock.questionId,
    question: mock.question,
    answers: mock.answers.map((a) => ({ answerId: a.id, providerId: a.providerId })),
  })

  // 模拟流式输出每个回答
  for (const answer of mock.answers) {
    const deltas = splitTextToChunks(answer.content)
    let seq = 1
    
    for (const delta of deltas) {
      handlers.onDelta({ answerId: answer.id, seq, delta })
      seq += 1
    }
    
    handlers.onAnswerDone({
      answerId: answer.id,
      content: answer.content,
      citations: answer.citations,
    })
  }

  // 发送完成事件
  handlers.onDone({
    questionId: mock.questionId,
    ok: true,
    durationMs: 0,
  })
}

/**
 * 提交投票
 * 
 * @param request 投票请求
 * @returns 投票响应
 * 
 * @example
 * ```ts
 * const response = await submitVote({
 *   questionId: 'q_123',
 *   answerId: 'q_123_a',
 * })
 * console.log(response.success) // true
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /api/arena/vote
 * Body: { questionId: string, answerId: string }
 */
export async function submitVote(request: VoteRequest): Promise<VoteResponse> {
  // 模拟网络延迟
  await delay(MOCK_DELAY.vote)
  console.log('[Mock] Vote submitted:', request)
  return generateMockVoteResponse()
}

/**
 * 获取投票统计数据
 * 
 * @returns 统计数据响应
 * 
 * @example
 * ```ts
 * const stats = await getStats()
 * console.log(stats.openai) // 投票数
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /api/arena/stats
 */
export async function getStats(): Promise<StatsResponse> {
  // 模拟网络延迟
  await delay(MOCK_DELAY.stats)
  return generateMockStatsResponse()
}

/**
 * 获取引用详情
 * 
 * @param refId 引用ID
 * @returns 引用详情
 * 
 * @example
 * ```ts
 * const detail = await getCitationDetail('ref_1')
 * console.log(detail.content) // 转写内容
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /api/v1/reference/detail/{ref_id}
 */
export async function getCitationDetail(refId: string): Promise<CitationDetail> {
  // 模拟网络延迟
  await delay(MOCK_DELAY.question)
  
  // Mock 数据 - 多轮对话内容
  const conversationContent = [
    { text: '您好，我想咨询一下关于产品的问题', time: 0, role: 'caller', callnumber: '13800138000' },
    { text: '好的，请问您想了解哪个方面的信息？', time: 5, role: 'called', callednumber: '4001234567' },
    { text: '我想了解一下价格和功能特点', time: 12, role: 'caller', callnumber: '13800138000' },
    { text: '我们的产品价格是2999元，主要功能包括智能识别、语音交互和数据分析', time: 18, role: 'called', callednumber: '4001234567' },
    { text: '那有没有优惠活动呢？', time: 35, role: 'caller', callnumber: '13800138000' },
    { text: '目前我们有新用户优惠，可以享受8折优惠，也就是2399元', time: 42, role: 'called', callednumber: '4001234567' },
    { text: '好的，我考虑一下，谢谢', time: 58, role: 'caller', callnumber: '13800138000' },
    { text: '不客气，如有其他问题随时联系我们', time: 65, role: 'called', callednumber: '4001234567' },
  ]
  
  // Mock 数据
  return {
    ref_id: refId,
    content: JSON.stringify(conversationContent),
    trans: JSON.stringify([
      { text: 'Hello, I would like to inquire about product information', time: 0 },
      { text: 'Sure, which aspect would you like to know about?', time: 5 },
      { text: 'I want to know about pricing and features', time: 12 },
      { text: 'Our product price is 2999 yuan, main features include intelligent recognition, voice interaction and data analysis', time: 18 },
      { text: 'Are there any promotional activities?', time: 35 },
      { text: 'We currently have a new user discount, you can enjoy 20% off, which is 2399 yuan', time: 42 },
      { text: 'Okay, I will consider it, thank you', time: 58 },
      { text: 'You are welcome, feel free to contact us if you have any other questions', time: 65 },
    ]),
    time_point: 42,
    key_elements: {
      persons: ['张三', '李四', '客服小王'],
      oragnizations: ['公司A', '销售部门', '客服中心'],
      events: ['产品咨询', '价格讨论', '优惠活动'],
      others: ['产品X', '新用户优惠', '智能识别功能'],
    },
    file: 'http://example.com/audio/ref_1.mp3',
    begin_time: 0,
    end_time: 70,
  }
}

// ============================================================================
// 导出 API 对象
// ============================================================================

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
  /** 获取统计数据 */
  getStats,
  /** 获取引用详情 */
  getCitationDetail,
}

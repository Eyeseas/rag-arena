/**
 * Arena 投票与评分服务
 */

import type {
  VoteRequest,
  VoteResponse,
  StatsResponse,
  SubmitVoteFeedbackRequest,
  SubmitVoteFeedbackResponse,
} from '@/types/arena'
import { shouldUseMock } from './utils'
import {
  MOCK_DELAY,
  delay,
  generateMockVoteResponse,
  generateMockStatsResponse,
} from '@/data/mock'
import { get, post } from '@/lib/request'

/**
 * 提交投票（按住投票，投票后不可取消）
 */
export async function submitVote(request: VoteRequest, userId?: string): Promise<VoteResponse> {
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.vote)
    console.log('[Mock] Vote submitted:', request)
    return generateMockVoteResponse()
  }

  try {
    const response = await get<{ code: number; msg: string; data: boolean }>('/conv/like', {
      params: { priId: request.priId },
      headers: userId ? { userId } : undefined,
    })
    return {
      success: response.data === true,
      message: response.msg,
    }
  } catch (error) {
    console.error('[ArenaApi] submitVote failed:', error)
    throw error
  }
}

/**
 * 提交投票反馈
 *
 * @param request 反馈请求
 * @returns 反馈响应
 *
 * @example
 * ```ts
 * const response = await submitVoteFeedback({
 *   questionId: 'q_123',
 *   answerId: 'q_123_a',
 *   reasons: ['SLOW_RESPONSE', 'HALLUCINATION']
 * })
 * console.log(response.success) // true
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /api/arena/vote/feedback
 * Body: SubmitVoteFeedbackRequest
 */
export async function submitVoteFeedback(
  request: SubmitVoteFeedbackRequest
): Promise<SubmitVoteFeedbackResponse> {
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.vote)
    console.log('[Mock] Vote feedback submitted:', request)
    return {
      success: true,
    }
  }

  // 真实接口调用
  try {
    const response = await post<SubmitVoteFeedbackResponse>('/api/arena/vote/feedback', request)
    return response
  } catch (error) {
    console.error('[ArenaApi] submitVoteFeedback failed:', error)
    throw error
  }
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
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.stats)
    return generateMockStatsResponse()
  }

  // 真实接口调用
  try {
    const response = await get<StatsResponse>('/api/arena/stats')
    return response
  } catch (error) {
    console.error('[ArenaApi] getStats failed:', error)
    throw error
  }
}

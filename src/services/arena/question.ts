/**
 * Arena 问题提交服务
 */

import type { ArenaResponse } from '@/types/arena'
import type { DateRange } from '@/types/common'
import type { SubmitQuestionStreamHandlers } from './types'
import { dispatchJsonSseEvent } from './sseJson'
import { post } from '@/lib/request'

/**
 * 提交问题，获取 4 个匿名回答 (非流式)
 *
 * @param question 用户问题
 * @param dateRange 可选的时间范围
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
  dateRange?: DateRange
): Promise<ArenaResponse> {
  try {
    const body: Record<string, string> = { question }
    if (dateRange?.[0]) {
      body.startDate = dateRange[0].format('YYYY-MM-DD')
    }
    if (dateRange?.[1]) {
      body.endDate = dateRange[1].format('YYYY-MM-DD')
    }

    const response = await post<ArenaResponse>('/api/arena/ask', body)
    return response
  } catch (error) {
    console.error('[ArenaApi] submitQuestion failed:', error)
    throw error
  }
}

/**
 * 提交流式问题 (SSE)
 *
 * @param question 用户问题
 * @param dateRange 可选的时间范围
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
  dateRange: DateRange | undefined,
  handlers: SubmitQuestionStreamHandlers
): Promise<void> {
  try {
    const body: Record<string, string> = { question }
    if (dateRange?.[0]) {
      body.startDate = dateRange[0].format('YYYY-MM-DD')
    }
    if (dateRange?.[1]) {
      body.endDate = dateRange[1].format('YYYY-MM-DD')
    }

    const response = await fetch('/api/arena/ask?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    })

    // 使用 SSE 工具解析流式响应
    const { readSseStream } = await import('@/lib/sse')
    await readSseStream(response, (msg) => {
      dispatchJsonSseEvent(msg, {
        meta: (data) => handlers.onMeta(data as Parameters<typeof handlers.onMeta>[0]),
        'answer.delta': (data) => handlers.onDelta(data as Parameters<typeof handlers.onDelta>[0]),
        'answer.done': (data) =>
          handlers.onAnswerDone(data as Parameters<typeof handlers.onAnswerDone>[0]),
        'answer.error': (data) =>
          handlers.onAnswerError(data as Parameters<typeof handlers.onAnswerError>[0]),
        done: (data) => handlers.onDone(data as Parameters<typeof handlers.onDone>[0]),
      })
    })
  } catch (error) {
    console.error('[ArenaApi] submitQuestionStream failed:', error)
    handlers.onDone({
      ok: false,
      durationMs: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

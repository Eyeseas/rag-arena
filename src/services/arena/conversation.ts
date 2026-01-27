/**
 * Arena 对话（会话）服务
 */

import type {
  CreateConversationRequest,
  CreateConversationResponse,
} from '@/types/arena'
import type { ChatStreamEvent, ChatStreamHandlers, MultiModelChatStreamHandlers } from './types'
import { shouldUseMock, orderedMaskCodes } from './utils'
import { MOCK_DELAY, delay, splitTextToChunks } from '@/data/mock'
import { post } from '@/lib/request'

/**
 * 创建对话
 *
 * @param userId 用户ID
 * @param request 创建对话请求
 * @returns 创建对话响应
 *
 * @example
 * ```ts
 * const response = await createConversation('user_123', {
 *   taskId: 'task_1',
 *   messages: []
 * })
 * console.log(response.data.sessionId) // 会话ID
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /conv/create
 * Headers: { userId: string }
 * Body: CreateConversationRequest
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/create
 * 前端调用路径: /api/conv/create (会被 proxy 转发)
 */
export async function createConversation(
  userId: string,
  request: CreateConversationRequest
): Promise<CreateConversationResponse> {
  console.log('createConversation', userId, request)
  try {
    // 通过 proxy 调用，路径 /api/conv/create 会被代理到 http://192.168.157.104:8901/conv/create
    const response = await post<CreateConversationResponse>('/api/conv/create', request, {
      headers: {
        userId,
      },
    })

    console.log('[ArenaApi] createConversation response:', response)
    return response
  } catch (error) {
    // 如果接口调用失败，抛出错误
    console.error('[ArenaApi] createConversation failed:', error)
    throw error
  }
}

/**
 * 多模型对话开始（流式）- 并行发送4个SSE请求（A、B、C、D）
 *
 * @param userId 用户ID
 * @param request 对话请求基础参数
 * @param priIdMapping 模型代码到priId的映射
 * @param handlers 流式回调处理器
 *
 * @example
 * ```ts
 * await chatConversationMultiModel('user_123', {
 *   taskId: 'task_1',
 *   session_id: 'session_123',
 *   messages: [{ role: 'user', content: '你好' }]
 * }, {
 *   ALPHA: 'priId1',
 *   BRAVO: 'priId2',
 *   CHARLIE: 'priId3',
 *   DELTA: 'priId4',
 * }, {
 *   onDelta: (maskCode, content) => console.log('Delta:', maskCode, content),
 *   onDone: (maskCode, citations) => console.log('Done:', maskCode, citations),
 *   onError: (maskCode, error) => console.error('Error:', maskCode, error),
 * })
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /conv/chat (4次并行：ALPHA、BRAVO、CHARLIE、DELTA，每次使用不同的priId)
 * Headers: { userId: string, Accept: 'text/event-stream' }
 * Body: CreateConversationRequest (包含priId)
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/chat
 * 前端调用路径: /api/conv/chat (会被 proxy 转发)
 *
 * 注意：4路请求并行执行，同时开始流式响应
 */
export async function chatConversationMultiModel(
  userId: string,
  request: Omit<CreateConversationRequest, 'priId'>,
  priIdMapping: Record<string, string>,
  handlers: MultiModelChatStreamHandlers
): Promise<void> {
  console.log('chatConversationMultiModel', userId, request, priIdMapping)

  // 如果使用 mock 模式，模拟流式响应
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.streamInit)

    const maskCodes = Object.keys(priIdMapping)
    for (const maskCode of maskCodes) {
      const mockContent = `这是模型 ${maskCode} 的模拟回答内容。`
      const deltas = splitTextToChunks(mockContent, 10)

      for (const delta of deltas) {
        await delay(50)
        handlers.onDelta(maskCode, delta)
      }

      handlers.onDone(maskCode, [])
    }
    return
  }

  // 真实接口调用 - 并行发送4个SSE请求（A、B、C、D）
  const { readSseStream } = await import('@/lib/sse')

  // 并行发送所有模型的SSE请求
  const streamPromises = orderedMaskCodes.map(async (maskCode) => {
    const priId = priIdMapping[maskCode]
    if (!priId) {
      console.warn(`[ArenaApi] No priId found for ${maskCode}, skipping`)
      return
    }

    try {
      const response = await fetch('/api/conv/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          userId,
        },
        body: JSON.stringify({
          ...request,
          priId,
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `HTTP ${response.status}`)
      }

      // 解析SSE流
      await readSseStream(response, (msg) => {
        try {
          const data: ChatStreamEvent = JSON.parse(msg.data)

          // 处理增量内容
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0]
            if (choice.delta?.content) {
              // 过滤掉 <think> 标签内容
              const trimmedContent = choice.delta.content.trim()
              if (trimmedContent !== '<think>' && trimmedContent !== '</think>' && trimmedContent !== '') {
                handlers.onDelta(maskCode, choice.delta.content)
              }
            }

            // 如果完成，调用 onDone
            if (choice.finish_reason) {
              handlers.onDone(maskCode, data.citations)
            }
          }
        } catch (error) {
          console.error(`[ArenaApi] Failed to parse SSE event for ${maskCode}:`, error)
          handlers.onError(maskCode, error instanceof Error ? error : new Error('Failed to parse SSE event'))
        }
      })
    } catch (error) {
      console.error(`[ArenaApi] chatConversationMultiModel failed for ${maskCode}:`, error)
      handlers.onError(maskCode, error instanceof Error ? error : new Error('Unknown error'))
    }
  })

  // 等待所有流完成
  await Promise.all(streamPromises)
}

/**
 * 对话开始（流式）- 单模型版本（保留用于向后兼容）
 *
 * @param userId 用户ID
 * @param request 对话请求
 * @param handlers 流式回调处理器
 *
 * @example
 * ```ts
 * await chatConversation('user_123', {
 *   taskId: 'task_1',
 *   messages: [{ role: 'user', content: '你好' }]
 * }, {
 *   onDelta: (sessionId, content) => console.log('Delta:', content),
 *   onDone: (sessionId, citations) => console.log('Done:', citations),
 *   onError: (error) => console.error('Error:', error),
 * })
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /conv/chat
 * Headers: { userId: string, Accept: 'text/event-stream' }
 * Body: CreateConversationRequest
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/chat
 * 前端调用路径: /api/conv/chat (会被 proxy 转发)
 */
export async function chatConversation(
  userId: string,
  request: CreateConversationRequest,
  handlers: ChatStreamHandlers
): Promise<void> {
  console.log('chatConversation', userId, request)

  // 如果使用 mock 模式，模拟流式响应
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.streamInit)

    const sessionId = request.session_id || `mock_session_${Date.now()}`
    const mockContent = '这是一个模拟的流式回答内容。在实际使用中，这里会是从服务器实时接收的增量内容。'
    const deltas = splitTextToChunks(mockContent, 10)

    for (const delta of deltas) {
      await delay(50)
      handlers.onDelta(sessionId, delta)
    }

    handlers.onDone(sessionId, [])
    return
  }

  // 真实接口调用 - SSE 流式请求
  try {
    const response = await fetch('/api/conv/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        userId,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `HTTP ${response.status}`)
    }

    // 使用 SSE 工具解析流式响应
    const { readSseStream } = await import('@/lib/sse')
    let currentSessionId = request.session_id || ''
    let currentPrivateId = ''

    await readSseStream(response, (msg) => {
      try {
        const data: ChatStreamEvent = JSON.parse(msg.data)

        // 更新 session_id
        if (data.session_id) {
          currentSessionId = data.session_id
        }

        // 更新 privateId
        if (data.privateId) {
          currentPrivateId = data.privateId
        }

        // 处理增量内容
        if (data.choices && data.choices.length > 0) {
          const choice = data.choices[0]
          if (choice.delta?.content) {
            // 传递 maskCode 和 maskName 以便创建 answer 时使用
            handlers.onDelta(currentSessionId, choice.delta.content, currentPrivateId, data.maskCode, data.maskName)
          }

          // 如果完成，调用 onDone
          if (choice.finish_reason) {
            handlers.onDone(currentSessionId, data.citations, currentPrivateId)
          }
        }
      } catch (error) {
        console.error('[ArenaApi] Failed to parse SSE event:', error)
        handlers.onError(error instanceof Error ? error : new Error('Failed to parse SSE event'))
      }
    })
  } catch (error) {
    console.error('[ArenaApi] chatConversation failed:', error)
    handlers.onError(error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

export async function getConversationHistory(
  userId: string,
  sessionId: string,
  priId?: string
): Promise<import('@/types/arena').HistoryChatResponse> {
  const { get } = await import('@/lib/request')
  
  const params: Record<string, string> = { sessionId }
  if (priId) {
    params.priId = priId
  }
  
  const response = await get<import('@/types/arena').HistoryChatResponse>('/api/conv/his', {
    params,
    headers: { userId },
  })
  
  return response
}

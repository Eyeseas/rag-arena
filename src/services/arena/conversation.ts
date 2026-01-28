/**
 * Arena 对话（会话）服务
 */

import type {
  CreateConversationRequest,
  CreateConversationResponse,
} from '@/types/arena'
import type { ChatStreamEvent, ChatStreamHandlers, MultiModelChatStreamHandlers } from './types'
import { orderedMaskCodes } from './utils'
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
 * POST /conv/chat/single (4次并行：ALPHA、BRAVO、CHARLIE、DELTA，每次使用不同的priId)
 * Headers: { userId: string, Accept: 'text/event-stream' }
 * Body: CreateConversationRequest (包含priId)
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/chat/single
 * 前端调用路径: /api/conv/chat/single (会被 proxy 转发)
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
      const response = await fetch('/api/conv/chat/single', {
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
      // 标记是否已收到 finish_reason，等待下一条消息的 citations
      let waitingForCitations = false

      await readSseStream(response, (msg) => {
        try {
          const data: ChatStreamEvent = JSON.parse(msg.data)

          // 如果正在等待 citations，从当前消息提取并调用 onDone
          if (waitingForCitations) {
            handlers.onDone(maskCode, data.citations)
            waitingForCitations = false
            return
          }

          // 处理增量内容
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0]
            if (choice.delta?.content) {
              // 保留 <think> 标签内容,由前端 Think 组件渲染
              // 将各种形式的换行符统一替换为 \n，避免显示为字面文本
              const normalizedContent = choice.delta.content
                .replace(/\r\n/g, '\n')           // 处理真实的回车换行符
                .replace(/\/r\/n/g, '\n')         // 处理字面字符串 '/r/n'
                .replace(/\\r\\n/g, '\n')         // 处理转义的字符串 '\r\n'
              handlers.onDelta(maskCode, normalizedContent)
            }

            // 如果完成，标记等待下一条消息的 citations
            if (choice.finish_reason) {
              waitingForCitations = true
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
    // 标记是否已收到 finish_reason，等待下一条消息的 citations
    let waitingForCitations = false

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

        // 如果正在等待 citations，从当前消息提取并调用 onDone
        if (waitingForCitations) {
          handlers.onDone(currentSessionId, data.citations, currentPrivateId)
          waitingForCitations = false
          return
        }

        // 处理增量内容
        if (data.choices && data.choices.length > 0) {
          const choice = data.choices[0]
          if (choice.delta?.content) {
            // 传递 maskCode 和 maskName 以便创建 answer 时使用
            const normalizedContent = choice.delta.content.replace(/\r\n/g, '\n')
            handlers.onDelta(currentSessionId, normalizedContent, currentPrivateId, data.maskCode, data.maskName)
          }

          // 如果完成，标记等待下一条消息的 citations
          if (choice.finish_reason) {
            waitingForCitations = true
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

/**
 * 私聊（单个模型追问）- 流式响应
 *
 * @param userId 用户ID
 * @param request 对话请求（包含priId）
 * @param handlers 流式回调处理器
 *
 * @example
 * ```ts
 * await chatPrivate('user_123', {
 *   taskId: 'task_1',
 *   priId: 'priId1',
 *   session_id: 'session_123',
 *   messages: [
 *     { role: 'user', content: '第一个问题' },
 *     { role: 'assistant', content: '第一个回答' },
 *     { role: 'user', content: '追问问题' }
 *   ]
 * }, {
 *   onDelta: (content) => console.log('Delta:', content),
 *   onDone: (citations) => console.log('Done:', citations),
 *   onError: (error) => console.error('Error:', error),
 * })
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /conv/chat/pri
 * Headers: { userId: string, Accept: 'text/event-stream' }
 * Body: CreateConversationRequest (包含priId)
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/chat/pri
 * 前端调用路径: /api/conv/chat/pri (会被 proxy 转发)
 */
export async function chatPrivate(
  userId: string,
  request: CreateConversationRequest,
  handlers: {
    onDelta: (content: string) => void
    onDone: (citations?: import('@/types/arena').Citation[]) => void
    onError: (error: Error) => void
  }
): Promise<void> {
  console.log('chatPrivate', userId, request)

  try {
    const response = await fetch('/api/conv/chat/pri', {
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
    // 标记是否已收到 finish_reason，等待下一条消息的 citations
    let waitingForCitations = false

    await readSseStream(response, (msg) => {
      try {
        const data: ChatStreamEvent = JSON.parse(msg.data)

        // 如果正在等待 citations，从当前消息提取并调用 onDone
        if (waitingForCitations) {
          handlers.onDone(data.citations)
          waitingForCitations = false
          return
        }

        // 处理增量内容
        if (data.choices && data.choices.length > 0) {
          const choice = data.choices[0]
          if (choice.delta?.content) {
            const normalizedContent = choice.delta.content.replace(/\r\n/g, '\n')
            handlers.onDelta(normalizedContent)
          }

          // 如果完成，标记等待下一条消息的 citations
          if (choice.finish_reason) {
            waitingForCitations = true
          }
        }
      } catch (error) {
        console.error('[ArenaApi] Failed to parse SSE event:', error)
        handlers.onError(error instanceof Error ? error : new Error('Failed to parse SSE event'))
      }
    })
  } catch (error) {
    console.error('[ArenaApi] chatPrivate failed:', error)
    handlers.onError(error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

export async function renameConversation(
  userId: string,
  sessionId: string,
  title: string
): Promise<{ code: number; msg: string; data: boolean }> {
  const { get } = await import('@/lib/request')

  const response = await get<{ code: number; msg: string; data: boolean }>('/api/conv/rename', {
    params: { sessionId, title },
    headers: { userId },
  })

  return response
}

export async function deleteConversation(
  userId: string,
  sessionId: string
): Promise<{ code: number; msg: string; data: boolean }> {
  const { get } = await import('@/lib/request')

  const response = await get<{ code: number; msg: string; data: boolean }>('/api/conv/del', {
    params: { sessionId },
    headers: { userId },
  })

  return response
}

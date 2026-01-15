/**
 * Arena API - RAG 问答竞技场接口服务
 * 
 * 支持三种模式：
 * - mock 模式：使用模拟数据，不调用真实接口
 * - dev 模式：调用开发环境接口（通过 Vite proxy）
 * - prod 模式：调用正式环境接口
 */

import type { ArenaResponse, VoteRequest, VoteResponse, StatsResponse, Citation, CitationDetail, TaskListResponse, CreateConversationRequest, CreateConversationResponse, TaskAddRequest, TaskAddResponse, ChatMessage } from '@/types/arena'
import type { DateRange } from '@/components/arena'
import {
  MOCK_DELAY,
  delay,
  generateMockArenaResponse,
  generateMockVoteResponse,
  generateMockStatsResponse,
  splitTextToChunks,
} from '@/data/mock'
import { get, post } from '@/lib/request'

// ============================================================================
// 模式判断工具
// ============================================================================

/**
 * 判断是否使用 mock 数据
 * 根据环境变量 VITE_USE_MOCK 或 VITE_API_MODE 来判断
 */
function shouldUseMock(): boolean {
  const useMock = import.meta.env.VITE_USE_MOCK
  const apiMode = import.meta.env.VITE_API_MODE || 'dev'
  
  // 如果明确设置了 VITE_USE_MOCK，优先使用该值
  if (useMock !== undefined) {
    return useMock === '1' || useMock === 'true'
  }
  
  // 否则根据 API 模式判断
  return apiMode === 'mock'
}

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
// API 接口实现
// ============================================================================

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
  dateRange?: DateRange,
): Promise<ArenaResponse> {
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.question)
    return generateMockArenaResponse(question)
  }
  
  // 真实接口调用
  try {
    const body: Record<string, string> = { question }
    if (dateRange?.startDate) {
      body.startDate = dateRange.startDate
    }
    if (dateRange?.endDate) {
      body.endDate = dateRange.endDate
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
  handlers: SubmitQuestionStreamHandlers,
): Promise<void> {
  // 如果使用 mock 模式，使用 mock 数据
  if (shouldUseMock()) {
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
    return
  }
  
  // 真实接口调用 - SSE 流式请求
  try {
    const body: Record<string, string> = { question }
    if (dateRange?.startDate) {
      body.startDate = dateRange.startDate
    }
    if (dateRange?.endDate) {
      body.endDate = dateRange.endDate
    }
    
    const response = await fetch('/api/arena/ask?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    })
    
    // 使用 SSE 工具解析流式响应
    const { readSseStream } = await import('@/lib/sse')
    await readSseStream(response, (msg) => {
      try {
        const data = JSON.parse(msg.data)
        
        switch (msg.event) {
          case 'meta':
            handlers.onMeta(data)
            break
          case 'answer.delta':
            handlers.onDelta(data)
            break
          case 'answer.done':
            handlers.onAnswerDone(data)
            break
          case 'answer.error':
            handlers.onAnswerError(data)
            break
          case 'done':
            handlers.onDone(data)
            break
        }
      } catch (error) {
        console.error('[ArenaApi] Failed to parse SSE event:', error)
      }
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
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.vote)
    console.log('[Mock] Vote submitted:', request)
    return generateMockVoteResponse()
  }
  
  // 真实接口调用
  try {
    const response = await post<VoteResponse>('/api/arena/vote', request)
    return response
  } catch (error) {
    console.error('[ArenaApi] submitVote failed:', error)
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

/**
 * 获取任务列表
 * 
 * @param userId 用户ID
 * @returns 任务列表响应
 * 
 * @example
 * ```ts
 * const response = await getTaskList('user_123')
 * console.log(response.data) // 任务列表
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /task/list
 * Headers: { userId: string }
 * 
 * 通过 Vite proxy 代理到: http://localhost:8901/task/list
 * 前端调用路径: /api/task/list (会被 proxy 转发)
 */
export async function getTaskList(userId: string): Promise<TaskListResponse> {
  console.log('getTaskList', userId)
  try {
    // 通过 proxy 调用，路径 /api/task/list 会被代理到 http://192.168.157.104:8901/task/list
    // proxy 配置: /api -> http://192.168.157.104:8901 (去掉 /api 前缀)
    const response = await get<TaskListResponse>('/api/task/list', {
      headers: {
        userId,
      },
    })
    
    console.log('[ArenaApi] getTaskList response:', response)
    return response
  } catch (error) {
    // 如果接口调用失败，抛出错误，不返回 mock 数据
    // 这样可以让调用方知道接口调用失败，而不是显示错误的 mock 数据
    console.error('[ArenaApi] getTaskList failed:', error)
    throw error
  }
}

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
 * 添加任务
 * 
 * @param userId 用户ID
 * @param request 添加任务请求
 * @returns 添加任务响应
 * 
 * @example
 * ```ts
 * const response = await addTask('user_123', {
 *   title: '新任务',
 *   description: '任务描述'
 * })
 * console.log(response.data) // true
 * ```
 * 
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /task/add
 * Headers: { userId: string }
 * Body: TaskAddRequest
 * 
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/task/add
 * 前端调用路径: /api/task/add (会被 proxy 转发)
 */
export async function addTask(
  userId: string,
  request: TaskAddRequest
): Promise<TaskAddResponse> {
  console.log('addTask', userId, request)
  try {
    // 如果使用 mock 模式，返回 mock 数据
    if (shouldUseMock()) {
      await delay(MOCK_DELAY.vote)
      console.log('[Mock] Task added:', request)
      return {
        code: 0,
        msg: 'success',
        data: true,
      }
    }
    
    // 通过 proxy 调用，路径 /api/task/add 会被代理到 http://192.168.157.104:8901/task/add
    const response = await post<TaskAddResponse>('/api/task/add', request, {
      headers: {
        userId,
      },
    })
    
    console.log('[ArenaApi] addTask response:', response)
    return response
  } catch (error) {
    console.error('[ArenaApi] addTask failed:', error)
    throw error
  }
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

/**
 * 多模型对话开始（流式）- 按顺序发送4个SSE请求（A、B、C、D）
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
 * POST /conv/chat (4次，按顺序：ALPHA、BRAVO、CHARLIE、DELTA，每次使用不同的priId)
 * Headers: { userId: string, Accept: 'text/event-stream' }
 * Body: CreateConversationRequest (包含priId)
 * 
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/conv/chat
 * 前端调用路径: /api/conv/chat (会被 proxy 转发)
 * 
 * 注意：按顺序执行，每个模型完成后再发送下一个模型的请求
 */
export async function chatConversationMultiModel(
  userId: string,
  request: Omit<CreateConversationRequest, 'priId'>,
  priIdMapping: Record<string, string>,
  handlers: MultiModelChatStreamHandlers,
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
  
  // 真实接口调用 - 按顺序发送4个SSE请求（A、B、C、D）
  const { readSseStream } = await import('@/lib/sse')
  
  // 模型代码到providerId的映射
  const maskCodeToProviderId: Record<string, string> = {
    ALPHA: 'A',
    BRAVO: 'B',
    CHARLIE: 'C',
    DELTA: 'D',
  }
  
  // 定义模型顺序：A、B、C、D
  const orderedMaskCodes = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA']
  
  // 按顺序发送所有模型的SSE请求
  for (const maskCode of orderedMaskCodes) {
    const priId = priIdMapping[maskCode]
    if (!priId) {
      console.warn(`[ArenaApi] No priId found for ${maskCode}, skipping`)
      continue
    }
    
    try {
      const response = await fetch('/api/conv/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
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
  }
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
  handlers: ChatStreamHandlers,
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
        'Accept': 'text/event-stream',
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
    let accumulatedContent = ''
    
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
            accumulatedContent += choice.delta.content
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
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
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
  
  // 真实接口调用
  try {
    const response = await get<CitationDetail>(`/api/v1/reference/detail/${refId}`)
    return response
  } catch (error) {
    console.error('[ArenaApi] getCitationDetail failed:', error)
    throw error
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

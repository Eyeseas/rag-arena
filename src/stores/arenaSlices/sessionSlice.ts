/**
 * @file 会话管理 Slice
 * @description 处理会话的生命周期管理和历史记录加载
 *
 * 会话是 Arena 的核心单位，每个会话包含一个问题和多个模型的回答
 * 支持的操作：
 * - 创建新会话（带数量限制）
 * - 删除会话
 * - 重命名会话
 * - 设置激活会话
 * - 加载会话历史记录
 */

import type { StateCreator } from 'zustand'
import type { ArenaSessionSlice, ArenaState } from '../arenaStoreTypes'
import type { Answer, HistoryChatVO, ChatRespWithLikedVO, HistoryMessage } from '@/types/arena'
import { MAX_SESSIONS_PER_TASK, createEmptySession, createId } from '../arenaHelpers'
import {
  computeActiveSessionAfterSessionDeletion,
  getTaskSessions,
  getOldestTaskSession,
  touchTask,
} from './internalHelpers'
import { arenaApi, maskCodeToProviderId } from '@/services/arena'
import { getUserId } from '@/lib/userId'

function convertHistoryToAnswers(historyData: HistoryChatVO): { answers: Answer[], priIdMapping: Record<string, string> } {
  const answers: Answer[] = []
  const priIdMapping: Record<string, string> = {}
  const { chatMap } = historyData

  for (const [maskCode, chatList] of Object.entries(chatMap)) {
    if (!chatList || chatList.length === 0) continue

    const providerId = maskCodeToProviderId[maskCode] || maskCode

    const historyMessages: HistoryMessage[] = chatList.map((chat: ChatRespWithLikedVO) => {
      const content = chat.choices?.map(c => c.delta?.content || '').join('') || ''
      return {
        content,
        citations: chat.citations || [],
        created: chat.created,
        question: chat.question,
      }
    })

    const firstMessage = historyMessages[0]
    const firstContent = firstMessage?.content || ''
    const firstCitations = firstMessage?.citations || []

    const lastChat = chatList[chatList.length - 1]
    const liked = chatList.some((chat: ChatRespWithLikedVO) => chat.liked)
    const privateId = lastChat?.privateId

    if (privateId) {
      priIdMapping[maskCode] = privateId
    }

    answers.push({
      id: privateId || createId(),
      content: firstContent,
      providerId,
      citations: firstCitations,
      liked,
      isComplete: true,
      historyMessages,
    } as Answer & { liked?: boolean })
  }

  const sortedAnswers = answers.sort((a, b) => {
    const order = ['A', 'B', 'C', 'D']
    return order.indexOf(a.providerId) - order.indexOf(b.providerId)
  })

  return { answers: sortedAnswers, priIdMapping }
}

/**
 * 创建会话管理 Slice
 *
 * @param set - Zustand set 函数
 * @param get - Zustand get 函数
 * @returns Session slice 的 action 实现
 */
export const createSessionSlice: StateCreator<ArenaState, [], [], ArenaSessionSlice> = (set, get) => {
  return {
    /** 历史记录加载状态 */
    isLoadingHistory: false,

    /**
     * 在当前任务下创建新会话
     * - 新会话添加到列表开头
     * - 自动设为激活会话
     * - 超出数量限制时移除最旧的会话
     *
     * @returns 新创建会话的 ID
     */
    startNewSession: async () => {
      const { activeTaskId, sessions } = get()

      // 创建空会话
      const newSession = createEmptySession(activeTaskId)

      // 检查当前任务的会话数量
      const taskSessions = getTaskSessions(sessions, activeTaskId)
      let nextSessions = [newSession, ...sessions]

      // 超出限制时移除最旧的会话
      if (taskSessions.length >= MAX_SESSIONS_PER_TASK) {
        const oldestSession = getOldestTaskSession(sessions, activeTaskId)
        if (oldestSession) {
          nextSessions = nextSessions.filter((s) => s.id !== oldestSession.id)
        }
      }

      set({
        sessions: nextSessions,
        activeSessionId: newSession.id,
      })

      // 更新任务的更新时间
      touchTask(set, activeTaskId)
      return newSession.id
    },

    /**
     * 设置当前激活的会话
     * 同时会自动切换到该会话所属的任务，并展开该任务
     *
     * @param sessionId - 会话 ID
     */
    setActiveSessionId: (sessionId) => {
      const { sessions } = get()
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return

      set((state) => ({
        activeSessionId: sessionId,
        // 同时切换到会话所属的任务
        activeTaskId: session.taskId,
        // 展开该任务
        tasks: state.tasks.map((t) => (t.id === session.taskId ? { ...t, expanded: true } : t)),
      }))
    },

    /**
     * 删除会话
     * - 如果删除后任务下没有会话，自动创建新会话
     * - 智能计算删除后的激活会话
     *
     * @param sessionId - 会话 ID
     */
    deleteSession: (sessionId) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId)
        if (!session) return state

        const remaining = state.sessions.filter((s) => s.id !== sessionId)
        const taskSessions = getTaskSessions(remaining, session.taskId)

        // 如果删除后任务下没有会话，创建新会话
        if (taskSessions.length === 0) {
          const newSession = createEmptySession(session.taskId)
          return {
            ...state,
            sessions: [...remaining, newSession],
            activeSessionId:
              state.activeSessionId === sessionId ? newSession.id : state.activeSessionId,
          }
        }

        // 计算删除后的激活会话
        const nextActiveSessionId = computeActiveSessionAfterSessionDeletion({
          deletedSessionId: sessionId,
          prevActiveSessionId: state.activeSessionId,
          taskId: session.taskId,
          remainingSessions: remaining,
        })

        return {
          ...state,
          sessions: remaining,
          activeSessionId: nextActiveSessionId,
        }
      })
    },

    /**
     * 重命名会话
     *
     * @param sessionId - 会话 ID
     * @param title - 新标题
     */
    renameSession: (sessionId, title) => {
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s)),
      }))
    },

    /**
     * 加载会话的历史记录
     * 从服务端获取该会话的问题和回答数据
     * 如果会话已有内容则跳过加载
     *
     * @param sessionId - 会话 ID
     */
    loadSessionHistory: async (sessionId) => {
      const { sessions } = get()
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return

      // 如果已有内容，跳过加载
      const hasLoadedHistory = session.answers.length > 0 || session.question.length > 0
      if (hasLoadedHistory) return

      set({ isLoadingHistory: true })

      try {
        const userId = getUserId()
        const response = await arenaApi.getConversationHistory(userId, sessionId)

        if ((response.code === 0 || response.code === 200) && response.data) {
          const historyData = response.data
          const { answers, priIdMapping } = convertHistoryToAnswers(historyData)
          const votedAnswer = answers.find((a: Answer & { liked?: boolean }) => a.liked)

          // 更新会话数据
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    question: historyData.question || '',
                    answers,
                    priIdMapping,
                    votedAnswerId: votedAnswer?.id || null,
                    serverQuestionId: historyData.sessionId,
                  }
                : s
            ),
          }))
          console.log('[loadSessionHistory] state updated')
        }
      } catch (error) {
        console.error('[ArenaStore] loadSessionHistory failed:', error)
      } finally {
        set({ isLoadingHistory: false })
      }
    },
  }
}

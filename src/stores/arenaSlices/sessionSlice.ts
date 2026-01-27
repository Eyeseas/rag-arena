import type { StateCreator } from 'zustand'
import type { ArenaSessionSlice, ArenaState } from '../arenaStoreTypes'
import type { Answer, HistoryChatVO, ChatRespWithLikedVO } from '@/types/arena'
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
    const fullContent = chatList
      .map((chat: ChatRespWithLikedVO) => {
        if (!chat.choices || chat.choices.length === 0) return ''
        return chat.choices.map(c => c.delta?.content || '').join('')
      })
      .join('')
    
    const lastChat = chatList[chatList.length - 1]
    const citations = lastChat?.citations || []
    const liked = chatList.some((chat: ChatRespWithLikedVO) => chat.liked)
    const privateId = lastChat?.privateId
    
    if (privateId) {
      priIdMapping[maskCode] = privateId
    }
    
    answers.push({
      id: privateId || createId(),
      content: fullContent,
      providerId,
      citations,
      liked,
    } as Answer & { liked?: boolean })
  }
  
  const sortedAnswers = answers.sort((a, b) => {
    const order = ['A', 'B', 'C', 'D']
    return order.indexOf(a.providerId) - order.indexOf(b.providerId)
  })
  
  return { answers: sortedAnswers, priIdMapping }
}

export const createSessionSlice: StateCreator<ArenaState, [], [], ArenaSessionSlice> = (set, get) => {
  return {
    isLoadingHistory: false,

    startNewSession: async () => {
      const { activeTaskId, sessions } = get()

      const newSession = createEmptySession(activeTaskId)

      const taskSessions = getTaskSessions(sessions, activeTaskId)
      let nextSessions = [newSession, ...sessions]

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

      touchTask(set, activeTaskId)
      return newSession.id
    },

    setActiveSessionId: (sessionId) => {
      const { sessions } = get()
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return

      set((state) => ({
        activeSessionId: sessionId,
        activeTaskId: session.taskId,
        tasks: state.tasks.map((t) => (t.id === session.taskId ? { ...t, expanded: true } : t)),
      }))
    },

    deleteSession: (sessionId) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId)
        if (!session) return state

        const remaining = state.sessions.filter((s) => s.id !== sessionId)
        const taskSessions = getTaskSessions(remaining, session.taskId)

        if (taskSessions.length === 0) {
          const newSession = createEmptySession(session.taskId)
          return {
            ...state,
            sessions: [...remaining, newSession],
            activeSessionId:
              state.activeSessionId === sessionId ? newSession.id : state.activeSessionId,
          }
        }

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

    renameSession: (sessionId, title) => {
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s)),
      }))
    },

    loadSessionHistory: async (sessionId) => {
      const { sessions } = get()
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return

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

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    question: historyData.question || '',
                    title: historyData.question ? (historyData.question.length > 24 ? `${historyData.question.slice(0, 24)}…` : historyData.question) : s.title,
                    answers,
                    priIdMapping,
                    votedAnswerId: votedAnswer?.id || null,
                    serverQuestionId: historyData.sessionId,
                    updatedAt: Date.now(),
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

import type { StateCreator } from 'zustand'
import type { Answer } from '@/types/arena'
import type { ArenaAnswerSlice, ArenaState } from '../arenaStoreTypes'
import type { ArenaSession } from '../arenaTypes'
import { createEmptySession, toSessionTitle } from '../arenaHelpers'

export const createAnswerSlice: StateCreator<ArenaState, [], [], ArenaAnswerSlice> = (set, get) => {
  // 辅助函数：更新当前会话
  const updateActiveSession = (updater: (session: ArenaSession) => ArenaSession) => {
    const { activeSessionId, sessions } = get()
    const nextSessions = sessions.map((s) => (s.id === activeSessionId ? updater(s) : s))
    set({ sessions: nextSessions })
  }

  // 辅助函数：更新任务的 updatedAt
  const touchTask = (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, updatedAt: Date.now() } : t)),
    }))
  }

  return {
    // ========== Question/Answer Actions ==========

    startSessionWithQuestion: async (question) => {
      const { activeTaskId, activeSessionId, sessions } = get()
      const active = sessions.find((s) => s.id === activeSessionId)
      const safeQuestion = question.trim()

      // 如果当前会话已有内容，创建新会话
      const shouldCreateNew =
        !active ||
        active.question.trim().length > 0 ||
        active.answers.length > 0 ||
        active.votedAnswerId

      if (shouldCreateNew) {
        // 不调用接口，只创建本地会话（等待发送问题时再创建）
        const newSession = createEmptySession(activeTaskId, {
          question: safeQuestion,
        })
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
        }))
        touchTask(activeTaskId)
        return newSession.id
      }

      // 更新当前会话（保留priIdMapping）
      updateActiveSession((s) => ({
        ...s,
        question: safeQuestion,
        title: toSessionTitle(safeQuestion),
        updatedAt: Date.now(),
        serverQuestionId: null,
        answers: [],
        votedAnswerId: null,
        // 保留priIdMapping
        priIdMapping: s.priIdMapping,
      }))
      touchTask(activeTaskId)
      return activeSessionId
    },

    setServerQuestionId: (questionId) => {
      updateActiveSession((s) => ({ ...s, serverQuestionId: questionId, updatedAt: Date.now() }))
    },

    setAnswers: (answers) => {
      updateActiveSession((s) => ({ ...s, answers, updatedAt: Date.now() }))
    },

    appendAnswerDelta: (answerId, delta) => {
      updateActiveSession((s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) =>
          answer.id === answerId ? { ...answer, content: `${answer.content}${delta}` } : answer
        ),
      }))
    },

    finalizeAnswer: (answerId, patch: Partial<Answer>) => {
      updateActiveSession((s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) =>
          answer.id === answerId ? { ...answer, ...patch, error: undefined } : answer
        ),
      }))
    },

    setAnswerError: (answerId, message) => {
      updateActiveSession((s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) => (answer.id === answerId ? { ...answer, error: message } : answer)),
      }))
    },

    setLoading: (isLoading) => set({ isLoading }),

    setVotedAnswerId: (answerId) => {
      updateActiveSession((s) => ({ ...s, votedAnswerId: answerId, updatedAt: Date.now() }))
    },

    setVoting: (isVoting) => set({ isVoting }),
  }
}

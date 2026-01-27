import type { StateCreator } from 'zustand'
import type { Answer } from '@/types/arena'
import type { ArenaAnswerSlice, ArenaState } from '../arenaStoreTypes'
import { createEmptySession, toSessionTitle } from '../arenaHelpers'
import { touchTask, updateActiveSession } from './internalHelpers'
import { truncateStreamContent } from '@/lib/streamTruncate'

export const createAnswerSlice: StateCreator<ArenaState, [], [], ArenaAnswerSlice> = (set, get) => {
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
        touchTask(set, activeTaskId)
        return newSession.id
      }

      // 更新当前会话（保留priIdMapping）
      updateActiveSession(set, get, (s) => ({
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
      touchTask(set, activeTaskId)
      return activeSessionId
    },

    setServerQuestionId: (questionId) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        serverQuestionId: questionId,
        updatedAt: Date.now(),
      }))
    },

    setAnswers: (answers) => {
      updateActiveSession(set, get, (s) => ({ ...s, answers, updatedAt: Date.now() }))
    },

    appendAnswerDelta: (answerId, delta) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) =>
          answer.id === answerId
            ? { ...answer, content: truncateStreamContent(`${answer.content}${delta}`) }
            : answer
        ),
      }))
    },

    finalizeAnswer: (answerId, patch: Partial<Answer>) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) =>
          answer.id === answerId ? { ...answer, ...patch, error: undefined } : answer
        ),
      }))
    },

    setAnswerError: (answerId, message) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) => (answer.id === answerId ? { ...answer, error: message } : answer)),
      }))
    },

    setLoading: (isLoading) => set({ isLoading }),

    setVotedAnswerId: (answerId) => {
      updateActiveSession(set, get, (s) => ({ ...s, votedAnswerId: answerId, updatedAt: Date.now() }))
    },

    setVoting: (isVoting) => set({ isVoting }),
  }
}

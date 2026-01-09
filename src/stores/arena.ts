// Arena Store - RAG 问答竞技场状态管理（支持任务-会话两级结构）

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Answer, Task } from '@/types/arena'

// ============================================================================
// 类型定义
// ============================================================================

export interface ArenaSession {
  /** 本地会话 ID */
  id: string
  /** 所属任务 ID */
  taskId: string
  /** 会话标题（用于列表展示） */
  title: string
  /** 创建时间（毫秒时间戳） */
  createdAt: number
  /** 更新时间（毫秒时间戳） */
  updatedAt: number

  /** 当前问题 */
  question: string
  /** 服务端问题 ID（可能为空） */
  serverQuestionId: string | null
  /** 回答列表 */
  answers: Answer[]
  /** 已点赞的回答 ID */
  votedAnswerId: string | null
}

interface ArenaState {
  /** 任务列表 */
  tasks: Task[]
  /** 历史会话列表 */
  sessions: ArenaSession[]
  /** 当前任务 ID */
  activeTaskId: string
  /** 当前会话 ID */
  activeSessionId: string
  /** 加载状态（流式生成中） */
  isLoading: boolean
  /** 点赞加载状态 */
  isVoting: boolean

  // Task Actions
  createTask: (title?: string) => string
  deleteTask: (taskId: string) => void
  renameTask: (taskId: string, title: string) => void
  toggleTaskExpanded: (taskId: string) => void
  setActiveTaskId: (taskId: string) => void

  // Session Actions
  startNewSession: () => string
  setActiveSessionId: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  renameSession: (sessionId: string, title: string) => void

  // Question/Answer Actions
  startSessionWithQuestion: (question: string) => string
  setServerQuestionId: (questionId: string | null) => void
  setAnswers: (answers: Answer[]) => void
  appendAnswerDelta: (answerId: string, delta: string) => void
  finalizeAnswer: (answerId: string, patch: Partial<Answer>) => void
  setAnswerError: (answerId: string, message: string) => void
  setLoading: (loading: boolean) => void
  setVotedAnswerId: (answerId: string | null) => void
  setVoting: (voting: boolean) => void
}

// ============================================================================
// 常量和工具函数
// ============================================================================

const MAX_TASKS = 20
const MAX_SESSIONS_PER_TASK = 50

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toSessionTitle(question: string) {
  const trimmed = question.trim()
  if (!trimmed) return '新会话'
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed
}

function createEmptyTask(partial?: Partial<Task>): Task {
  const now = Date.now()
  return {
    id: partial?.id || createId(),
    title: partial?.title || '新任务',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    expanded: partial?.expanded ?? true,
  }
}

function createEmptySession(taskId: string, partial?: Partial<ArenaSession>): ArenaSession {
  const now = Date.now()
  const id = partial?.id || createId()
  const question = partial?.question || ''
  return {
    id,
    taskId,
    title: partial?.title || toSessionTitle(question),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    question,
    serverQuestionId: partial?.serverQuestionId ?? null,
    answers: partial?.answers ?? [],
    votedAnswerId: partial?.votedAnswerId ?? null,
  }
}

// ============================================================================
// Store 实现
// ============================================================================

export const useArenaStore = create<ArenaState>()(
  persist(
    (set, get) => {
      // 初始化：创建默认任务和会话
      const initialTask = createEmptyTask({ title: '默认任务' })
      const initialSession = createEmptySession(initialTask.id)

      // 辅助函数：更新当前会话
      const updateActiveSession = (updater: (session: ArenaSession) => ArenaSession) => {
        const { activeSessionId, sessions } = get()
        const nextSessions = sessions.map((s) => (s.id === activeSessionId ? updater(s) : s))
        set({ sessions: nextSessions })
      }

      // 辅助函数：更新任务的 updatedAt
      const touchTask = (taskId: string) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, updatedAt: Date.now() } : t
          ),
        }))
      }

      return {
        // 初始状态
        tasks: [initialTask],
        sessions: [initialSession],
        activeTaskId: initialTask.id,
        activeSessionId: initialSession.id,
        isLoading: false,
        isVoting: false,

        // ========== Task Actions ==========

        createTask: (title) => {
          const newTask = createEmptyTask({ title: title || '新任务' })
          const newSession = createEmptySession(newTask.id)

          set((state) => {
            // 限制任务数量
            let tasks = [newTask, ...state.tasks]
            if (tasks.length > MAX_TASKS) {
              tasks = tasks.slice(0, MAX_TASKS)
            }
            return {
              tasks,
              sessions: [newSession, ...state.sessions],
              activeTaskId: newTask.id,
              activeSessionId: newSession.id,
            }
          })
          return newTask.id
        },

        deleteTask: (taskId) => {
          set((state) => {
            const remainingTasks = state.tasks.filter((t) => t.id !== taskId)
            const remainingSessions = state.sessions.filter((s) => s.taskId !== taskId)

            // 如果删除了所有任务，创建新的默认任务
            if (remainingTasks.length === 0) {
              const newTask = createEmptyTask({ title: '默认任务' })
              const newSession = createEmptySession(newTask.id)
              return {
                tasks: [newTask],
                sessions: [newSession],
                activeTaskId: newTask.id,
                activeSessionId: newSession.id,
              }
            }

            // 如果删除的是当前任务，切换到第一个任务
            let nextActiveTaskId = state.activeTaskId
            let nextActiveSessionId = state.activeSessionId

            if (state.activeTaskId === taskId) {
              nextActiveTaskId = remainingTasks[0].id
              const taskSessions = remainingSessions.filter((s) => s.taskId === nextActiveTaskId)
              nextActiveSessionId = taskSessions[0]?.id || ''

              // 如果新任务没有会话，创建一个
              if (!nextActiveSessionId) {
                const newSession = createEmptySession(nextActiveTaskId)
                return {
                  tasks: remainingTasks,
                  sessions: [...remainingSessions, newSession],
                  activeTaskId: nextActiveTaskId,
                  activeSessionId: newSession.id,
                }
              }
            }

            return {
              tasks: remainingTasks,
              sessions: remainingSessions,
              activeTaskId: nextActiveTaskId,
              activeSessionId: nextActiveSessionId,
            }
          })
        },

        renameTask: (taskId, title) => {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, title, updatedAt: Date.now() } : t
            ),
          }))
        },

        toggleTaskExpanded: (taskId) => {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, expanded: !t.expanded } : t
            ),
          }))
        },

        setActiveTaskId: (taskId) => {
          const { tasks, sessions } = get()
          const exists = tasks.some((t) => t.id === taskId)
          if (!exists) return

          // 切换到该任务的第一个会话
          const taskSessions = sessions
            .filter((s) => s.taskId === taskId)
            .sort((a, b) => b.updatedAt - a.updatedAt)

          set({
            activeTaskId: taskId,
            activeSessionId: taskSessions[0]?.id || '',
          })
        },

        // ========== Session Actions ==========

        startNewSession: () => {
          const { activeTaskId, sessions } = get()
          const newSession = createEmptySession(activeTaskId)

          // 限制每个任务的会话数量
          const taskSessions = sessions.filter((s) => s.taskId === activeTaskId)
          let nextSessions = [newSession, ...sessions]

          if (taskSessions.length >= MAX_SESSIONS_PER_TASK) {
            // 删除该任务下最旧的会话
            const oldestSession = taskSessions.sort((a, b) => a.updatedAt - b.updatedAt)[0]
            nextSessions = nextSessions.filter((s) => s.id !== oldestSession.id)
          }

          set({
            sessions: nextSessions,
            activeSessionId: newSession.id,
          })

          touchTask(activeTaskId)
          return newSession.id
        },

        setActiveSessionId: (sessionId) => {
          const { sessions, tasks } = get()
          const session = sessions.find((s) => s.id === sessionId)
          if (!session) return

          // 同时更新 activeTaskId 并展开该任务
          set((state) => ({
            activeSessionId: sessionId,
            activeTaskId: session.taskId,
            tasks: state.tasks.map((t) =>
              t.id === session.taskId ? { ...t, expanded: true } : t
            ),
          }))
        },

        deleteSession: (sessionId) => {
          set((state) => {
            const session = state.sessions.find((s) => s.id === sessionId)
            if (!session) return state

            const remaining = state.sessions.filter((s) => s.id !== sessionId)
            const taskSessions = remaining.filter((s) => s.taskId === session.taskId)

            // 如果任务下没有会话了，创建一个新的
            if (taskSessions.length === 0) {
              const newSession = createEmptySession(session.taskId)
              return {
                ...state,
                sessions: [...remaining, newSession],
                activeSessionId:
                  state.activeSessionId === sessionId ? newSession.id : state.activeSessionId,
              }
            }

            // 如果删除的是当前会话，切换到同任务下的第一个会话
            const nextActiveSessionId =
              state.activeSessionId === sessionId
                ? taskSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0].id
                : state.activeSessionId

            return {
              ...state,
              sessions: remaining,
              activeSessionId: nextActiveSessionId,
            }
          })
        },

        renameSession: (sessionId, title) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
            ),
          }))
        },

        // ========== Question/Answer Actions ==========

        startSessionWithQuestion: (question) => {
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
            const newSession = createEmptySession(activeTaskId, { question: safeQuestion })
            set((state) => ({
              sessions: [newSession, ...state.sessions],
              activeSessionId: newSession.id,
            }))
            touchTask(activeTaskId)
            return newSession.id
          }

          // 更新当前会话
          updateActiveSession((s) => ({
            ...s,
            question: safeQuestion,
            title: toSessionTitle(safeQuestion),
            updatedAt: Date.now(),
            serverQuestionId: null,
            answers: [],
            votedAnswerId: null,
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
              answer.id === answerId
                ? { ...answer, content: `${answer.content}${delta}` }
                : answer
            ),
          }))
        },

        finalizeAnswer: (answerId, patch) => {
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
            answers: s.answers.map((answer) =>
              answer.id === answerId ? { ...answer, error: message } : answer
            ),
          }))
        },

        setLoading: (isLoading) => set({ isLoading }),

        setVotedAnswerId: (answerId) => {
          updateActiveSession((s) => ({ ...s, votedAnswerId: answerId, updatedAt: Date.now() }))
        },

        setVoting: (isVoting) => set({ isVoting }),
      }
    },
    {
      name: 'arena-session-store',
      partialize: (state) => ({
        tasks: state.tasks,
        sessions: state.sessions,
        activeTaskId: state.activeTaskId,
        activeSessionId: state.activeSessionId,
      }),
      // 版本升级为 2，触发数据重置
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // 验证数据完整性
        const hasValidTasks = Array.isArray(state.tasks) && state.tasks.length > 0
        const hasValidSessions = Array.isArray(state.sessions) && state.sessions.length > 0

        if (!hasValidTasks || !hasValidSessions) {
          // 数据不完整，创建默认任务和会话
          const newTask = createEmptyTask({ title: '默认任务' })
          const newSession = createEmptySession(newTask.id)
          state.tasks = [newTask]
          state.sessions = [newSession]
          state.activeTaskId = newTask.id
          state.activeSessionId = newSession.id
          return
        }

        // 验证 activeTaskId 有效性
        if (!state.tasks.some((t) => t.id === state.activeTaskId)) {
          state.activeTaskId = state.tasks[0].id
        }

        // 验证 activeSessionId 有效性
        if (!state.sessions.some((s) => s.id === state.activeSessionId)) {
          const taskSessions = state.sessions.filter((s) => s.taskId === state.activeTaskId)
          state.activeSessionId = taskSessions[0]?.id || state.sessions[0].id
        }
      },
    }
  )
)

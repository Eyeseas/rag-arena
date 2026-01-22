// Arena Store - RAG 问答竞技场状态管理（支持任务-会话两级结构）

import { create } from 'zustand'
import type { Answer, CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'
import {
  MAX_SESSIONS_PER_TASK,
  MAX_TASKS,
  createEmptySession,
  createEmptyTask,
  toSessionTitle,
} from './arenaHelpers'
import { hydrateFromTaskListData } from './arenaServerAdapter'

// ============================================================================
// 类型定义
// ============================================================================

export type { ArenaSession } from './arenaTypes'

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
  /** 任务列表加载状态 */
  isTasksLoading: boolean
  /** 是否已从服务器获取过任务列表 */
  hasFetchedTasks: boolean

  // Server hydration (no network in store)
  setTasksLoading: (loading: boolean) => void
  applyTaskListFromServer: (data: CommonTreeDict[]) => void
  setHasFetchedTasks: (fetched: boolean) => void

  // Session server metadata helpers
  setSessionConversationInfo: (params: {
    localSessionId: string
    serverSessionId: string
    priIdMapping?: Record<string, string>
  }) => void

  // Task Actions
  createTask: (title?: string) => string
  deleteTask: (taskId: string) => void
  renameTask: (taskId: string, title: string) => void
  toggleTaskExpanded: (taskId: string) => void
  setActiveTaskId: (taskId: string) => void

  // Session Actions
  startNewSession: () => Promise<string>
  setActiveSessionId: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  renameSession: (sessionId: string, title: string) => void

  // Question/Answer Actions
  startSessionWithQuestion: (question: string) => Promise<string>
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

// Constants + helpers moved to arenaHelpers.ts

// ============================================================================
// Store 实现
// ============================================================================

export const useArenaStore = create<ArenaState>()((set, get) => {
    // 初始化：不创建默认任务和会话，等待从服务器获取

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
      // 初始状态：不持久化，从服务器获取
      tasks: [],
      sessions: [],
      activeTaskId: '',
      activeSessionId: '',
      isLoading: false,
      isVoting: false,
      isTasksLoading: false,
      hasFetchedTasks: false,

      // ========== Server Hydration ==========

      setTasksLoading: (isTasksLoading) => set({ isTasksLoading }),
      setHasFetchedTasks: (hasFetchedTasks) => set({ hasFetchedTasks }),
      applyTaskListFromServer: (data) => {
        const { tasks, sessions, activeTaskId, activeSessionId } = hydrateFromTaskListData(data, {
          tasks: get().tasks,
          sessions: get().sessions,
          activeTaskId: get().activeTaskId,
        })
        set({
          tasks,
          sessions,
          activeTaskId,
          activeSessionId,
        })
      },

      setSessionConversationInfo: ({ localSessionId, serverSessionId, priIdMapping }) => {
        set((state) => {
          const nextSessions: ArenaSession[] = []
          for (const s of state.sessions) {
            if (s.id === localSessionId) {
              nextSessions.push({
                ...s,
                id: serverSessionId,
                priIdMapping,
                // Keep question, but reset remote id + answers/vote to match old behavior.
                serverQuestionId: null,
                answers: [],
                votedAnswerId: null,
                updatedAt: Date.now(),
              })
              continue
            }
            // Avoid keeping a duplicate entry if server id already exists.
            if (s.id === serverSessionId) continue
            nextSessions.push(s)
          }

          return {
            sessions: nextSessions,
            activeSessionId:
              state.activeSessionId === localSessionId ? serverSessionId : state.activeSessionId,
          }
        })
      },

      // ========== Task Actions ==========

        createTask: (title) => {
          const newTask = createEmptyTask({ title: title || '新任务' })

          set((state) => {
            // 限制任务数量
            let tasks = [newTask, ...state.tasks]
            if (tasks.length > MAX_TASKS) {
              tasks = tasks.slice(0, MAX_TASKS)
            }
            return {
              tasks,
              activeTaskId: newTask.id,
              activeSessionId: '',
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
              return {
                tasks: [newTask],
                sessions: [],
                activeTaskId: newTask.id,
                activeSessionId: '',
              }
            }

              // 如果删除的是当前任务，切换到第一个任务
              let nextActiveTaskId = state.activeTaskId
              let nextActiveSessionId = ''

              if (state.activeTaskId === taskId) {
                nextActiveTaskId = remainingTasks[0].id
                const taskSessions = remainingSessions.filter((s) => s.taskId === nextActiveTaskId)
                nextActiveSessionId = taskSessions[0]?.id || ''
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

        startNewSession: async () => {
          const { activeTaskId, sessions } = get()
          
          // 不调用接口，只创建本地会话（空会话，等待用户输入问题后再创建）
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
          const { sessions } = get()
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
  })

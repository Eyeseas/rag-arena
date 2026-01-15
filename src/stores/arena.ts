// Arena Store - RAG 问答竞技场状态管理（支持任务-会话两级结构）

import { create } from 'zustand'
import type { Answer, Task } from '@/types/arena'
import { arenaApi } from '@/services/arena'

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
  /** 模型代码到priId的映射（从创建对话接口返回） */
  priIdMapping?: Record<string, string>
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
  /** 任务列表加载状态 */
  isTasksLoading: boolean
  /** 是否已从服务器获取过任务列表 */
  hasFetchedTasks: boolean

  // Task Actions
  createTask: (title?: string) => string
  deleteTask: (taskId: string) => void
  renameTask: (taskId: string, title: string) => void
  toggleTaskExpanded: (taskId: string) => void
  setActiveTaskId: (taskId: string) => void
  /** 从服务器获取任务列表 */
  fetchTasksFromServer: (userId: string, force?: boolean) => Promise<void>
  /** 从服务器获取指定任务的会话列表 */
  fetchSessionsForTask: (userId: string, taskId: string) => Promise<void>

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

const MAX_TASKS = 20
const MAX_SESSIONS_PER_TASK = 50

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// 获取 userId（从 localStorage 或使用默认值）
function getUserId(): string {
  const storedUserId = localStorage.getItem('userId')
  return storedUserId || 'default_user'
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
    priIdMapping: partial?.priIdMapping,
  }
}

// ============================================================================
// Store 实现
// ============================================================================

export const useArenaStore = create<ArenaState>()(
  (set, get) => {
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
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, updatedAt: Date.now() } : t
          ),
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
              
              // 获取新任务的会话列表
              if (nextActiveTaskId) {
                const userId = getUserId()
                setTimeout(() => {
                  get().fetchSessionsForTask(userId, nextActiveTaskId)
                }, 0)
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

        // ========== Server Task Actions ==========

        fetchTasksFromServer: async (userId: string, force = false) => {
          const { hasFetchedTasks, isTasksLoading } = get()
          // 如果正在加载，直接返回（防止重复调用）
          // force=true 时强制刷新，忽略 hasFetchedTasks 标志
          if (isTasksLoading || (!force && hasFetchedTasks)) {
            console.log('[ArenaStore] fetchTasksFromServer skipped: already loading or fetched')
            return
          }
          
          set({ isTasksLoading: true })
          try {
            const response = await arenaApi.getTaskList(userId)
            console.log('[ArenaStore] fetchTasksFromServer response:', response)
            // 接口返回 code: 200 表示成功，code: 0 也表示成功（兼容两种格式）
            if ((response.code === 200 || response.code === 0) && Array.isArray(response.data)) {
              // 将服务器返回的任务列表转换为本地 Task 格式
              const serverTasks: Task[] = []
              const serverSessions: ArenaSession[] = []
              
              // 遍历任务列表，解析任务和会话
              response.data.forEach((item) => {
                // 只处理任务（leaf: false）
                if (!item.leaf) {
                  // 检查是否已存在该任务（通过 id 匹配）
                  const existingTask = get().tasks.find((t) => t.id === item.id)
                  if (existingTask) {
                    // 如果已存在，更新标题，保留其他属性
                    serverTasks.push({
                      ...existingTask,
                      title: item.val,
                      updatedAt: Date.now(),
                    })
                  } else {
                    // 如果不存在，创建新任务
                    serverTasks.push(
                      createEmptyTask({
                        id: item.id,
                        title: item.val,
                        expanded: true,
                      })
                    )
                  }
                  
                  // 解析该任务下的会话（children）
                  if (item.children && Array.isArray(item.children)) {
                    item.children.forEach((child) => {
                      // 只处理会话（leaf: true）
                      if (child.leaf) {
                        const existingSession = get().sessions.find((s) => s.id === child.id)
                        if (existingSession) {
                          // 如果已存在，更新标题，保留其他属性
                          serverSessions.push({
                            ...existingSession,
                            taskId: item.id,
                            title: child.val,
                            updatedAt: Date.now(),
                          })
                        } else {
                          // 如果不存在，创建新会话
                          serverSessions.push(
                            createEmptySession(item.id, {
                              id: child.id,
                              title: child.val,
                            })
                          )
                        }
                      }
                    })
                  }
                }
              })

              // 只使用服务器返回的任务和会话，不保留本地数据（避免显示 mock 数据）
              const mergedTasks = serverTasks

              // 如果当前 activeTaskId 不在新列表中，切换到第一个任务
              const currentActiveTaskId = get().activeTaskId
              const hasActiveTask = mergedTasks.some((t) => t.id === currentActiveTaskId)

              // 如果服务器返回的任务列表为空，保留至少一个默认任务
              if (mergedTasks.length === 0) {
                const defaultTask = createEmptyTask({ title: '默认任务' })
                set({
                  tasks: [defaultTask],
                  sessions: [],
                  isTasksLoading: false,
                  hasFetchedTasks: true,
                  activeTaskId: defaultTask.id,
                  activeSessionId: '',
                })
              } else {
                // 设置第一个任务为活动任务
                const firstTaskId = hasActiveTask ? currentActiveTaskId : mergedTasks[0]?.id
                
                // 获取第一个任务的会话列表
                const firstTaskSessions = serverSessions.filter((s) => s.taskId === firstTaskId)
                const firstSessionId = firstTaskSessions[0]?.id || ''
                
                set({
                  tasks: mergedTasks,
                  sessions: serverSessions,
                  isTasksLoading: false,
                  hasFetchedTasks: true,
                  activeTaskId: firstTaskId,
                  activeSessionId: firstSessionId,
                })
              }
            } else {
              console.warn('[ArenaStore] Invalid task list response:', response)
              set({ isTasksLoading: false, hasFetchedTasks: true })
            }
          } catch (error) {
            console.error('[ArenaStore] Failed to fetch tasks from server:', error)
            set({ isTasksLoading: false, hasFetchedTasks: true })
          }
        },

        // ========== Fetch Sessions for Task ==========

        fetchSessionsForTask: async (userId: string, taskId: string) => {
          try {
            // 重新获取任务列表，以获取最新的会话数据
            const response = await arenaApi.getTaskList(userId)
            
            if ((response.code === 200 || response.code === 0) && Array.isArray(response.data)) {
              // 找到对应的任务
              const taskItem = response.data.find((item) => item.id === taskId && !item.leaf)
              
              if (taskItem && taskItem.children && Array.isArray(taskItem.children)) {
                // 解析该任务下的会话
                const taskSessions: ArenaSession[] = taskItem.children
                  .filter((child) => child.leaf)
                  .map((child) => {
                    const existingSession = get().sessions.find((s) => s.id === child.id)
                    if (existingSession) {
                      // 如果已存在，更新标题，保留其他属性
                      return {
                        ...existingSession,
                        taskId: taskId,
                        title: child.val,
                        updatedAt: Date.now(),
                      }
                    } else {
                      // 如果不存在，创建新会话
                      return createEmptySession(taskId, {
                        id: child.id,
                        title: child.val,
                      })
                    }
                  })
                
                set((state) => {
                  // 移除该任务下的旧会话，添加新获取的会话
                  const otherSessions = state.sessions.filter((s) => s.taskId !== taskId)
                  const allSessions = [...taskSessions, ...otherSessions]
                  
                  // 如果当前活动会话不在新列表中，选择第一个会话
                  const currentSession = allSessions.find((s) => s.id === state.activeSessionId)
                  const firstSession = taskSessions[0]
                  
                  return {
                    sessions: allSessions,
                    activeSessionId: currentSession?.id || firstSession?.id || '',
                  }
                })
              } else {
                // 如果任务不存在或没有会话，清空该任务的会话
                set((state) => {
                  const otherSessions = state.sessions.filter((s) => s.taskId !== taskId)
                  return {
                    sessions: otherSessions,
                    activeSessionId: state.activeSessionId === taskId ? '' : state.activeSessionId,
                  }
                })
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            void userId // 保留参数，用于后续可能的接口调用
          } catch (error) {
            console.error('[ArenaStore] Failed to fetch sessions for task:', error)
          }
        },
      }
    }
  )

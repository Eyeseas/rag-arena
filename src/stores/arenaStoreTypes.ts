// Arena store state + actions expressed as composable slices.
//
// Keep this file implementation-free so slice modules can import types without
// causing circular runtime dependencies.

import type { Answer, CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'

export interface ArenaCoreState {
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
}

export interface ArenaHydrationSlice {
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
}

export interface ArenaTaskSlice {
  // Task Actions
  createTask: (title?: string) => string
  deleteTask: (taskId: string) => void
  renameTask: (taskId: string, title: string) => void
  toggleTaskExpanded: (taskId: string) => void
  setActiveTaskId: (taskId: string) => void
}

export interface ArenaSessionSlice {
  // Session Actions
  startNewSession: () => Promise<string>
  setActiveSessionId: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  renameSession: (sessionId: string, title: string) => void
}

export interface ArenaAnswerSlice {
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

export type ArenaState =
  & ArenaCoreState
  & ArenaHydrationSlice
  & ArenaTaskSlice
  & ArenaSessionSlice
  & ArenaAnswerSlice

// Arena store state + actions expressed as composable slices.
//
// Keep this file implementation-free so slice modules can import types without
// causing circular runtime dependencies.

import type { Answer, CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'

export interface ArenaCoreState {
  tasks: Task[]
  sessions: ArenaSession[]
  activeTaskId: string
  activeSessionId: string
  isLoading: boolean
  isVoting: boolean
  isTasksLoading: boolean
  hasFetchedTasks: boolean
  isLoadingHistory: boolean
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
  startNewSession: () => Promise<string>
  setActiveSessionId: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  renameSession: (sessionId: string, title: string) => void
  loadSessionHistory: (sessionId: string) => Promise<void>
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

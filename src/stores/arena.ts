// Arena Store - RAG 问答竞技场状态管理（支持任务-会话两级结构）
//
// Store implementation is split into domain slices to reduce coupling and keep
// the main entry file small.

import { create } from 'zustand'
import type { ArenaState } from './arenaStoreTypes'
import { createHydrationSlice } from './arenaSlices/hydrationSlice'
import { createTaskSlice } from './arenaSlices/taskSlice'
import { createSessionSlice } from './arenaSlices/sessionSlice'
import { createAnswerSlice } from './arenaSlices/answerSlice'

export type { ArenaSession } from './arenaTypes'

export const useArenaStore = create<ArenaState>()((set, get, api) => ({
  tasks: [],
  sessions: [],
  activeTaskId: '',
  activeSessionId: '',
  isLoading: false,
  isVoting: false,
  isTasksLoading: false,
  hasFetchedTasks: false,
  isLoadingHistory: false,

  ...createHydrationSlice(set, get, api),
  ...createTaskSlice(set, get, api),
  ...createSessionSlice(set, get, api),
  ...createAnswerSlice(set, get, api),
}))

import type { StateCreator } from 'zustand'
import type { ArenaHydrationSlice, ArenaState } from '../arenaStoreTypes'
import { hydrateFromTaskListData } from '../arenaServerAdapter'
import type { ArenaSession } from '../arenaTypes'

export const createHydrationSlice: StateCreator<ArenaState, [], [], ArenaHydrationSlice> = (
  set,
  get
) => ({
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
})

import type { StateCreator } from 'zustand'
import type { ArenaSessionSlice, ArenaState } from '../arenaStoreTypes'
import { MAX_SESSIONS_PER_TASK, createEmptySession } from '../arenaHelpers'

export const createSessionSlice: StateCreator<ArenaState, [], [], ArenaSessionSlice> = (set, get) => {
  // 辅助函数：更新任务的 updatedAt
  const touchTask = (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, updatedAt: Date.now() } : t)),
    }))
  }

  return {
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
        tasks: state.tasks.map((t) => (t.id === session.taskId ? { ...t, expanded: true } : t)),
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
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s)),
      }))
    },
  }
}

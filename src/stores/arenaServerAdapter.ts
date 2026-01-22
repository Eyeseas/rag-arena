// Pure mapping utilities for server task list -> store state.

import type { CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'
import { createEmptySession, createEmptyTask } from './arenaHelpers'

export interface TaskListHydrationResult {
  tasks: Task[]
  sessions: ArenaSession[]
  activeTaskId: string
  activeSessionId: string
}

/**
 * Convert /task/list tree response into Task[] + ArenaSession[].
 * Keeps UI-expanded state and local session payload if ids match.
 */
export function hydrateFromTaskListData(
  data: CommonTreeDict[],
  prev: {
    tasks: Task[]
    sessions: ArenaSession[]
    activeTaskId: string
  }
): TaskListHydrationResult {
  const prevTaskById = new Map(prev.tasks.map((t) => [t.id, t]))
  const prevSessionById = new Map(prev.sessions.map((s) => [s.id, s]))

  const nextTasks: Task[] = []
  const nextSessions: ArenaSession[] = []

  for (const item of data) {
    if (item.leaf) continue

    const existingTask = prevTaskById.get(item.id)
    nextTasks.push(
      existingTask
        ? { ...existingTask, title: item.val, updatedAt: Date.now() }
        : createEmptyTask({ id: item.id, title: item.val, expanded: true })
    )

    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        if (!child.leaf) continue

        const existingSession = prevSessionById.get(child.id)
        nextSessions.push(
          existingSession
            ? {
                ...existingSession,
                taskId: item.id,
                title: child.val,
                updatedAt: Date.now(),
              }
            : createEmptySession(item.id, { id: child.id, title: child.val })
        )
      }
    }
  }

  if (nextTasks.length === 0) {
    const defaultTask = createEmptyTask({ title: '默认任务' })
    return {
      tasks: [defaultTask],
      sessions: [],
      activeTaskId: defaultTask.id,
      activeSessionId: '',
    }
  }

  const keepActiveTask = nextTasks.some((t) => t.id === prev.activeTaskId)
  const activeTaskId = keepActiveTask ? prev.activeTaskId : nextTasks[0].id
  const activeSessionId = nextSessions.find((s) => s.taskId === activeTaskId)?.id || ''

  return {
    tasks: nextTasks,
    sessions: nextSessions,
    activeTaskId,
    activeSessionId,
  }
}

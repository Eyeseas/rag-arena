// Pure selectors for Arena store state.
//
// Keep these selectors store-implementation-agnostic so consumers don't depend
// on the exact internal shape (arrays vs maps, etc.).

import type { Answer, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'
import { byUpdatedAtDesc } from './arenaSort'

export function selectSessionById(state: { sessions: ArenaSession[] }, sessionId: string): ArenaSession | null {
  return state.sessions.find((s) => s.id === sessionId) || null
}

export function selectActiveSession(state: {
  sessions: ArenaSession[]
  activeSessionId: string
}): ArenaSession | null {
  if (!state.activeSessionId) return null
  return selectSessionById(state, state.activeSessionId)
}

export function selectTaskById(state: { tasks: Task[] }, taskId: string): Task | null {
  return state.tasks.find((t) => t.id === taskId) || null
}

export function selectActiveTask(state: { tasks: Task[]; activeTaskId: string }): Task | null {
  if (!state.activeTaskId) return null
  return selectTaskById(state, state.activeTaskId)
}

export function selectTaskSessionsSorted(state: { sessions: ArenaSession[] }, taskId: string) {
  return state.sessions
    .filter((s) => s.taskId === taskId)
    .sort(byUpdatedAtDesc)
}

export function selectTasksSorted(state: { tasks: Task[] }): Task[] {
  return [...state.tasks].sort(byUpdatedAtDesc)
}

export function selectAnswerById(answers: readonly Answer[], answerId: string): Answer | null {
  return answers.find((a) => a.id === answerId) || null
}

export function selectCitationsCount(answers: readonly Answer[]): number {
  return answers.reduce((sum, a) => sum + (a.citations?.length || 0), 0)
}

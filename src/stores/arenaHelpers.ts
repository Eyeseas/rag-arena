import type { Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'

export const MAX_TASKS = 20
export const MAX_SESSIONS_PER_TASK = 50

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function toSessionTitle(question: string) {
  const trimmed = question.trim()
  if (!trimmed) return '新会话'
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed
}

export function createEmptyTask(partial?: Partial<Task>): Task {
  const now = Date.now()
  return {
    id: partial?.id || createId(),
    title: partial?.title || '新任务',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    expanded: partial?.expanded ?? true,
  }
}

export function createEmptySession(taskId: string, partial?: Partial<ArenaSession>): ArenaSession {
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

// Arena store domain types shared across modules.

import type { Answer } from '@/types/arena'

export interface ArenaSession {
  /** Local/session identifier. May be replaced by a server session id. */
  id: string
  /** Owning task id */
  taskId: string
  /** Title shown in sidebar */
  title: string
  /** Created timestamp (ms) */
  createdAt: number
  /** Updated timestamp (ms) */
  updatedAt: number

  /** Current question */
  question: string
  /** Server-side question id (may be empty) */
  serverQuestionId: string | null
  /** Answers */
  answers: Answer[]
  /** Voted answer id */
  votedAnswerId: string | null
  /** Mapping from model maskCode -> priId (from conv/create) */
  priIdMapping?: Record<string, string>
}

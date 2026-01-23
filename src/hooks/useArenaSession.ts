/**
 * useArenaSession - 当前会话状态选择器
 *
 * 提供当前会话的状态和常用计算属性
 */

import { useShallow } from 'zustand/react/shallow'
import { useArenaStore, type ArenaSession } from '@/stores/arena'
import { selectActiveSession, selectCitationsCount } from '@/stores/arenaSelectors'

/**
 * 当前会话状态 Hook 返回值
 */
export interface UseArenaSessionReturn {
  /** 当前会话 ID */
  activeSessionId: string
  /** 当前会话对象（可能为 null） */
  activeSession: ArenaSession | null
  /** 当前问题 */
  question: string
  /** 服务端问题 ID */
  questionId: string | null
  /** 回答列表 */
  answers: ArenaSession['answers']
  /** 已投票的回答 ID */
  votedAnswerId: string | null
  /** 是否有回答 */
  hasAnswers: boolean
  /** 是否处于活跃状态（有回答或加载中） */
  isActive: boolean
  /** 引用总数 */
  citationsCount: number
  /** 加载状态 */
  isLoading: boolean
}

/**
 * 获取当前会话状态的 Hook
 *
 * @returns 当前会话状态
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { question, answers, hasAnswers, citationsCount } = useArenaSession()
 *
 *   return (
 *     <div>
 *       <p>问题: {question}</p>
 *       <p>回答数: {answers.length}</p>
 *       <p>引用数: {citationsCount}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useArenaSession(): UseArenaSessionReturn {
  const { isLoading, activeSessionId, activeSession } = useArenaStore(
    useShallow((s) => ({
      isLoading: s.isLoading,
      activeSessionId: s.activeSessionId,
      activeSession: selectActiveSession(s),
    }))
  )

  const question = activeSession?.question || ''
  const questionId = activeSession?.serverQuestionId || null
  const answers = activeSession?.answers || []
  const votedAnswerId = activeSession?.votedAnswerId || null
  const hasAnswers = answers.length > 0
  const isActive = hasAnswers || isLoading
  const citationsCount = selectCitationsCount(answers)

  return {
    activeSessionId,
    activeSession,
    question,
    questionId,
    answers,
    votedAnswerId,
    hasAnswers,
    isActive,
    citationsCount,
    isLoading,
  }
}

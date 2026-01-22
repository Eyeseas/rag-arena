/**
 * useArenaQuestion - 提问流程 Hook
 *
 * 封装问题提交、SSE 流式响应处理等逻辑
 */

import { useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import type { DateRange } from '@/types/common'
import { useDeltaBuffer } from './useDeltaBuffer'

import { getUserId } from './arenaQuestion/userId'
import { runLegacyArenaQuestionStream } from './arenaQuestion/legacyFlow'
import { runConversationMultiModelStream } from './arenaQuestion/conversationFlow'

/**
 * 提问流程 Hook 返回值
 */
export interface UseArenaQuestionReturn {
  /** 提交问题 */
  submitQuestion: (question: string, dateRange?: DateRange) => Promise<void>
  /** 重新提问（开始新会话） */
  resetQuestion: () => Promise<void>
  /** 加载状态 */
  isLoading: boolean
}

/**
 * 提问流程 Hook
 *
 * @returns 提问流程相关方法和状态
 *
 * @example
 * ```tsx
 * function QuestionForm() {
 *   const { submitQuestion, resetQuestion, isLoading } = useArenaQuestion()
 *
 *   const handleSubmit = async (q: string) => {
 *     await submitQuestion(q, dateRange)
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input disabled={isLoading} />
 *       <button type="submit">提交</button>
 *       <button type="button" onClick={resetQuestion}>重置</button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useArenaQuestion(): UseArenaQuestionReturn {
  const {
    isLoading,
    activeTaskId,
    activeSessionId,
    setAnswers,
    appendAnswerDelta,
    finalizeAnswer,
    setAnswerError,
    setLoading,
    startNewSession,
    startSessionWithQuestion,
    setServerQuestionId,
    setSessionConversationInfo,
  } = useArenaStore()

  // 使用 delta 缓冲区优化性能
  const { addDelta, flush, clear } = useDeltaBuffer((buffer) => {
    for (const [answerId, delta] of buffer) {
      if (delta) appendAnswerDelta(answerId, delta)
    }
  })

  const submitQuestion = useCallback(
    async (question: string, dateRange?: DateRange) => {
      const trimmed = question.trim()
      if (!trimmed) return

      await startSessionWithQuestion(trimmed)
      setLoading(true)
      clear()

      // If tasks are available, use the conversation-based streaming flow.
      // This mirrors the previous logic that lived inside QuestionInput.
      const shouldUseConversation = Boolean(activeTaskId)

      try {
        if (!shouldUseConversation) {
          await runLegacyArenaQuestionStream({
            question: trimmed,
            dateRange,
            setServerQuestionId,
            setAnswers,
            addDelta,
            flush,
            finalizeAnswer,
            setAnswerError,
          })
          return
        }

        // Conversation stream: /api/conv/create + /api/conv/chat (multi-model)
        await runConversationMultiModelStream({
          question: trimmed,
          dateRange,
          userId: getUserId(),
          activeTaskId,
          activeSessionId,
          setSessionConversationInfo,
          setServerQuestionId,
          setAnswers,
          addDelta,
          flush,
          finalizeAnswer,
          setAnswerError,
        })
      } catch (error) {
        message.error(error instanceof Error ? error.message : '获取回答失败，请重试')
        setServerQuestionId(null)

        // Legacy path cleared answer cards; conversation path kept them.
        if (!shouldUseConversation) {
          setAnswers([])
        }
      } finally {
        setLoading(false)
      }
    },
    [
      activeTaskId,
      activeSessionId,
      addDelta,
      startSessionWithQuestion,
      setLoading,
      setServerQuestionId,
      setAnswers,
      flush,
      clear,
      finalizeAnswer,
      setAnswerError,
      setSessionConversationInfo,
    ]
  )

  const resetQuestion = useCallback(async () => {
    if (isLoading) return
    await startNewSession()
  }, [isLoading, startNewSession])

  return {
    submitQuestion,
    resetQuestion,
    isLoading,
  }
}

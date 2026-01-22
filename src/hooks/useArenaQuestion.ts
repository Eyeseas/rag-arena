/**
 * useArenaQuestion - 提问流程 Hook
 *
 * 封装问题提交、SSE 流式响应处理等逻辑
 */

import { useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import { arenaApi } from '@/services/arena'
import type { DateRange } from '@/types/common'
import { useDeltaBuffer } from './useDeltaBuffer'

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
    setAnswers,
    appendAnswerDelta,
    finalizeAnswer,
    setAnswerError,
    setLoading,
    startNewSession,
    startSessionWithQuestion,
    setServerQuestionId,
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

      try {
        setServerQuestionId(null)
        setAnswers([])

        await arenaApi.submitQuestionStream(trimmed, dateRange, {
          onMeta: (meta) => {
            setServerQuestionId(meta.questionId)
            setAnswers(
              meta.answers.map((a) => ({
                id: a.answerId,
                providerId: a.providerId,
                content: '',
              }))
            )
          },
          onDelta: (e) => {
            addDelta(e.answerId, e.delta)
          },
          onAnswerDone: (e) => {
            flush()
            finalizeAnswer(e.answerId, {
              content: e.content,
              citations: e.citations,
            })
          },
          onAnswerError: (e) => {
            flush()
            setAnswerError(e.answerId, e.message)
          },
          onDone: (e) => {
            flush()
            if (!e.ok) {
              throw new Error(e.message || '获取回答失败，请重试')
            }
          },
        })
      } catch (error) {
        message.error(error instanceof Error ? error.message : '获取回答失败，请重试')
        setServerQuestionId(null)
        setAnswers([])
      } finally {
        setLoading(false)
      }
    },
    [
      startSessionWithQuestion,
      setLoading,
      setServerQuestionId,
      setAnswers,
      addDelta,
      flush,
      clear,
      finalizeAnswer,
      setAnswerError,
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

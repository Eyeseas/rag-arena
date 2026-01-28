/**
 * useArenaQuestion - 提问流程 Hook
 *
 * 封装问题提交、SSE 流式响应处理等逻辑
 */

import { useCallback } from 'react'
import { message } from 'antd'
import { useShallow } from 'zustand/react/shallow'
import { useArenaStore } from '@/stores/arena'
import { selectSessionById } from '@/stores/arenaSelectors'
import type { DateRange } from '@/types/common'
import { useDeltaBuffer } from './useDeltaBuffer'

import { getUserId } from './arenaQuestion/userId'
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
  const { isLoading, activeTaskId } = useArenaStore(
    useShallow((s) => ({
      isLoading: s.isLoading,
      activeTaskId: s.activeTaskId,
    }))
  )

  const setAnswers = useArenaStore((s) => s.setAnswers)
  const appendAnswerDelta = useArenaStore((s) => s.appendAnswerDelta)
  const finalizeAnswer = useArenaStore((s) => s.finalizeAnswer)
  const setAnswerError = useArenaStore((s) => s.setAnswerError)
  const setLoading = useArenaStore((s) => s.setLoading)
  const startNewSession = useArenaStore((s) => s.startNewSession)
  const startSessionWithQuestion = useArenaStore((s) => s.startSessionWithQuestion)
  const setServerQuestionId = useArenaStore((s) => s.setServerQuestionId)
  const setSessionConversationInfo = useArenaStore((s) => s.setSessionConversationInfo)
  const createTask = useArenaStore((s) => s.createTask)

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

      // 如果没有活动任务，从任务列表获取第一个任务的 id
      let taskId = activeTaskId
      if (!taskId) {
        const tasks = useArenaStore.getState().tasks
        if (tasks.length > 0) {
          taskId = tasks[0].id
        } else {
          taskId = createTask('默认任务')
        }
      }

      const sessionId = await startSessionWithQuestion(trimmed)
      setLoading(true)
      clear()

      try {
        await runConversationMultiModelStream({
          question: trimmed,
          dateRange,
          userId: getUserId(),
          activeTaskId: taskId,
          activeSessionId: sessionId,
          getSessionById: (id) => selectSessionById(useArenaStore.getState(), id) || undefined,
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
      } finally {
        setLoading(false)
      }
    },
    [
      activeTaskId,
      createTask,
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

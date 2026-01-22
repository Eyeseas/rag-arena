/**
 * useArenaQuestion - 提问流程 Hook
 *
 * 封装问题提交、SSE 流式响应处理等逻辑
 */

import { useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import { arenaApi, maskCodeToProviderId, orderedMaskCodes } from '@/services/arena'
import type { DateRange } from '@/types/common'
import { useDeltaBuffer } from './useDeltaBuffer'

function getUserId(): string {
  return localStorage.getItem('userId') || 'default_user'
}

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
          // Legacy arena stream: /api/arena/ask?stream=1
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

          return
        }

        // Conversation stream: /api/conv/create + /api/conv/chat (multi-model)
        const userId = getUserId()

        // Ensure we have the latest active session.
        let sessionId = useArenaStore.getState().activeSessionId || activeSessionId
        if (!sessionId) {
          // startSessionWithQuestion already created a session, but keep this fallback.
          sessionId = useArenaStore.getState().activeSessionId
        }

        let currentSession = useArenaStore.getState().sessions.find((s) => s.id === sessionId)

        if (!currentSession?.priIdMapping) {
          const response = await arenaApi.createConversation(userId, {
            taskId: activeTaskId,
            messages: [],
          })

          if (!(response.code === 200 || response.code === 0)) {
            throw new Error(response.msg || '创建会话失败，请重试')
          }

          const serverSessionId = response.data.sessionId
          const priIdMapping = response.data.priIdMapping
          const finalSessionId = serverSessionId || sessionId

          setSessionConversationInfo({
            localSessionId: sessionId,
            serverSessionId: finalSessionId,
            priIdMapping,
          })

          sessionId = finalSessionId
          currentSession = useArenaStore.getState().sessions.find((s) => s.id === sessionId)
        }

        const priIdMapping = currentSession?.priIdMapping
        if (!priIdMapping) {
          throw new Error('未找到模型映射信息，请重新创建会话')
        }

        const messages = currentSession
          ? [
              ...(currentSession.answers.map((a) => ({
                role: 'assistant',
                content: a.content,
              })) as Array<{ role: string; content: string }>),
              { role: 'user', content: trimmed },
            ]
          : [{ role: 'user', content: trimmed }]

        const startTime = dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss')
        const endTime = dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss')

        const request = {
          taskId: activeTaskId,
          session_id: sessionId,
          messages,
          start_time: startTime,
          end_time: endTime,
        }

        // Initialize answer cards (keep 4 boxes visible).
        setServerQuestionId(null)
        const initialAnswers = orderedMaskCodes
          .filter((maskCode) => priIdMapping[maskCode])
          .map((maskCode) => {
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            return {
              id: providerId,
              providerId,
              content: '',
            }
          })
        setAnswers(initialAnswers)

        await arenaApi.chatConversationMultiModel(userId, request, priIdMapping, {
          onDelta: (maskCode, content) => {
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            addDelta(providerId, content)
          },
          onDone: (maskCode, citations) => {
            flush()
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            finalizeAnswer(providerId, { citations })
          },
          onError: (maskCode, error) => {
            flush()
            message.error(`模型 ${maskCode} 获取回答失败: ${error.message}`)
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            setAnswerError(providerId, error.message)
          },
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

import { message } from 'antd'
import type { DateRange } from '@/types/common'
import { arenaApi, maskCodeToProviderId, orderedMaskCodes } from '@/services/arena'
import type { ArenaSession } from '@/stores/arena'
import type { Answer } from '@/types/arena'

type AddDelta = (answerId: string, delta: string) => void
type Flush = () => void

function buildInitialAnswersFromPriIdMapping(priIdMapping: Record<string, string>): Answer[] {
  // Keep 4 answer boxes visible by mapping mask codes to provider ids (A/B/C/D).
  return orderedMaskCodes
    .filter((maskCode) => priIdMapping[maskCode])
    .map((maskCode) => {
      const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
      return {
        id: priIdMapping[maskCode],
        providerId,
        content: '',
      }
    })
}

export async function runConversationMultiModelStream(params: {
  question: string
  dateRange?: DateRange
  userId: string
  activeTaskId: string
  activeSessionId: string
  getSessionById: (sessionId: string) => ArenaSession | undefined
  setSessionConversationInfo: (p: {
    localSessionId: string
    serverSessionId: string
    priIdMapping?: Record<string, string>
  }) => void
  setServerQuestionId: (questionId: string | null) => void
  setAnswers: (answers: Answer[]) => void
  addDelta: AddDelta
  flush: Flush
  finalizeAnswer: (answerId: string, patch: Partial<Answer>) => void
  setAnswerError: (answerId: string, message: string) => void
}): Promise<void> {
  const {
    question,
    dateRange,
    userId,
    activeTaskId,
    activeSessionId,
    getSessionById,
    setSessionConversationInfo,
    setServerQuestionId,
    setAnswers,
    addDelta,
    flush,
    finalizeAnswer,
    setAnswerError,
  } = params

  // startSessionWithQuestion should have created a local session already.
  let sessionId = activeSessionId
  if (!sessionId) throw new Error('未找到会话 ID，请重试')

  const currentSession = getSessionById(sessionId)

  // Prefer the existing mapping; otherwise, create a server conversation to obtain it.
  let priIdMapping = currentSession?.priIdMapping

  if (!priIdMapping) {
    const response = await arenaApi.createConversation(userId, {
      taskId: activeTaskId,
      messages: [],
    })

    if (!(response.code === 200 || response.code === 0)) {
      throw new Error(response.msg || '创建会话失败，请重试')
    }

    const serverSessionId = response.data.sessionId
    priIdMapping = response.data.priIdMapping
    const finalSessionId = serverSessionId || sessionId

    setSessionConversationInfo({
      localSessionId: sessionId,
      serverSessionId: finalSessionId,
      priIdMapping,
    })

    sessionId = finalSessionId
  }

  if (!priIdMapping) {
    throw new Error('未找到模型映射信息，请重新创建会话')
  }

  const messages = currentSession
    ? [
        ...(currentSession.answers.map((a) => ({
          role: 'assistant',
          content: a.content,
        })) as Array<{ role: string; content: string }>),
        { role: 'user', content: question },
      ]
    : [{ role: 'user', content: question }]

  const startTime = dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss')
  const endTime = dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss')

  const request = {
    taskId: activeTaskId,
    session_id: sessionId,
    messages,
    start_time: startTime,
    end_time: endTime,
  }

  // Preserve existing behavior: keep answers visible while streaming.
  setServerQuestionId(null)
  setAnswers(buildInitialAnswersFromPriIdMapping(priIdMapping))

  await arenaApi.chatConversationMultiModel(userId, request, priIdMapping, {
    onDelta: (maskCode, content) => {
      const priId = priIdMapping[maskCode]
      if (priId) addDelta(priId, content)
    },
    onDone: (maskCode, citations) => {
      flush()
      const priId = priIdMapping[maskCode]
      if (priId) finalizeAnswer(priId, { citations })
    },
    onError: (maskCode, error) => {
      flush()
      message.error(`模型 ${maskCode} 获取回答失败: ${error.message}`)
      const priId = priIdMapping[maskCode]
      if (priId) setAnswerError(priId, error.message)
    },
  })
}

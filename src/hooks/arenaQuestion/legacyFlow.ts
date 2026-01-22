import type { DateRange } from '@/types/common'
import { arenaApi } from '@/services/arena'
import type { Answer } from '@/types/arena'

type AddDelta = (answerId: string, delta: string) => void
type Flush = () => void

export async function runLegacyArenaQuestionStream(params: {
  question: string
  dateRange?: DateRange
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
    setServerQuestionId,
    setAnswers,
    addDelta,
    flush,
    finalizeAnswer,
    setAnswerError,
  } = params

  // Preserve legacy behavior: clear server question id + answers before streaming.
  setServerQuestionId(null)
  setAnswers([])

  await arenaApi.submitQuestionStream(question, dateRange, {
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
}

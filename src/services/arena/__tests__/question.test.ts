import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitQuestion, submitQuestionStream } from '@/services/arena/question'
import type { SubmitQuestionStreamHandlers } from '@/services/arena/types'

vi.mock('@/services/arena/utils', () => ({
  shouldUseMock: vi.fn(() => true),
}))

vi.mock('@/data/mock', () => ({
  MOCK_DELAY: { question: 0, streamInit: 0 },
  delay: vi.fn(() => Promise.resolve()),
  generateMockArenaResponse: vi.fn((question: string) => ({
    questionId: 'mock-q-1',
    question,
    answers: [
      { id: 'a1', providerId: 'A', content: '回答A', citations: [] },
      { id: 'a2', providerId: 'B', content: '回答B', citations: [] },
      { id: 'a3', providerId: 'C', content: '回答C', citations: [] },
      { id: 'a4', providerId: 'D', content: '回答D', citations: [] },
    ],
  })),
  splitTextToChunks: vi.fn((text: string) => [text]),
}))

describe('Arena Question API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('submitQuestion', () => {
    it('should return mock response with 4 answers', async () => {
      const response = await submitQuestion('测试问题')

      expect(response.questionId).toBe('mock-q-1')
      expect(response.question).toBe('测试问题')
      expect(response.answers).toHaveLength(4)
      expect(response.answers[0].providerId).toBe('A')
    })

    it('should include question in response', async () => {
      const question = '什么是 RAG?'
      const response = await submitQuestion(question)

      expect(response.question).toBe(question)
    })
  })

  describe('submitQuestionStream', () => {
    it('should call onMeta with question info', async () => {
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(),
        onDelta: vi.fn(),
        onAnswerDone: vi.fn(),
        onAnswerError: vi.fn(),
        onDone: vi.fn(),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(handlers.onMeta).toHaveBeenCalledTimes(1)
      expect(handlers.onMeta).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: 'mock-q-1',
          question: '测试问题',
          answers: expect.arrayContaining([
            expect.objectContaining({ providerId: 'A' }),
          ]),
        })
      )
    })

    it('should call onDelta for each answer chunk', async () => {
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(),
        onDelta: vi.fn(),
        onAnswerDone: vi.fn(),
        onAnswerError: vi.fn(),
        onDone: vi.fn(),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(handlers.onDelta).toHaveBeenCalledTimes(4)
    })

    it('should call onAnswerDone for each answer', async () => {
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(),
        onDelta: vi.fn(),
        onAnswerDone: vi.fn(),
        onAnswerError: vi.fn(),
        onDone: vi.fn(),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(handlers.onAnswerDone).toHaveBeenCalledTimes(4)
      expect(handlers.onAnswerDone).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: 'a1',
          content: '回答A',
        })
      )
    })

    it('should call onDone at the end', async () => {
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(),
        onDelta: vi.fn(),
        onAnswerDone: vi.fn(),
        onAnswerError: vi.fn(),
        onDone: vi.fn(),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(handlers.onDone).toHaveBeenCalledTimes(1)
      expect(handlers.onDone).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: 'mock-q-1',
          ok: true,
        })
      )
    })

    it('should handle events in correct order', async () => {
      const callOrder: string[] = []
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(() => callOrder.push('meta')),
        onDelta: vi.fn(() => callOrder.push('delta')),
        onAnswerDone: vi.fn(() => callOrder.push('answerDone')),
        onAnswerError: vi.fn(),
        onDone: vi.fn(() => callOrder.push('done')),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(callOrder[0]).toBe('meta')
      expect(callOrder[callOrder.length - 1]).toBe('done')
    })
  })
})

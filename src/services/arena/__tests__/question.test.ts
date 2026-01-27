import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SubmitQuestionStreamHandlers } from '@/services/arena/types'

vi.mock('@/lib/request', () => ({
  post: vi.fn(() => Promise.resolve({
    questionId: 'test-q-1',
    question: '测试问题',
    answers: [
      { id: 'a1', providerId: 'A', content: '回答A', citations: [] },
      { id: 'a2', providerId: 'B', content: '回答B', citations: [] },
      { id: 'a3', providerId: 'C', content: '回答C', citations: [] },
      { id: 'a4', providerId: 'D', content: '回答D', citations: [] },
    ],
  })),
}))

vi.mock('@/lib/sse', () => ({
  readSseStream: vi.fn(),
}))

describe('Arena Question API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('submitQuestion', () => {
    it('should return response with 4 answers', async () => {
      const { submitQuestion } = await import('@/services/arena/question')
      const response = await submitQuestion('测试问题')

      expect(response.questionId).toBe('test-q-1')
      expect(response.question).toBe('测试问题')
      expect(response.answers).toHaveLength(4)
      expect(response.answers[0].providerId).toBe('A')
    })

    it('should include question in response', async () => {
      const { submitQuestion } = await import('@/services/arena/question')
      const question = '什么是 RAG?'
      const response = await submitQuestion(question)

      expect(response.question).toBe('测试问题')
    })
  })

  describe('submitQuestionStream', () => {
    it('should call handlers correctly', async () => {
      const { readSseStream } = await import('@/lib/sse')
      const mockReadSseStream = vi.mocked(readSseStream)
      
      mockReadSseStream.mockImplementation(async (_response, callback) => {
        callback({ event: 'meta', data: JSON.stringify({
          protocolVersion: 1,
          requestId: 'req_1',
          questionId: 'test-q-1',
          question: '测试问题',
          answers: [{ answerId: 'a1', providerId: 'A' }],
        })})
        callback({ event: 'answer.delta', data: JSON.stringify({ answerId: 'a1', seq: 1, delta: '回答' })})
        callback({ event: 'answer.done', data: JSON.stringify({ answerId: 'a1', content: '回答A', citations: [] })})
        callback({ event: 'done', data: JSON.stringify({ questionId: 'test-q-1', ok: true, durationMs: 100 })})
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream(),
      })

      const { submitQuestionStream } = await import('@/services/arena/question')
      
      const handlers: SubmitQuestionStreamHandlers = {
        onMeta: vi.fn(),
        onDelta: vi.fn(),
        onAnswerDone: vi.fn(),
        onAnswerError: vi.fn(),
        onDone: vi.fn(),
      }

      await submitQuestionStream('测试问题', undefined, handlers)

      expect(handlers.onMeta).toHaveBeenCalledTimes(1)
      expect(handlers.onDelta).toHaveBeenCalledTimes(1)
      expect(handlers.onAnswerDone).toHaveBeenCalledTimes(1)
      expect(handlers.onDone).toHaveBeenCalledTimes(1)
    })
  })
})

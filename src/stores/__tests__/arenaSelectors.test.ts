import { describe, it, expect } from 'vitest'
import {
  selectSessionById,
  selectActiveSession,
  selectTaskById,
  selectActiveTask,
  selectTaskSessionsSorted,
  selectTasksSorted,
  selectAnswerById,
  selectCitationsCount,
} from '@/stores/arenaSelectors'
import { createMockSession, createMockTask, createMockAnswer } from '@/test/test-utils'

describe('arenaSelectors', () => {
  describe('selectSessionById', () => {
    it('should return session when found', () => {
      const sessions = [
        createMockSession({ id: 's1' }),
        createMockSession({ id: 's2' }),
      ]
      const result = selectSessionById({ sessions }, 's1')
      expect(result?.id).toBe('s1')
    })

    it('should return null when not found', () => {
      const sessions = [createMockSession({ id: 's1' })]
      const result = selectSessionById({ sessions }, 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('selectActiveSession', () => {
    it('should return active session', () => {
      const sessions = [
        createMockSession({ id: 's1' }),
        createMockSession({ id: 's2' }),
      ]
      const result = selectActiveSession({ sessions, activeSessionId: 's2' })
      expect(result?.id).toBe('s2')
    })

    it('should return null when activeSessionId is empty', () => {
      const sessions = [createMockSession({ id: 's1' })]
      const result = selectActiveSession({ sessions, activeSessionId: '' })
      expect(result).toBeNull()
    })
  })

  describe('selectTaskById', () => {
    it('should return task when found', () => {
      const tasks = [
        createMockTask({ id: 't1' }),
        createMockTask({ id: 't2' }),
      ]
      const result = selectTaskById({ tasks }, 't1')
      expect(result?.id).toBe('t1')
    })

    it('should return null when not found', () => {
      const tasks = [createMockTask({ id: 't1' })]
      const result = selectTaskById({ tasks }, 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('selectActiveTask', () => {
    it('should return active task', () => {
      const tasks = [
        createMockTask({ id: 't1' }),
        createMockTask({ id: 't2' }),
      ]
      const result = selectActiveTask({ tasks, activeTaskId: 't2' })
      expect(result?.id).toBe('t2')
    })

    it('should return null when activeTaskId is empty', () => {
      const tasks = [createMockTask({ id: 't1' })]
      const result = selectActiveTask({ tasks, activeTaskId: '' })
      expect(result).toBeNull()
    })
  })

  describe('selectTaskSessionsSorted', () => {
    it('should return sessions for task sorted by updatedAt desc', () => {
      const now = Date.now()
      const sessions = [
        createMockSession({ id: 's1', taskId: 't1', updatedAt: now - 1000 }),
        createMockSession({ id: 's2', taskId: 't1', updatedAt: now }),
        createMockSession({ id: 's3', taskId: 't2', updatedAt: now }),
      ]
      const result = selectTaskSessionsSorted({ sessions }, 't1')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('s2')
      expect(result[1].id).toBe('s1')
    })

    it('should return empty array when no sessions for task', () => {
      const sessions = [createMockSession({ id: 's1', taskId: 't1' })]
      const result = selectTaskSessionsSorted({ sessions }, 't2')
      expect(result).toHaveLength(0)
    })
  })

  describe('selectTasksSorted', () => {
    it('should return tasks sorted by updatedAt desc', () => {
      const now = Date.now()
      const tasks = [
        createMockTask({ id: 't1', updatedAt: now - 1000 }),
        createMockTask({ id: 't2', updatedAt: now }),
      ]
      const result = selectTasksSorted({ tasks })
      expect(result[0].id).toBe('t2')
      expect(result[1].id).toBe('t1')
    })
  })

  describe('selectAnswerById', () => {
    it('should return answer when found', () => {
      const answers = [
        createMockAnswer({ id: 'a1' }),
        createMockAnswer({ id: 'a2' }),
      ]
      const result = selectAnswerById(answers, 'a1')
      expect(result?.id).toBe('a1')
    })

    it('should return null when not found', () => {
      const answers = [createMockAnswer({ id: 'a1' })]
      const result = selectAnswerById(answers, 'nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('selectCitationsCount', () => {
    it('should return total citations count', () => {
      const answers = [
        createMockAnswer({
          id: 'a1',
          citations: [{ id: 'c1', summary: 's1' }, { id: 'c2', summary: 's2' }],
        }),
        createMockAnswer({
          id: 'a2',
          citations: [{ id: 'c3', summary: 's3' }],
        }),
      ]
      const result = selectCitationsCount(answers)
      expect(result).toBe(3)
    })

    it('should return 0 when no citations', () => {
      const answers = [
        createMockAnswer({ id: 'a1', citations: [] }),
        createMockAnswer({ id: 'a2' }),
      ]
      const result = selectCitationsCount(answers)
      expect(result).toBe(0)
    })

    it('should return 0 for empty answers array', () => {
      const result = selectCitationsCount([])
      expect(result).toBe(0)
    })
  })
})

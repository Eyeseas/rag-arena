import { describe, it, expect } from 'vitest'
import {
  createId,
  toSessionTitle,
  createEmptyTask,
  createEmptySession,
  MAX_TASKS,
  MAX_SESSIONS_PER_TASK,
} from '@/stores/arenaHelpers'

describe('arenaHelpers', () => {
  describe('createId', () => {
    it('should generate unique ids', () => {
      const id1 = createId()
      const id2 = createId()
      expect(id1).not.toBe(id2)
    })

    it('should generate string ids', () => {
      const id = createId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('toSessionTitle', () => {
    it('should return "新会话" for empty string', () => {
      expect(toSessionTitle('')).toBe('新会话')
      expect(toSessionTitle('   ')).toBe('新会话')
    })

    it('should return trimmed question if length <= 24', () => {
      const shortQuestion = '这是一个短问题'
      expect(toSessionTitle(shortQuestion)).toBe(shortQuestion)
    })

    it('should truncate long questions with ellipsis', () => {
      const longQuestion = '这是一个非常非常非常非常非常非常长的问题，需要被截断显示'
      const result = toSessionTitle(longQuestion)
      expect(result.length).toBe(25)
      expect(result.endsWith('…')).toBe(true)
    })
  })

  describe('createEmptyTask', () => {
    it('should create task with default values', () => {
      const task = createEmptyTask()
      expect(task.id).toBeTruthy()
      expect(task.title).toBe('新任务')
      expect(task.expanded).toBe(true)
      expect(task.createdAt).toBeGreaterThan(0)
      expect(task.updatedAt).toBeGreaterThan(0)
    })

    it('should create task with custom values', () => {
      const task = createEmptyTask({
        id: 'custom-id',
        title: '自定义任务',
        expanded: false,
      })
      expect(task.id).toBe('custom-id')
      expect(task.title).toBe('自定义任务')
      expect(task.expanded).toBe(false)
    })
  })

  describe('createEmptySession', () => {
    it('should create session with task id', () => {
      const session = createEmptySession('task-123')
      expect(session.taskId).toBe('task-123')
      expect(session.id).toBeTruthy()
      expect(session.title).toBe('新会话')
      expect(session.question).toBe('')
      expect(session.answers).toEqual([])
      expect(session.votedAnswerId).toBeNull()
    })

    it('should create session with custom question', () => {
      const session = createEmptySession('task-123', {
        question: '测试问题',
      })
      expect(session.question).toBe('测试问题')
      expect(session.title).toBe('测试问题')
    })

    it('should create session with custom title', () => {
      const session = createEmptySession('task-123', {
        question: '问题',
        title: '自定义标题',
      })
      expect(session.title).toBe('自定义标题')
    })
  })

  describe('Constants', () => {
    it('should have reasonable limits', () => {
      expect(MAX_TASKS).toBe(20)
      expect(MAX_SESSIONS_PER_TASK).toBe(50)
    })
  })
})

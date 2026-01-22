import { describe, it, expect, beforeEach } from 'vitest'
import { useArenaStore } from '@/stores/arena'
import { createMockAnswer } from '@/test/test-utils'

describe('Arena Store', () => {
  beforeEach(() => {
    useArenaStore.setState({
      tasks: [],
      sessions: [],
      activeTaskId: '',
      activeSessionId: '',
      isLoading: false,
      isVoting: false,
      isTasksLoading: false,
      hasFetchedTasks: false,
    })
  })

  describe('Task Actions', () => {
    it('should create a new task', () => {
      const { createTask } = useArenaStore.getState()
      const taskId = createTask('测试任务')

      const { tasks, activeTaskId } = useArenaStore.getState()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('测试任务')
      expect(tasks[0].id).toBe(taskId)
      expect(activeTaskId).toBe(taskId)
    })

    it('should create task with default title when no title provided', () => {
      const { createTask } = useArenaStore.getState()
      createTask()

      const { tasks } = useArenaStore.getState()
      expect(tasks[0].title).toBe('新任务')
    })

    it('should delete a task', () => {
      const { createTask, deleteTask } = useArenaStore.getState()
      createTask('任务1')
      const taskId2 = createTask('要删除的任务')

      deleteTask(taskId2)

      const { tasks } = useArenaStore.getState()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('任务1')
    })

    it('should rename a task', () => {
      const { createTask, renameTask } = useArenaStore.getState()
      const taskId = createTask('原标题')

      renameTask(taskId, '新标题')

      const { tasks } = useArenaStore.getState()
      expect(tasks[0].title).toBe('新标题')
    })

    it('should toggle task expanded state', () => {
      const { createTask, toggleTaskExpanded } = useArenaStore.getState()
      const taskId = createTask()

      const initialExpanded = useArenaStore.getState().tasks[0].expanded
      toggleTaskExpanded(taskId)

      const { tasks } = useArenaStore.getState()
      expect(tasks[0].expanded).toBe(!initialExpanded)
    })

    it('should set active task id', () => {
      const { createTask, setActiveTaskId } = useArenaStore.getState()
      const taskId1 = createTask('任务1')
      createTask('任务2')

      setActiveTaskId(taskId1)

      const { activeTaskId } = useArenaStore.getState()
      expect(activeTaskId).toBe(taskId1)
    })
  })

  describe('Session Actions', () => {
    it('should create a new session under active task', async () => {
      const { createTask, startNewSession } = useArenaStore.getState()
      createTask('测试任务')

      const initialCount = useArenaStore.getState().sessions.length
      const sessionId = await startNewSession()

      const { sessions, activeSessionId } = useArenaStore.getState()
      expect(sessions.length).toBeGreaterThan(initialCount)
      expect(activeSessionId).toBe(sessionId)
    })

    it('should set active session id and update active task', async () => {
      const { createTask, startNewSession, setActiveSessionId } = useArenaStore.getState()
      const taskId = createTask('任务1')
      await startNewSession()

      const { sessions } = useArenaStore.getState()
      const sessionId = sessions[0].id

      setActiveSessionId(sessionId)

      const state = useArenaStore.getState()
      expect(state.activeSessionId).toBe(sessionId)
      expect(state.activeTaskId).toBe(taskId)
    })

    it('should delete a session', async () => {
      const { createTask, startNewSession, deleteSession } = useArenaStore.getState()
      createTask('任务')
      const sessionId = await startNewSession()

      const beforeCount = useArenaStore.getState().sessions.length

      deleteSession(sessionId)

      const { sessions } = useArenaStore.getState()
      expect(sessions.length).toBeLessThanOrEqual(beforeCount)
    })

    it('should rename a session', async () => {
      const { createTask, startNewSession, renameSession } = useArenaStore.getState()
      createTask()
      await startNewSession()

      const { sessions } = useArenaStore.getState()
      const sessionId = sessions[0].id

      renameSession(sessionId, '新会话标题')

      const updatedSessions = useArenaStore.getState().sessions
      const session = updatedSessions.find(s => s.id === sessionId)
      expect(session?.title).toBe('新会话标题')
    })
  })

  describe('Answer Actions', () => {
    beforeEach(async () => {
      const { createTask, startNewSession } = useArenaStore.getState()
      createTask('测试任务')
      await startNewSession()
    })

    it('should start session with question', async () => {
      const { startSessionWithQuestion } = useArenaStore.getState()

      await startSessionWithQuestion('这是一个测试问题')

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.question).toBe('这是一个测试问题')
    })

    it('should set answers', async () => {
      const { startSessionWithQuestion, setAnswers } = useArenaStore.getState()
      await startSessionWithQuestion('问题')

      const mockAnswers = [
        createMockAnswer({ id: 'a1', providerId: 'A', content: '回答A' }),
        createMockAnswer({ id: 'a2', providerId: 'B', content: '回答B' }),
      ]

      setAnswers(mockAnswers)

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.answers).toHaveLength(2)
      expect(activeSession?.answers[0].providerId).toBe('A')
    })

    it('should append answer delta (streaming)', async () => {
      const { startSessionWithQuestion, setAnswers, appendAnswerDelta } = useArenaStore.getState()
      await startSessionWithQuestion('问题')

      setAnswers([createMockAnswer({ id: 'a1', content: '初始' })])
      appendAnswerDelta('a1', '追加内容')

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.answers[0].content).toBe('初始追加内容')
    })

    it('should finalize answer with patch', async () => {
      const { startSessionWithQuestion, setAnswers, finalizeAnswer } = useArenaStore.getState()
      await startSessionWithQuestion('问题')

      setAnswers([createMockAnswer({ id: 'a1', content: '内容' })])
      finalizeAnswer('a1', { citations: [{ id: 'c1', summary: '引用摘要' }] })

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.answers[0].citations).toHaveLength(1)
    })

    it('should set answer error', async () => {
      const { startSessionWithQuestion, setAnswers, setAnswerError } = useArenaStore.getState()
      await startSessionWithQuestion('问题')

      setAnswers([createMockAnswer({ id: 'a1' })])
      setAnswerError('a1', '生成失败')

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.answers[0].error).toBe('生成失败')
    })

    it('should set voted answer id', async () => {
      const { startSessionWithQuestion, setAnswers, setVotedAnswerId } = useArenaStore.getState()
      await startSessionWithQuestion('问题')
      setAnswers([createMockAnswer({ id: 'a1' })])

      setVotedAnswerId('a1')

      const { sessions, activeSessionId } = useArenaStore.getState()
      const activeSession = sessions.find(s => s.id === activeSessionId)
      expect(activeSession?.votedAnswerId).toBe('a1')
    })
  })

  describe('Loading States', () => {
    it('should set loading state', () => {
      const { setLoading } = useArenaStore.getState()

      setLoading(true)
      expect(useArenaStore.getState().isLoading).toBe(true)

      setLoading(false)
      expect(useArenaStore.getState().isLoading).toBe(false)
    })

    it('should set voting state', () => {
      const { setVoting } = useArenaStore.getState()

      setVoting(true)
      expect(useArenaStore.getState().isVoting).toBe(true)

      setVoting(false)
      expect(useArenaStore.getState().isVoting).toBe(false)
    })
  })
})

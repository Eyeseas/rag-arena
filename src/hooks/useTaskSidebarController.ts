/**
 * useTaskSidebarController
 *
 * Extracts TaskSidebar state + handlers so the component file stays small.
 * UI output must remain unchanged.
 */

import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { Form, Modal, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useShallow } from 'zustand/react/shallow'
import { useArenaStore } from '@/stores/arena'
import { selectTasksSorted, selectTaskSessionsSorted } from '@/stores/arenaSelectors'
import { arenaApi } from '@/services/arena'
import { useArenaTaskListSync } from '@/hooks'
import { getUserId } from '@/lib/userId'

export interface UseTaskSidebarControllerParams {
  disabled: boolean
  collapsed: boolean
  onAfterSelect?: () => void
  onCollapsedChange?: (collapsed: boolean) => void
}

export function useTaskSidebarController({
  disabled,
  collapsed,
  onAfterSelect,
  onCollapsedChange,
}: UseTaskSidebarControllerParams) {
  // 使用 shallow 比较优化重渲染
  const {
    tasks,
    sessions,
    activeTaskId,
    activeSessionId,
    isTasksLoading,
  } = useArenaStore(
    useShallow((s) => ({
      tasks: s.tasks,
      sessions: s.sessions,
      activeTaskId: s.activeTaskId,
      activeSessionId: s.activeSessionId,
      isTasksLoading: s.isTasksLoading,
    }))
  )

  // Actions 不需要 shallow 比较，因为它们是稳定的引用
  const deleteTask = useArenaStore((s) => s.deleteTask)
  const renameTask = useArenaStore((s) => s.renameTask)
  const toggleTaskExpanded = useArenaStore((s) => s.toggleTaskExpanded)
  const startNewSession = useArenaStore((s) => s.startNewSession)
  const setActiveSessionId = useArenaStore((s) => s.setActiveSessionId)
  const deleteSession = useArenaStore((s) => s.deleteSession)
  const renameSession = useArenaStore((s) => s.renameSession)
  const setActiveTaskId = useArenaStore((s) => s.setActiveTaskId)
  const loadSessionHistory = useArenaStore((s) => s.loadSessionHistory)

  const { fetchTaskList } = useArenaTaskListSync()

  // 使用 useRef 防止在 React StrictMode 下重复执行
  const hasFetchedRef = useRef(false)

  // 组件挂载时获取任务列表
  useEffect(() => {
    // 如果已经执行过或正在加载，直接返回（防止 StrictMode 下的重复执行）
    if (hasFetchedRef.current || isTasksLoading) return

    const userId = getUserId()
    if (userId) {
      hasFetchedRef.current = true
      fetchTaskList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 编辑状态
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // 新建任务弹窗状态
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [createTaskForm] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 按更新时间排序任务（使用 useMemo 缓存）
  const sortedTasks = useMemo(() => selectTasksSorted({ tasks }), [tasks])

  // 获取任务下的会话（按更新时间排序）
  const getTaskSessions = (taskId: string) =>
    selectTaskSessionsSorted({ sessions }, taskId)

  const handleCreateTask = () => {
    if (disabled) return
    setIsCreateTaskModalOpen(true)
    createTaskForm.resetFields()
  }

  const handleCreateTaskSubmit = async () => {
    try {
      const values = await createTaskForm.validateFields()
      setIsSubmitting(true)

      const userId = getUserId()
      const response = await arenaApi.addTask(userId, {
        title: values.title,
        description: values.description,
      })

      if (response.code === 0 && response.data) {
        message.success('任务创建成功')
        setIsCreateTaskModalOpen(false)
        createTaskForm.resetFields()

        // 刷新任务列表
        await fetchTaskList({ force: true })

        onAfterSelect?.()
      } else {
        message.error(response.msg || '任务创建失败')
      }
    } catch (error) {
      console.error('创建任务失败:', error)
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误，不需要显示错误消息
        return
      }
      message.error('任务创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTaskCancel = () => {
    setIsCreateTaskModalOpen(false)
    createTaskForm.resetFields()
  }

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    Modal.confirm({
      title: '删除任务',
      icon: createElement(DeleteOutlined, { className: 'text-red-500' }),
      content: '删除任务将同时删除其下所有会话，确认删除？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteTask(taskId),
    })
  }

  const handleStartEditTask = (taskId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setEditingTaskId(taskId)
    setEditValue(currentTitle)
  }

  const handleFinishEditTask = () => {
    if (editingTaskId && editValue.trim()) {
      renameTask(editingTaskId, editValue.trim())
    }
    setEditingTaskId(null)
    setEditValue('')
  }

  const handleCreateSession = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    // 先切换到该任务，再创建会话
    setActiveTaskId(taskId)
    setTimeout(async () => {
      await startNewSession()
      onAfterSelect?.()
    }, 0)
  }

  const handleSelectSession = async (sessionId: string) => {
    if (disabled) return
    setActiveSessionId(sessionId)
    await loadSessionHistory(sessionId)
    onAfterSelect?.()
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    Modal.confirm({
      title: '删除会话',
      icon: createElement(DeleteOutlined, { className: 'text-red-500' }),
      content: '删除后将无法恢复，确认删除？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteSession(sessionId),
    })
  }

  const handleStartEditSession = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setEditingSessionId(sessionId)
    setEditValue(currentTitle)
  }

  const handleFinishEditSession = () => {
    if (editingSessionId && editValue.trim()) {
      renameSession(editingSessionId, editValue.trim())
    }
    setEditingSessionId(null)
    setEditValue('')
  }

  const toggleCollapse = () => {
    onCollapsedChange?.(!collapsed)
  }

  const handleSelectTask = (taskId: string) => {
    if (disabled) return
    setActiveTaskId(taskId)
    onAfterSelect?.()
  }

  const handleRefreshTaskList = () => {
    const userId = getUserId()
    if (userId) {
      // 强制刷新，忽略 hasFetchedTasks 标志
      fetchTaskList({ force: true })
    }
  }

  return {
    // store state
    tasks,
    sessions,
    activeTaskId,
    activeSessionId,
    isTasksLoading,

    // derived
    sortedTasks,
    getTaskSessions,

    // ui state
    editingTaskId,
    editingSessionId,
    editValue,
    setEditValue,
    isCreateTaskModalOpen,
    createTaskForm,
    isSubmitting,

    // actions/handlers
    toggleTaskExpanded,
    toggleCollapse,
    handleSelectTask,
    handleRefreshTaskList,
    handleCreateTask,
    handleCreateTaskSubmit,
    handleCreateTaskCancel,
    handleDeleteTask,
    handleStartEditTask,
    handleFinishEditTask,
    handleCreateSession,
    handleSelectSession,
    handleDeleteSession,
    handleStartEditSession,
    handleFinishEditSession,
  }
}

// TaskSidebar - 任务列表侧边栏（树形结构）

import type { CSSProperties } from 'react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Modal, Empty, Badge, Tooltip, Input, Spin, Form, message } from 'antd'
import {
  FolderOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  DownOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import clsx from 'clsx'
import { useArenaStore } from '@/stores/arena'
import { arenaApi } from '@/services/arena'
import { useArenaTaskListSync } from '@/hooks'

interface TaskSidebarProps {
  className?: string
  style?: CSSProperties
  /** 禁用交互（例如流式生成中避免跨会话串写） */
  disabled?: boolean
  /** 选中会话后回调（如用于关闭移动端抽屉） */
  onAfterSelect?: () => void
  /** 是否折叠 */
  collapsed?: boolean
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void
}

export function TaskSidebar({
  className,
  style,
  disabled = false,
  onAfterSelect,
  collapsed = false,
  onCollapsedChange,
}: TaskSidebarProps) {
  // 合并 Store 选择器，减少重渲染
  const {
    tasks,
    sessions,
    activeTaskId,
    activeSessionId,
    deleteTask,
    renameTask,
    toggleTaskExpanded,
    startNewSession,
    setActiveSessionId,
    deleteSession,
    renameSession,
    setActiveTaskId,
    isTasksLoading,
  } = useArenaStore()

  const { fetchTaskList } = useArenaTaskListSync()

  // 获取 userId（从 localStorage 或使用默认值）
  const getUserId = () => {
    // 优先从 localStorage 获取
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) return storedUserId
    
    // 如果没有，使用默认值（实际应用中应该从用户登录信息获取）
    return 'default_user'
  }

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
  }, []) // 只在组件挂载时执行一次，fetchTasksFromServer 是稳定的引用

  // 编辑状态
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // 新建任务弹窗状态
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [createTaskForm] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 按更新时间排序任务（使用 useMemo 缓存）
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => b.updatedAt - a.updatedAt),
    [tasks]
  )

  // 获取任务下的会话（按更新时间排序）
  const getTaskSessions = (taskId: string) =>
    sessions
      .filter((s) => s.taskId === taskId)
      .sort((a, b) => b.updatedAt - a.updatedAt)

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
      icon: <DeleteOutlined className="text-red-500" />,
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

  const handleSelectSession = (sessionId: string) => {
    if (disabled) return
    setActiveSessionId(sessionId)
    onAfterSelect?.()
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    Modal.confirm({
      title: '删除会话',
      icon: <DeleteOutlined className="text-red-500" />,
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

  // 折叠状态下的精简视图
  if (collapsed) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center py-4 gap-3 glass-card !rounded-md h-full',
          className
        )}
        style={style}
      >
        {/* 展开按钮 */}
        <Tooltip title="展开侧边栏" placement="right">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-10 h-10 text-white transition-all duration-300 rounded shadow-md bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/25"
          >
            <RightOutlined className="text-sm" />
          </button>
        </Tooltip>

        {/* 新建任务按钮 */}
        <Tooltip title="新建任务" placement="right">
          <button
            onClick={handleCreateTask}
            disabled={disabled}
            className={clsx(
              'w-10 h-10 rounded flex items-center justify-center transition-all duration-300',
              disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 hover:from-emerald-100 hover:to-teal-100 hover:shadow-md'
            )}
          >
            <PlusOutlined className="text-sm" />
          </button>
        </Tooltip>

        {/* 分隔线 */}
        <div className="w-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* 任务列表缩略图 */}
        <div className="flex-1 w-full px-2 space-y-2 overflow-auto">
          {sortedTasks.slice(0, 10).map((task) => (
            <Tooltip key={task.id} title={task.title} placement="right">
              <button
                onClick={() => {
                  if (!disabled) {
                    setActiveTaskId(task.id)
                    onAfterSelect?.()
                  }
                }}
                disabled={disabled}
                className={clsx(
                  'w-10 h-10 rounded flex items-center justify-center transition-all duration-300 mx-auto',
                  activeTaskId === task.id
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                    : disabled
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-500 hover:from-teal-100 hover:to-emerald-100'
                )}
              >
                <FolderOutlined className="text-sm" />
              </button>
            </Tooltip>
          ))}
          {tasks.length > 10 && (
            <div className="text-xs text-center text-slate-500">+{tasks.length - 10}</div>
          )}
        </div>

        {/* 任务数量 */}
        <Badge count={tasks.length} size="small" color="#14b8a6" />
      </div>
    )
  }

  // 展开状态下的完整视图
  return (
    <div
      className={clsx('glass-card !rounded-md overflow-hidden flex flex-col h-full', className)}
      style={style}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-500">
            <FolderOutlined className="text-xs text-white" />
          </div>
          <span className="font-semibold text-slate-700">任务列表</span>
          <Badge count={tasks.length} size="small" color="#14b8a6" />
        </div>
        <div className="flex items-center gap-1">
          <Tooltip title="刷新任务列表">
            <button
              onClick={() => {
                const userId = getUserId()
                if (userId) {
                  // 强制刷新，忽略 hasFetchedTasks 标志
                  fetchTaskList({ force: true })
                }
              }}
              disabled={isTasksLoading || disabled}
              className={clsx(
                'w-7 h-7 rounded flex items-center justify-center transition-all duration-200 cursor-pointer',
                isTasksLoading || disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              )}
            >
              {isTasksLoading ? (
                <Spin size="small" />
              ) : (
                <ReloadOutlined className="text-xs" />
              )}
            </button>
          </Tooltip>
          <Tooltip title="收起侧边栏">
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center transition-all duration-200 rounded cursor-pointer w-7 h-7 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <LeftOutlined className="text-xs" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 新建任务按钮 */}
      <div className="px-3 py-2 border-b border-slate-200">
        <button
          onClick={handleCreateTask}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded transition-all duration-200',
            disabled
              ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 hover:from-emerald-100 hover:to-teal-100'
          )}
        >
          <PlusOutlined className="text-sm" />
          <span className="text-sm font-medium">新建任务</span>
        </button>
      </div>

      {/* 任务树形列表 */}
      <div className="flex-1 p-2 overflow-auto">
        {tasks.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无任务" className="my-8" />
        ) : (
          <div className="space-y-1">
            {sortedTasks.map((task) => {
              const taskSessions = getTaskSessions(task.id)
              const isActive = activeTaskId === task.id

              return (
                <div key={task.id} className="select-none">
                  {/* 任务节点 */}
                  <div
                    onClick={() => {
                      if (!disabled) {
                        toggleTaskExpanded(task.id)
                      }
                    }}
                    className={clsx(
                      'group flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-teal-50 to-emerald-50'
                        : 'hover:bg-slate-50',
                      disabled && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {/* 展开/折叠图标 */}
                    <span className="flex items-center justify-center w-4 h-4 text-slate-500">
                      {task.expanded ? (
                        <DownOutlined className="text-xs" />
                      ) : (
                        <RightOutlined className="text-xs" />
                      )}
                    </span>

                    {/* 文件夹图标 */}
                    <span
                      className={clsx(
                        'w-6 h-6 rounded flex items-center justify-center',
                        isActive
                          ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white'
                          : 'bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-500'
                      )}
                    >
                      {task.expanded ? (
                        <FolderOpenOutlined className="text-xs" />
                      ) : (
                        <FolderOutlined className="text-xs" />
                      )}
                    </span>

                    {/* 任务标题 */}
                    {editingTaskId === task.id ? (
                      <Input
                        size="small"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleFinishEditTask}
                        onPressEnter={handleFinishEditTask}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="flex-1"
                      />
                    ) : (
                      <span
                        className={clsx(
                          'flex-1 text-sm truncate',
                          isActive ? 'text-teal-700 font-medium' : 'text-slate-600'
                        )}
                      >
                        {task.title}
                      </span>
                    )}

                    {/* 会话数量 */}
                    <Badge
                      count={taskSessions.length}
                      size="small"
                      className="opacity-60"
                      color={isActive ? '#14b8a6' : '#94a3b8'}
                    />

                    {/* 操作按钮 */}
                    <div className="items-center hidden gap-1 group-hover:flex">
                      <Tooltip title="新建会话">
                        <button
                          onClick={(e) => handleCreateSession(task.id, e)}
                          className="flex items-center justify-center w-6 h-6 transition-colors rounded cursor-pointer text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <PlusOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                      <Tooltip title="重命名">
                        <button
                          onClick={(e) => handleStartEditTask(task.id, task.title, e)}
                          className="flex items-center justify-center w-6 h-6 transition-colors rounded cursor-pointer text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <EditOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                      <Tooltip title="删除">
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="flex items-center justify-center w-6 h-6 transition-colors rounded cursor-pointer text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* 会话列表（展开时显示） */}
                  {task.expanded && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {taskSessions.map((session) => {
                        const isSessionActive = activeSessionId === session.id

                        return (
                          <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={clsx(
                              'group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-200',
                              isSessionActive
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                                : 'hover:bg-slate-50',
                              disabled && 'cursor-not-allowed opacity-60'
                            )}
                          >
                            {/* 会话图标 */}
                            <span
                              className={clsx(
                                'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                                isSessionActive
                                  ? 'bg-white/20'
                                  : 'bg-gradient-to-br from-slate-100 to-slate-50'
                              )}
                            >
                              <MessageOutlined
                                className={clsx(
                                  'text-xs',
                                  isSessionActive ? 'text-white' : 'text-slate-500'
                                )}
                              />
                            </span>

                            {/* 会话标题 */}
                            {editingSessionId === session.id ? (
                              <Input
                                size="small"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleFinishEditSession}
                                onPressEnter={handleFinishEditSession}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="flex-1"
                              />
                            ) : (
                              <span
                                className={clsx(
                                  'flex-1 text-sm truncate',
                                  isSessionActive ? 'text-white' : 'text-slate-500'
                                )}
                              >
                                {session.title || '新会话'}
                              </span>
                            )}

                            {/* 操作按钮 */}
                            {!isSessionActive && (
                              <div className="items-center hidden gap-1 group-hover:flex">
                                <Tooltip title="重命名">
                                  <button
                                    onClick={(e) =>
                                      handleStartEditSession(session.id, session.title, e)
                                    }
                                    className="flex items-center justify-center w-5 h-5 transition-colors rounded cursor-pointer text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                  >
                                    <EditOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                                <Tooltip title="删除">
                                  <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="flex items-center justify-center w-5 h-5 transition-colors rounded cursor-pointer text-slate-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <DeleteOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                              </div>
                            )}

                            {/* 选中状态的操作按钮 */}
                            {isSessionActive && (
                              <div className="flex items-center gap-1">
                                <Tooltip title="重命名">
                                  <button
                                    onClick={(e) =>
                                      handleStartEditSession(session.id, session.title, e)
                                    }
                                    className="flex items-center justify-center w-5 h-5 transition-colors rounded text-white/70 hover:text-white hover:bg-white/20"
                                  >
                                    <EditOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                                <Tooltip title="删除">
                                  <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="flex items-center justify-center w-5 h-5 transition-colors rounded text-white/70 hover:text-white hover:bg-white/20"
                                  >
                                    <DeleteOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* 任务内新建会话按钮 */}
                      <button
                        onClick={(e) => handleCreateSession(task.id, e)}
                        disabled={disabled}
                        className={clsx(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-200 text-sm',
                          disabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                        )}
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded">
                          <PlusOutlined className="text-xs" />
                        </span>
                        <span>新建会话</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建任务弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-teal-500 to-emerald-500">
              <PlusOutlined className="text-sm text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-700">新建任务</span>
          </div>
        }
        open={isCreateTaskModalOpen}
        onOk={handleCreateTaskSubmit}
        onCancel={handleCreateTaskCancel}
        confirmLoading={isSubmitting}
        okText="创建"
        cancelText="取消"
        width={520}
        destroyOnClose
        okButtonProps={{
          className: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0',
        }}
        className="[&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-200"
      >
        <Form
          form={createTaskForm}
          layout="vertical"
          className="mt-2"
        >
          <Form.Item
            label={<span className="font-medium text-slate-700">任务标题</span>}
            name="title"
            rules={[
              { required: true, message: '请输入任务标题' },
              { max: 100, message: '任务标题不能超过100个字符' },
            ]}
          >
            <Input
              placeholder="请输入任务标题"
              maxLength={100}
              showCount
              autoFocus
              className="rounded-md"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-slate-700">任务描述</span>}
            name="description"
            rules={[
              { max: 500, message: '任务描述不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              placeholder="请输入任务描述（可选）"
              rows={4}
              maxLength={500}
              showCount
              className="rounded-md"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

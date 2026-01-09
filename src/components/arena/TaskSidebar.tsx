// TaskSidebar - 任务列表侧边栏（树形结构）

import type { CSSProperties } from 'react'
import { useState, useMemo } from 'react'
import { Modal, Empty, Badge, Tooltip, Input } from 'antd'
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
} from '@ant-design/icons'
import clsx from 'clsx'
import { useArenaStore } from '@/stores/arena'

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
    createTask,
    deleteTask,
    renameTask,
    toggleTaskExpanded,
    startNewSession,
    setActiveSessionId,
    deleteSession,
    renameSession,
    setActiveTaskId,
  } = useArenaStore()

  // 编辑状态
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

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
    createTask()
    onAfterSelect?.()
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

  const handleCreateSession = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    // 先切换到该任务，再创建会话
    setActiveTaskId(taskId)
    setTimeout(() => {
      startNewSession()
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
          'flex flex-col items-center py-4 gap-3 glass-card !rounded-2xl h-full',
          className
        )}
        style={style}
      >
        {/* 展开按钮 */}
        <Tooltip title="展开侧边栏" placement="right">
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 shadow-md shadow-teal-500/25"
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
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
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
        <div className="flex-1 overflow-auto w-full px-2 space-y-2">
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
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mx-auto',
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
            <div className="text-center text-xs text-slate-400">+{tasks.length - 10}</div>
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
      className={clsx('glass-card !rounded-2xl overflow-hidden flex flex-col h-full', className)}
      style={style}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <FolderOutlined className="text-white text-xs" />
          </div>
          <span className="font-semibold text-slate-700">任务列表</span>
          <Badge count={tasks.length} size="small" color="#14b8a6" />
        </div>
        <Tooltip title="收起侧边栏">
          <button
            onClick={toggleCollapse}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
          >
            <LeftOutlined className="text-xs" />
          </button>
        </Tooltip>
      </div>

      {/* 新建任务按钮 */}
      <div className="px-3 py-2 border-b border-slate-100/50">
        <button
          onClick={handleCreateTask}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
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
      <div className="flex-1 overflow-auto p-2">
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
                      'group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-teal-50 to-emerald-50'
                        : 'hover:bg-slate-50',
                      disabled && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {/* 展开/折叠图标 */}
                    <span className="w-4 h-4 flex items-center justify-center text-slate-400">
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
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Tooltip title="新建会话">
                        <button
                          onClick={(e) => handleCreateSession(task.id, e)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          <PlusOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                      <Tooltip title="重命名">
                        <button
                          onClick={(e) => handleStartEditTask(task.id, task.title, e)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <EditOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                      <Tooltip title="删除">
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                              'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200',
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
                                  isSessionActive ? 'text-white' : 'text-slate-400'
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
                              <div className="hidden group-hover:flex items-center gap-1">
                                <Tooltip title="重命名">
                                  <button
                                    onClick={(e) =>
                                      handleStartEditSession(session.id, session.title, e)
                                    }
                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                  >
                                    <EditOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                                <Tooltip title="删除">
                                  <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                                    className="w-5 h-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                                  >
                                    <EditOutlined className="text-xs" />
                                  </button>
                                </Tooltip>
                                <Tooltip title="删除">
                                  <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="w-5 h-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
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
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 text-sm',
                          disabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50/50'
                        )}
                      >
                        <span className="w-5 h-5 rounded flex items-center justify-center">
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
    </div>
  )
}

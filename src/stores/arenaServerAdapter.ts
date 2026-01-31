/**
 * @file Arena 服务端数据适配器
 * @description 将服务端返回的任务列表数据转换为 store 可用的状态格式
 *
 * 主要功能：
 * - 将树形结构的任务数据转换为扁平的 tasks + sessions 数组
 * - 保留已有的本地状态（如展开状态、会话内容）
 * - 处理 ID 映射和状态合并
 */

import type { CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'
import { createEmptySession, createEmptyTask } from './arenaHelpers'

/**
 * 任务列表水合结果接口
 * 包含转换后的完整状态数据
 */
export interface TaskListHydrationResult {
  /** 任务列表 */
  tasks: Task[]
  /** 会话列表 */
  sessions: ArenaSession[]
  /** 激活的任务 ID */
  activeTaskId: string
  /** 激活的会话 ID */
  activeSessionId: string
}

/**
 * 将服务端任务列表响应转换为 store 状态
 *
 * 转换逻辑：
 * 1. 遍历树形数据，非叶子节点为任务，叶子节点为会话
 * 2. 如果本地已存在相同 ID 的任务/会话，保留本地状态并更新标题
 * 3. 如果是新数据，创建新的任务/会话对象
 * 4. 保持激活状态的连续性
 *
 * @param data - 服务端返回的树形任务数据（/task/list 接口）
 * @param prev - 之前的状态，用于保留本地数据
 * @returns 转换后的完整状态
 *
 * @example
 * ```ts
 * // 服务端数据格式
 * const serverData = [
 *   {
 *     id: 'task-1',
 *     val: '任务标题',
 *     leaf: false,
 *     children: [
 *       { id: 'session-1', val: '会话标题', leaf: true }
 *     ]
 *   }
 * ]
 *
 * const result = hydrateFromTaskListData(serverData, prevState)
 * ```
 */
export function hydrateFromTaskListData(
  data: CommonTreeDict[],
  prev: {
    tasks: Task[]
    sessions: ArenaSession[]
    activeTaskId: string
  }
): TaskListHydrationResult {
  // 构建 ID -> 对象的映射，用于快速查找已有数据
  const prevTaskById = new Map(prev.tasks.map((t) => [t.id, t]))
  const prevSessionById = new Map(prev.sessions.map((s) => [s.id, s]))

  const nextTasks: Task[] = []
  const nextSessions: ArenaSession[] = []

  // 遍历服务端数据，转换为本地格式
  for (const item of data) {
    // 跳过叶子节点（会话），在父节点处理
    if (item.leaf) continue

    // 处理任务节点
    const existingTask = prevTaskById.get(item.id)
    nextTasks.push(
      existingTask
        // 已存在：保留本地状态，更新标题和时间
        ? { ...existingTask, title: item.val, updatedAt: Date.now() }
        // 新任务：创建新对象，默认展开
        : createEmptyTask({ id: item.id, title: item.val, expanded: true })
    )

    // 处理任务下的会话子节点
    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        // 只处理叶子节点（会话）
        if (!child.leaf) continue

        const existingSession = prevSessionById.get(child.id)
        nextSessions.push(
          existingSession
            // 已存在：保留本地状态（问题、回答等），更新标题
            ? {
                ...existingSession,
                taskId: item.id,
                title: child.val,
                updatedAt: Date.now(),
              }
            // 新会话：创建空会话
            : createEmptySession(item.id, { id: child.id, title: child.val })
        )
      }
    }
  }

  // 如果服务端返回空数据，创建默认任务
  if (nextTasks.length === 0) {
    const defaultTask = createEmptyTask({ title: '默认任务' })
    return {
      tasks: [defaultTask],
      sessions: [],
      activeTaskId: defaultTask.id,
      activeSessionId: '',
    }
  }

  // 保持激活状态的连续性
  const keepActiveTask = nextTasks.some((t) => t.id === prev.activeTaskId)
  const activeTaskId = keepActiveTask ? prev.activeTaskId : ''
  const activeSessionId = activeTaskId ? (nextSessions.find((s) => s.taskId === activeTaskId)?.id || '') : ''

  return {
    tasks: nextTasks,
    sessions: nextSessions,
    activeTaskId,
    activeSessionId,
  }
}

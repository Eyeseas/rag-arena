/**
 * @file 任务管理 Slice
 * @description 处理任务的增删改查操作
 *
 * 任务是 Arena 的顶层组织单位，每个任务下可以包含多个会话
 * 支持的操作：
 * - 创建任务（带数量限制）
 * - 删除任务（级联删除会话）
 * - 重命名任务
 * - 切换任务展开/折叠状态
 * - 设置激活任务
 */

import type { StateCreator } from 'zustand'
import type { ArenaTaskSlice, ArenaState } from '../arenaStoreTypes'
import { MAX_TASKS, createEmptyTask } from '../arenaHelpers'
import {
  computeActiveAfterTaskDeletion,
  getLatestTaskSession,
} from './internalHelpers'

/**
 * 创建任务管理 Slice
 *
 * @param set - Zustand set 函数
 * @param get - Zustand get 函数
 * @returns Task slice 的 action 实现
 */
export const createTaskSlice: StateCreator<ArenaState, [], [], ArenaTaskSlice> = (set, get) => ({
  // ========== 任务管理 Actions ==========

  /**
   * 创建新任务
   * - 新任务添加到列表开头
   * - 自动设为激活任务
   * - 超出数量限制时移除最旧的任务
   *
   * @param title - 任务标题，默认为"新任务"
   * @returns 新创建任务的 ID
   */
  createTask: (title) => {
    const newTask = createEmptyTask({ title: title || '新任务' })

    set((state) => {
      // 新任务添加到开头
      let tasks = [newTask, ...state.tasks]
      // 限制任务数量，超出时移除末尾的任务
      if (tasks.length > MAX_TASKS) {
        tasks = tasks.slice(0, MAX_TASKS)
      }
      return {
        tasks,
        activeTaskId: newTask.id,
        // 新任务没有会话，清空激活会话
        activeSessionId: '',
      }
    })
    return newTask.id
  },

  /**
   * 删除任务
   * - 级联删除该任务下的所有会话
   * - 智能计算删除后的激活状态
   *
   * @param taskId - 要删除的任务 ID
   */
  deleteTask: (taskId) => {
    set((state) => {
      const remainingTasks = state.tasks.filter((t) => t.id !== taskId)
      const remainingSessions = state.sessions.filter((s) => s.taskId !== taskId)

      if (remainingTasks.length === 0) {
        return {
          tasks: [],
          sessions: [],
          activeTaskId: '',
          activeSessionId: '',
        }
      }

      const { activeTaskId, activeSessionId } = computeActiveAfterTaskDeletion({
        deletedTaskId: taskId,
        prevActiveTaskId: state.activeTaskId,
        remainingTasks,
        remainingSessions,
      })

      return {
        tasks: remainingTasks,
        sessions: remainingSessions,
        activeTaskId,
        activeSessionId,
      }
    })
  },

  /**
   * 重命名任务
   *
   * @param taskId - 任务 ID
   * @param title - 新标题
   */
  renameTask: (taskId, title) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, title, updatedAt: Date.now() } : t)),
    }))
  },

  /**
   * 切换任务的展开/折叠状态
   * 用于侧边栏的任务列表展示
   *
   * @param taskId - 任务 ID
   */
  toggleTaskExpanded: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, expanded: !t.expanded } : t)),
    }))
  },

  /**
   * 设置当前激活的任务
   * 同时会自动激活该任务下最近更新的会话
   *
   * @param taskId - 任务 ID
   */
  setActiveTaskId: (taskId) => {
    const { tasks, sessions } = get()
    // 验证任务存在
    const exists = tasks.some((t) => t.id === taskId)
    if (!exists) return

    // 切换到该任务下最近更新的会话
    const latest = getLatestTaskSession(sessions, taskId)

    set({
      activeTaskId: taskId,
      activeSessionId: latest?.id || '',
    })
  },
})

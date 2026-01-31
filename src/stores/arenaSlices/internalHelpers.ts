/**
 * @file Arena Slice 内部辅助函数
 * @description 提供各个 slice 共享的内部工具函数
 *
 * 这些函数仅供 slice 内部使用，不对外导出
 * 主要包括：
 * - 会话查询和筛选函数
 * - 状态更新辅助函数
 * - 删除后激活状态计算函数
 */

import type { StateCreator } from 'zustand'
import type { ArenaState } from '../arenaStoreTypes'
import type { ArenaSession } from '../arenaTypes'
import { byUpdatedAtAsc, byUpdatedAtDesc } from '../arenaSort'

// ========== 类型别名 ==========

/** Zustand set 函数类型 */
type ArenaSet = Parameters<StateCreator<ArenaState>>[0]

/** Zustand get 函数类型 */
type ArenaGet = Parameters<StateCreator<ArenaState>>[1]

// ========== 会话查询函数 ==========

/**
 * 获取指定任务下的所有会话
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 属于该任务的会话数组
 */
export function getTaskSessions(sessions: ArenaSession[], taskId: string) {
  return sessions.filter((s) => s.taskId === taskId)
}

/**
 * 获取指定任务下的会话（按更新时间降序排序）
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 排序后的会话数组，最近更新的在前
 */
export function getTaskSessionsSortedByUpdatedAtDesc(sessions: ArenaSession[], taskId: string) {
  return getTaskSessions(sessions, taskId).sort(byUpdatedAtDesc)
}

/**
 * 获取指定任务下的会话（按更新时间升序排序）
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 排序后的会话数组，最早更新的在前
 */
export function getTaskSessionsSortedByUpdatedAtAsc(sessions: ArenaSession[], taskId: string) {
  return getTaskSessions(sessions, taskId).sort(byUpdatedAtAsc)
}

/**
 * 获取指定任务下的第一个会话（按数组顺序）
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 第一个会话或 undefined
 */
export function getFirstTaskSession(sessions: ArenaSession[], taskId: string) {
  return getTaskSessions(sessions, taskId)[0]
}

/**
 * 获取指定任务下最近更新的会话
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 最近更新的会话或 undefined
 */
export function getLatestTaskSession(sessions: ArenaSession[], taskId: string) {
  return getTaskSessionsSortedByUpdatedAtDesc(sessions, taskId)[0]
}

/**
 * 获取指定任务下最早更新的会话
 * 用于在会话数量超限时找到要删除的会话
 *
 * @param sessions - 所有会话列表
 * @param taskId - 任务 ID
 * @returns 最早更新的会话或 undefined
 */
export function getOldestTaskSession(sessions: ArenaSession[], taskId: string) {
  return getTaskSessionsSortedByUpdatedAtAsc(sessions, taskId)[0]
}

// ========== 状态更新辅助函数 ==========

/**
 * 更新任务的 updatedAt 时间戳
 * 用于在会话变更时同步更新所属任务的时间
 *
 * @param set - Zustand set 函数
 * @param taskId - 要更新的任务 ID
 */
export function touchTask(set: ArenaSet, taskId: string) {
  set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, updatedAt: Date.now() } : t)),
  }))
}

/**
 * 更新当前激活的会话
 * 通过 updater 函数对当前激活会话进行更新
 *
 * @param set - Zustand set 函数
 * @param get - Zustand get 函数
 * @param updater - 会话更新函数，接收当前会话返回新会话
 */
export function updateActiveSession(
  set: ArenaSet,
  get: ArenaGet,
  updater: (session: ArenaSession) => ArenaSession
) {
  const { activeSessionId, sessions } = get()
  const nextSessions = sessions.map((s) => (s.id === activeSessionId ? updater(s) : s))
  set({ sessions: nextSessions })
}

// ========== 删除后激活状态计算函数 ==========

/**
 * 计算任务删除后的激活状态
 * 处理删除任务后应该激活哪个任务和会话
 *
 * @param params.deletedTaskId - 被删除的任务 ID
 * @param params.prevActiveTaskId - 删除前激活的任务 ID
 * @param params.remainingTasks - 删除后剩余的任务列表
 * @param params.remainingSessions - 删除后剩余的会话列表
 * @returns 新的激活任务 ID 和会话 ID
 */
export function computeActiveAfterTaskDeletion(params: {
  deletedTaskId: string
  prevActiveTaskId: string
  remainingTasks: Array<{ id: string }>
  remainingSessions: ArenaSession[]
}): { activeTaskId: string; activeSessionId: string } {
  const { deletedTaskId, prevActiveTaskId, remainingTasks, remainingSessions } = params

  // 如果删除的不是当前激活的任务，保持激活任务不变，但清空激活会话
  if (prevActiveTaskId !== deletedTaskId) {
    return { activeTaskId: prevActiveTaskId, activeSessionId: '' }
  }

  // 删除的是当前激活任务，切换到第一个剩余任务
  const nextActiveTaskId = remainingTasks[0]?.id || ''
  if (!nextActiveTaskId) return { activeTaskId: '', activeSessionId: '' }

  // 激活新任务下的第一个会话
  const nextActiveSessionId = getFirstTaskSession(remainingSessions, nextActiveTaskId)?.id || ''
  return { activeTaskId: nextActiveTaskId, activeSessionId: nextActiveSessionId }
}

/**
 * 计算会话删除后的激活会话
 * 处理删除会话后应该激活哪个会话
 *
 * @param params.deletedSessionId - 被删除的会话 ID
 * @param params.prevActiveSessionId - 删除前激活的会话 ID
 * @param params.taskId - 会话所属的任务 ID
 * @param params.remainingSessions - 删除后剩余的会话列表
 * @returns 新的激活会话 ID
 */
export function computeActiveSessionAfterSessionDeletion(params: {
  deletedSessionId: string
  prevActiveSessionId: string
  taskId: string
  remainingSessions: ArenaSession[]
}): string {
  const { deletedSessionId, prevActiveSessionId, taskId, remainingSessions } = params

  // 如果删除的不是当前激活的会话，保持不变
  if (prevActiveSessionId !== deletedSessionId) return prevActiveSessionId

  // 删除的是当前激活会话，切换到该任务下最近更新的会话
  return getLatestTaskSession(remainingSessions, taskId)?.id || ''
}

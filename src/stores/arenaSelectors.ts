/**
 * @file Arena Store 选择器函数
 * @description 提供从 Arena store 状态中提取数据的纯函数选择器
 *
 * 选择器的设计原则：
 * - 保持与 store 实现解耦，消费者不依赖内部数据结构
 * - 纯函数，无副作用，便于测试和组合
 * - 支持 memoization 优化（配合 useMemo 或 zustand 的 shallow 比较）
 */

import type { Answer, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'
import { byUpdatedAtDesc } from './arenaSort'

// ========== 会话选择器 ==========

/**
 * 根据 ID 查找会话
 *
 * @param state - 包含 sessions 数组的状态对象
 * @param sessionId - 要查找的会话 ID
 * @returns 找到的会话对象，未找到返回 null
 */
export function selectSessionById(state: { sessions: ArenaSession[] }, sessionId: string): ArenaSession | null {
  return state.sessions.find((s) => s.id === sessionId) || null
}

/**
 * 获取当前激活的会话
 *
 * @param state - 包含 sessions 和 activeSessionId 的状态对象
 * @returns 当前激活的会话，无激活会话时返回 null
 */
export function selectActiveSession(state: {
  sessions: ArenaSession[]
  activeSessionId: string
}): ArenaSession | null {
  if (!state.activeSessionId) return null
  return selectSessionById(state, state.activeSessionId)
}

// ========== 任务选择器 ==========

/**
 * 根据 ID 查找任务
 *
 * @param state - 包含 tasks 数组的状态对象
 * @param taskId - 要查找的任务 ID
 * @returns 找到的任务对象，未找到返回 null
 */
export function selectTaskById(state: { tasks: Task[] }, taskId: string): Task | null {
  return state.tasks.find((t) => t.id === taskId) || null
}

/**
 * 获取当前激活的任务
 *
 * @param state - 包含 tasks 和 activeTaskId 的状态对象
 * @returns 当前激活的任务，无激活任务时返回 null
 */
export function selectActiveTask(state: { tasks: Task[]; activeTaskId: string }): Task | null {
  if (!state.activeTaskId) return null
  return selectTaskById(state, state.activeTaskId)
}

/**
 * 获取指定任务下的所有会话（按更新时间降序排序）
 *
 * @param state - 包含 sessions 数组的状态对象
 * @param taskId - 任务 ID
 * @returns 该任务下的会话数组，最近更新的在前
 */
export function selectTaskSessionsSorted(state: { sessions: ArenaSession[] }, taskId: string) {
  return state.sessions
    .filter((s) => s.taskId === taskId)
    .sort(byUpdatedAtDesc)
}

/**
 * 获取所有任务（按更新时间降序排序）
 *
 * @param state - 包含 tasks 数组的状态对象
 * @returns 排序后的任务数组，最近更新的在前
 */
export function selectTasksSorted(state: { tasks: Task[] }): Task[] {
  return [...state.tasks].sort(byUpdatedAtDesc)
}

// ========== 回答选择器 ==========

/**
 * 根据 ID 从回答列表中查找回答
 *
 * @param answers - 回答数组
 * @param answerId - 要查找的回答 ID
 * @returns 找到的回答对象，未找到返回 null
 */
export function selectAnswerById(answers: readonly Answer[], answerId: string): Answer | null {
  return answers.find((a) => a.id === answerId) || null
}

/**
 * 统计所有回答的引用数量总和
 * 用于显示引用统计信息
 *
 * @param answers - 回答数组
 * @returns 所有回答的引用总数
 */
export function selectCitationsCount(answers: readonly Answer[]): number {
  return answers.reduce((sum, a) => sum + (a.citations?.length || 0), 0)
}

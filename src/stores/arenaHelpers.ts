/**
 * @file Arena 辅助函数
 * @description 提供 Arena store 使用的工具函数和工厂函数
 *
 * 包含：
 * - 常量定义（任务/会话数量限制）
 * - ID 生成函数
 * - 实体工厂函数（创建空任务/会话）
 * - 字符串处理函数
 */

import type { Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'

// ========== 常量定义 ==========

/** 最大任务数量限制，超出时会移除最旧的任务 */
export const MAX_TASKS = 20

/** 每个任务下最大会话数量限制 */
export const MAX_SESSIONS_PER_TASK = 50

// ========== 工具函数 ==========

/**
 * 生成唯一标识符
 * 优先使用 crypto.randomUUID()，降级使用时间戳+随机数
 *
 * @returns 唯一 ID 字符串
 */
export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * 将问题文本转换为会话标题
 * 截取前 24 个字符，超出部分用省略号表示
 *
 * @param question - 问题文本
 * @returns 会话标题
 */
export function toSessionTitle(question: string) {
  const trimmed = question.trim()
  if (!trimmed) return '新会话'
  return trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed
}

// ========== 工厂函数 ==========

/**
 * 创建空任务对象
 * 用于初始化新任务，支持部分字段覆盖
 *
 * @param partial - 可选的部分任务属性
 * @returns 完整的任务对象
 *
 * @example
 * ```ts
 * // 创建默认任务
 * const task = createEmptyTask()
 *
 * // 创建指定标题的任务
 * const task = createEmptyTask({ title: '我的任务' })
 *
 * // 使用服务端返回的 ID
 * const task = createEmptyTask({ id: serverTaskId, title: serverTitle })
 * ```
 */
export function createEmptyTask(partial?: Partial<Task>): Task {
  const now = Date.now()
  return {
    id: partial?.id || createId(),
    title: partial?.title || '新任务',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    expanded: partial?.expanded ?? true,
  }
}

/**
 * 创建空会话对象
 必须指定所属任务 ID
 *
 * @param taskId - 所属任务 ID
 * @param partial - 可选的部分会话属性
 * @returns 完整的会话对象
 *
 * @example
 * ```ts
 * // 创建空会话
 * const session = createEmptySession(taskId)
 *
 * // 创建带问题的会话
 * const session = createEmptySession(taskId, { question: '什么是 RAG？' })
 *
 * // 使用服务端返回的 ID 和标题
 * const session = createEmptySession(taskId, { id: serverId, title: serverTitle })
 * ```
 */
export function createEmptySession(taskId: string, partial?: Partial<ArenaSession>): ArenaSession {
  const now = Date.now()
  const id = partial?.id || createId()
  const question = partial?.question || ''
  return {
    id,
    taskId,
    title: partial?.title || toSessionTitle(question),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    question,
    serverQuestionId: partial?.serverQuestionId ?? null,
    answers: partial?.answers ?? [],
    votedAnswerId: partial?.votedAnswerId ?? null,
    priIdMapping: partial?.priIdMapping,
  }
}

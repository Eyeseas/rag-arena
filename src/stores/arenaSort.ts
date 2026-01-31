/**
 * @file Arena 排序辅助函数
 * @description 提供 Arena 领域对象的排序比较函数
 *
 * 这些函数用于对任务和会话列表进行排序，
 * 通常按更新时间排序以保证最近使用的项目显示在前面
 */

// ========== 类型定义 ==========

/**
 * 包含 updatedAt 字段的对象类型
 * 用于约束排序函数的输入类型
 */
export type HasUpdatedAt = { updatedAt: number }

// ========== 排序函数 ==========

/**
 * 按更新时间降序排序（最新的在前）
 * 用于 Array.sort() 的比较函数
 *
 * @param a - 第一个对象
 * @param b - 第二个对象
 * @returns 负数表示 a 在前，正数表示 b 在前
 *
 * @example
 * ```ts
 * const sortedTasks = tasks.sort(byUpdatedAtDesc)
 * // 结果：最近更新的任务排在最前面
 * ```
 */
export function byUpdatedAtDesc(a: HasUpdatedAt, b: HasUpdatedAt) {
  return b.updatedAt - a.updatedAt
}

/**
 * 按更新时间升序排序（最旧的在前）
 * 用于 Array.sort() 的比较函数
 *
 * @param a - 第一个对象
 * @param b - 第二个对象
 * @returns 负数表示 a 在前，正数表示 b 在前
 *
 * @example
 * ```ts
 * const sortedSessions = sessions.sort(byUpdatedAtAsc)
 * // 结果：最早更新的会话排在最前面（用于找到最旧的会话进行清理）
 * ```
 */
export function byUpdatedAtAsc(a: HasUpdatedAt, b: HasUpdatedAt) {
  return a.updatedAt - b.updatedAt
}

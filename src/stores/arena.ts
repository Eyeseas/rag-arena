/**
 * @file Arena Store 主入口
 * @description RAG 问答竞技场状态管理，支持任务-会话两级结构
 *
 * Store 架构说明：
 * - 采用 slice 模式拆分，每个 slice 负责一个领域的状态和 action
 * - 主入口文件保持精简，只负责组合各个 slice
 * - 类型定义独立于实现，避免循环依赖
 *
 * Slice 组成：
 * - hydrationSlice: 服务端数据水合（从服务端同步数据到本地）
 * - taskSlice: 任务管理（创建、删除、重命名、切换）
 * - sessionSlice: 会话管理（创建、删除、加载历史）
 * - answerSlice: 问答管理（提问、接收回答、投票）
 *
 * @example
 * ```tsx
 * // 在组件中使用
 * import { useArenaStore } from '@/stores/arena'
 *
 * function ArenaPage() {
 *   const { tasks, activeTaskId, createTask } = useArenaStore()
 *
 *   // 或者选择性订阅以优化性能
 *   const isLoading = useArenaStore((state) => state.isLoading)
 * }
 * ```
 */

import { create } from 'zustand'
import type { ArenaState } from './arenaStoreTypes'
import { createHydrationSlice } from './arenaSlices/hydrationSlice'
import { createTaskSlice } from './arenaSlices/taskSlice'
import { createSessionSlice } from './arenaSlices/sessionSlice'
import { createAnswerSlice } from './arenaSlices/answerSlice'

// 导出会话类型供外部使用
export type { ArenaSession } from './arenaTypes'

/**
 * Arena Store 实例
 *
 * 状态结构：
 * - tasks: 任务列表
 * - sessions: 所有会话列表
 * - activeTaskId: 当前激活任务
 * - activeSessionId: 当前激活会话
 * - isLoading: 回答加载状态
 * - isVoting: 投票提交状态
 * - isTasksLoading: 任务列表加载状态
 * - hasFetchedTasks: 是否已获取任务列表
 * - isLoadingHistory: 历史记录加载状态
 */
export const useArenaStore = create<ArenaState>()((set, get, api) => ({
  // ========== 初始状态 ==========
  /** 任务列表 */
  tasks: [],
  /** 会话列表 */
  sessions: [],
  /** 当前激活的任务 ID */
  activeTaskId: '',
  /** 当前激活的会话 ID */
  activeSessionId: '',
  /** 是否正在加载回答 */
  isLoading: false,
  /** 是否正在投票 */
  isVoting: false,
  /** 是否正在加载任务列表 */
  isTasksLoading: false,
  /** 是否已从服务端获取过任务列表 */
  hasFetchedTasks: false,
  /** 是否正在加载会话历史 */
  isLoadingHistory: false,

  // ========== Slice Actions ==========
  // 通过展开各个 slice 的返回值来组合所有 action
  ...createHydrationSlice(set, get, api),
  ...createTaskSlice(set, get, api),
  ...createSessionSlice(set, get, api),
  ...createAnswerSlice(set, get, api),
}))

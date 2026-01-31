/**
 * @file 服务端数据水合 Slice
 * @description 处理从服务端获取数据后更新本地 store 状态的逻辑
 *
 * 主要功能：
 * - 设置任务列表加载状态
 * - 应用服务端返回的任务列表数据
 * - 更新会话的服务端信息（ID 映射）
 *
 * 注意：此 slice 不直接发起网络请求，只负责状态更新
 * 网络请求由 React Query 或组件层处理
 */

import type { StateCreator } from 'zustand'
import type { ArenaHydrationSlice, ArenaState } from '../arenaStoreTypes'
import { hydrateFromTaskListData } from '../arenaServerAdapter'
import type { ArenaSession } from '../arenaTypes'

/**
 * 创建服务端数据水合 Slice
 *
 * @param set - Zustand set 函数
 * @param get - Zustand get 函数
 * @returns Hydration slice 的 action 实现
 */
export const createHydrationSlice: StateCreator<ArenaState, [], [], ArenaHydrationSlice> = (
  set,
  get
) => ({
  // ========== 服务端数据水合 Actions ==========

  /**
   * 设置任务列表加载状态
   * 在开始/结束获取任务列表时调用
   */
  setTasksLoading: (isTasksLoading) => set({ isTasksLoading }),

  /**
   * 设置是否已获取任务列表标记
   * 用于避免重复请求
   */
  setHasFetchedTasks: (hasFetchedTasks) => set({ hasFetchedTasks }),

  /**
   * 应用服务端返回的任务列表数据
   * 将树形结构转换为扁平的 tasks + sessions，并保留本地状态
   */
  applyTaskListFromServer: (data) => {
    const { tasks, sessions, activeTaskId, activeSessionId } = hydrateFromTaskListData(data, {
      tasks: get().tasks,
      sessions: get().sessions,
      activeTaskId: get().activeTaskId,
    })
    set({
      tasks,
      sessions,
      activeTaskId,
      activeSessionId,
    })
  },

  /**
   * 设置会话的服务端信息
   * 当服务端返回新的会话 ID 时，更新本地会话的 ID 和映射信息
   *
   * 处理逻辑：
   * 1. 找到本地会话，用服务端 ID 替换本地 ID
   * 2. 保存 priIdMapping（模型掩码码到私有 ID 的映射）
   * 3. 重置会话的回答和投票状态
   * 4. 更新激活会话 ID（如果被替换的是当前激活会话）
   */
  setSessionConversationInfo: ({ localSessionId, serverSessionId, priIdMapping }) => {
    set((state) => {
      const nextSessions: ArenaSession[] = []
      for (const s of state.sessions) {
        if (s.id === localSessionId) {
          // 用服务端 ID 替换本地 ID，保留问题但重置其他状态
          nextSessions.push({
            ...s,
            id: serverSessionId,
            priIdMapping,
            serverQuestionId: null,
            answers: [],
            votedAnswerId: null,
            updatedAt: Date.now(),
          })
          continue
        }
        // 避免重复：如果已存在相同服务端 ID 的会话，跳过
        if (s.id === serverSessionId) continue
        nextSessions.push(s)
      }

      return {
        sessions: nextSessions,
        // 如果替换的是当前激活会话，更新激活会话 ID
        activeSessionId:
          state.activeSessionId === localSessionId ? serverSessionId : state.activeSessionId,
      }
    })
  },
})

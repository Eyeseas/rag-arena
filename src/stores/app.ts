/**
 * @file 应用全局状态管理 Store
 * @description 管理应用级别的全局UI状态，包括侧边栏折叠状态和主题切换
 *
 * 使用 Zustand 进行状态管理，并通过 persist 中间件实现状态持久化到 localStorage
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 应用状态接口定义
 */
interface AppState {
  /** 侧边栏是否折叠 */
  collapsed: boolean
  /** 当前主题模式：亮色/暗色 */
  theme: 'light' | 'dark'
  /** 切换侧边栏折叠状态 */
  toggleCollapsed: () => void
  /** 设置主题模式 */
  setTheme: (theme: 'light' | 'dark') => void
}

/**
 * 应用全局状态 Store
 *
 * @example
 * ```tsx
 * // 在组件中使用
 * const { collapsed, toggleCollapsed } = useAppStore()
 *
 * // 或者选择性订阅
 * const theme = useAppStore((state) => state.theme)
 * ```
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ========== 状态初始值 ==========
      /** 侧边栏默认展开 */
      collapsed: false,
      /** 默认使用亮色主题 */
      theme: 'light',

      // ========== Actions ==========
      /**
       * 切换侧边栏折叠状态
       * 用于响应用户点击折叠按钮
       */
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),

      /**
       * 设置主题模式
       * @param theme - 目标主题：'light' 或 'dark'
       */
      setTheme: (theme) => set({ theme }),
    }),
    {
      /** localStorage 存储键名 */
      name: 'app-store',
    }
  )
)

/**
 * @file 用户认证状态管理 Store
 * @description 管理用户登录状态、用户信息和认证令牌
 *
 * 使用 Zustand 进行状态管理，通过 persist 中间件将认证信息持久化到 localStorage
 * 支持 TSSO (统一单点登录) 认证方式
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

/**
 * 认证状态接口定义
 */
interface AuthState {
  /** 当前登录用户信息，未登录时为 null */
  user: User | null
  /** TSSO 认证令牌，用于 API 请求鉴权 */
  tssotoken: string | null
  /** 是否已认证（登录状态） */
  isAuthenticated: boolean
  /** 设置认证信息（登录成功后调用） */
  setAuth: (user: User, tssotoken: string) => void
  /** 清除认证信息（登出时调用） */
  clearAuth: () => void
  /** 获取当前 TSSO 令牌 */
  getTssotoken: () => string | null
}

/**
 * 用户认证状态 Store
 *
 * @example
 * ```tsx
 * // 登录成功后设置认证信息
 * const { setAuth } = useAuthStore()
 * setAuth(userData, token)
 *
 * // 检查登录状态
 * const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
 *
 * // 登出
 * const { clearAuth } = useAuthStore()
 * clearAuth()
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ========== 状态初始值 ==========
      /** 用户信息默认为空 */
      user: null,
      /** 令牌默认为空 */
      tssotoken: null,
      /** 默认未认证 */
      isAuthenticated: false,

      // ========== Actions ==========
      /**
       * 设置认证信息
       * 登录成功后调用，同时更新用户信息、令牌和认证状态
       * @param user - 用户信息对象
       * @param tssotoken - TSSO 认证令牌
       */
      setAuth: (user, tssotoken) => {
        set({ user, tssotoken, isAuthenticated: true })
      },

      /**
       * 清除认证信息
       * 登出时调用，重置所有认证相关状态
       */
      clearAuth: () => {
        set({ user: null, tssotoken: null, isAuthenticated: false })
      },

      /**
       * 获取当前 TSSO 令牌
       * 用于在非 React 组件中获取令牌（如 API 拦截器）
       * @returns 当前令牌或 null
       */
      getTssotoken: () => get().tssotoken,
    }),
    {
      /** localStorage 存储键名 */
      name: 'auth-store',
      /**
       * 选择性持久化
       * 只持久化必要的认证状态，不持久化方法
       */
      partialize: (state) => ({
        user: state.user,
        tssotoken: state.tssotoken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

/**
 * 获取 TSSO 令牌的工具函数
 * 用于在 React 组件外部（如 axios 拦截器）获取认证令牌
 *
 * @returns 当前 TSSO 令牌或 null
 *
 * @example
 * ```ts
 * // 在 axios 拦截器中使用
 * axios.interceptors.request.use((config) => {
 *   const token = getTssotoken()
 *   if (token) {
 *     config.headers.Authorization = `Bearer ${token}`
 *   }
 *   return config
 * })
 * ```
 */
export function getTssotoken(): string | null {
  return useAuthStore.getState().tssotoken
}

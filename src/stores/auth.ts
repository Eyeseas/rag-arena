import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  tssotoken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, tssotoken: string) => void
  clearAuth: () => void
  getTssotoken: () => string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tssotoken: null,
      isAuthenticated: false,

      setAuth: (user, tssotoken) => {
        set({ user, tssotoken, isAuthenticated: true })
      },

      clearAuth: () => {
        set({ user: null, tssotoken: null, isAuthenticated: false })
      },

      getTssotoken: () => get().tssotoken,
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        tssotoken: state.tssotoken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export function getTssotoken(): string | null {
  return useAuthStore.getState().tssotoken
}

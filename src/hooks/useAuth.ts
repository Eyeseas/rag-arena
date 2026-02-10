import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/services/auth'

type AuthStatus = 'checking' | 'authenticated' | 'redirecting'

const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false'

export function useAuth() {
  const { user, isAuthenticated, setAuth, tssotoken } = useAuthStore()
  const [status, setStatus] = useState<AuthStatus>(AUTH_ENABLED ? 'checking' : 'authenticated')
  const hasChecked = useRef(false)

  useEffect(() => {
    if (!AUTH_ENABLED) {
      console.log('[useAuth] Auth disabled, skipping')
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('tssotoken')

    if (tokenFromUrl) {
      console.log('[useAuth] URL token found, forcing re-authentication')
      // Avoid a second auth-check after setAuth triggers a re-render.
      hasChecked.current = true

      const url = new URL(window.location.href)
      url.searchParams.delete('tssotoken')
      window.history.replaceState({}, '', url.toString())
      console.log('[useAuth] Removed token from URL')

      const authenticateWithUrlToken = async () => {
        try {
          console.log('[useAuth] Calling login API with URL token...')
          const response = await login(tokenFromUrl)
          console.log('[useAuth] Login response:', response)

          if (response.success) {
            setAuth(response.user, tokenFromUrl)
            setStatus('authenticated')
            console.log('[useAuth] Login success with URL token, user info updated')
          } else {
            console.log('[useAuth] Login failed, redirecting to:', response.redirectUrl)
            setStatus('redirecting')
            window.location.href = response.redirectUrl
          }
        } catch (error) {
          console.error('[useAuth] Login error:', error)
          setStatus('redirecting')
        }
      }

      authenticateWithUrlToken()
      return
    }

    if (hasChecked.current) {
      console.log('[useAuth] Already checked, skipping')
      if (isAuthenticated) {
        setStatus('authenticated')
      }
      return
    }

    const checkAuth = async () => {
      console.log('[useAuth] checkAuth called', {
        tssotoken,
        isAuthenticated,
        hasChecked: hasChecked.current,
      })

      hasChecked.current = true

      const tokenToUse = tssotoken || undefined
      console.log('[useAuth] tokenToUse:', tokenToUse)

      try {
        console.log('[useAuth] Calling login API...')
        const response = await login(tokenToUse)
        console.log('[useAuth] Login response:', response)

        if (response.success) {
          setAuth(response.user, tokenToUse || '')
          setStatus('authenticated')
          console.log('[useAuth] Login success, authenticated')
        } else {
          console.log('[useAuth] Login failed, redirecting to:', response.redirectUrl)
          setStatus('redirecting')
          window.location.href = response.redirectUrl
        }
      } catch (error) {
        console.error('[useAuth] Login error:', error)
        setStatus('redirecting')
      }
    }

    checkAuth()
  }, [isAuthenticated, tssotoken, setAuth])

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'checking',
    isRedirecting: status === 'redirecting',
  }
}

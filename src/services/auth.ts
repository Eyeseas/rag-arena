import type { LoginResponse } from '@/types/auth'
import { post } from '@/lib/request'

export async function login(tssotoken?: string): Promise<LoginResponse> {
  return post<LoginResponse>('/sso/api/login', undefined, {
    headers: tssotoken ? { tssotoken } : undefined,
  })
}

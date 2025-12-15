import { get, post, put, del } from '@/lib/request'

// 示例 API 服务
export const userApi = {
  list: (params?: Record<string, unknown>) => get<{ list: unknown[]; total: number }>('/users', { params }),
  detail: (id: string) => get<unknown>(`/users/${id}`),
  create: (data: unknown) => post<unknown>('/users', data),
  update: (id: string, data: unknown) => put<unknown>(`/users/${id}`, data),
  delete: (id: string) => del<unknown>(`/users/${id}`),
}

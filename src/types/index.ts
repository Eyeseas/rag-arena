// 通用响应类型
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 用户类型示例
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  createdAt: string
}

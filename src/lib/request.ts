/**
 * HTTP 请求工具
 * 
 * 支持两种模式：
 * - dev 模式：使用相对路径，通过 Vite proxy 代理到开发服务器
 * - prod 模式：使用环境变量配置的正式环境 API 地址
 * 
 * @example
 * ```ts
 * import { get, post } from '@/lib/request'
 * 
 * // GET 请求
 * const data = await get<UserData>('/api/user/1')
 * 
 * // POST 请求
 * const result = await post<Response>('/api/user', { name: 'test' })
 * ```
 */

import axios, { type AxiosRequestConfig } from 'axios'

/**
 * 获取 API 基础地址
 * 根据不同的模式返回不同的 baseURL：
 * - dev 模式：返回空字符串（使用相对路径，走 Vite proxy）
 * - prod 模式：返回环境变量配置的正式环境地址
 */
const getBaseURL = () => {
  const apiMode = import.meta.env.VITE_API_MODE || 'dev'
  const envURL = import.meta.env.VITE_API_BASE_URL
  
  // dev 模式：使用相对路径，走 Vite proxy
  if (apiMode === 'dev') {
    return ''
  }
  
  // prod 模式：使用环境变量配置的正式环境地址
  if (apiMode === 'prod') {
    return envURL || ''
  }
  
  // 默认使用相对路径
  return ''
}

const request = axios.create({
  baseURL: getBaseURL(),
  // AI 回答可能需要较长时间，设置 60 秒超时
  timeout: 60000,
})

// 打印当前模式和 baseURL，方便调试
const apiMode = import.meta.env.VITE_API_MODE || 'dev'
console.log(`[Request] API Mode: ${apiMode}, baseURL:`, request.defaults.baseURL || '(empty, will use relative path)')

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const message = error.response?.data?.message || error.message
    return Promise.reject(new Error(message))
  }
)

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config)
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config)
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config)
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config)
}

export default request

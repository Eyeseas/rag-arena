import axios, { type AxiosRequestConfig } from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

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

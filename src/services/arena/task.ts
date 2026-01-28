/**
 * Arena 任务管理服务
 */

import type {
  TaskListResponse,
  TaskAddRequest,
  TaskAddResponse,
} from '@/types/arena'
import { get, post } from '@/lib/request'

/**
 * 获取任务列表
 *
 * @param userId 用户ID
 * @returns 任务列表响应
 *
 * @example
 * ```ts
 * const response = await getTaskList('user_123')
 * console.log(response.data) // 任务列表
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /task/list
 * Headers: { userId: string }
 *
 * 通过 Vite proxy 代理到: http://localhost:8901/task/list
 * 前端调用路径: /api/task/list (会被 proxy 转发)
 */
export async function getTaskList(userId: string): Promise<TaskListResponse> {
  console.log('getTaskList', userId)
  try {
    // 通过 proxy 调用，路径 /api/task/list 会被代理到 http://192.168.157.104:8901/task/list
    // proxy 配置: /api -> http://192.168.157.104:8901 (去掉 /api 前缀)
    const response = await get<TaskListResponse>('/api/task/list', {
      headers: {
        userId,
      },
    })

    console.log('[ArenaApi] getTaskList response:', response)
    return response
  } catch (error) {
    console.error('[ArenaApi] getTaskList failed:', error)
    throw error
  }
}

/**
 * 添加任务
 *
 * @param userId 用户ID
 * @param request 添加任务请求
 * @returns 添加任务响应
 *
 * @example
 * ```ts
 * const response = await addTask('user_123', {
 *   title: '新任务',
 *   description: '任务描述'
 * })
 * console.log(response.data) // true
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * POST /task/add
 * Headers: { userId: string }
 * Body: TaskAddRequest
 *
 * 通过 Vite proxy 代理到: http://192.168.157.104:8901/task/add
 * 前端调用路径: /api/task/add (会被 proxy 转发)
 */
export async function addTask(
  userId: string,
  request: TaskAddRequest
): Promise<TaskAddResponse> {
  console.log('addTask', userId, request)
  try {
    // 通过 proxy 调用，路径 /api/task/add 会被代理到 http://192.168.157.104:8901/task/add
    const response = await post<TaskAddResponse>('/api/task/add', request, {
      headers: {
        userId,
      },
    })

    console.log('[ArenaApi] addTask response:', response)
    return response
  } catch (error) {
    console.error('[ArenaApi] addTask failed:', error)
    throw error
  }
}

/**
 * 删除任务
 *
 * @param userId 用户ID
 * @param code 任务code
 * @returns 删除结果
 *
 * @example
 * ```ts
 * const response = await deleteTask('user_123', 'task_code_1')
 * console.log(response.data) // true
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /task/del
 * Headers: { userId: string }
 * Query: { code: string }
 *
 * 通过 Vite proxy 代理到: http://localhost:8901/task/del
 * 前端调用路径: /api/task/del (会被 proxy 转发)
 */
export async function deleteTask(
  userId: string,
  code: string
): Promise<{ code: number; msg: string; data: boolean }> {
  console.log('deleteTask', userId, code)
  try {
    const response = await get<{ code: number; msg: string; data: boolean }>('/api/task/del', {
      params: { code },
      headers: {
        userId,
      },
    })

    console.log('[ArenaApi] deleteTask response:', response)
    return response
  } catch (error) {
    console.error('[ArenaApi] deleteTask failed:', error)
    throw error
  }
}

/**
 * 重命名任务
 *
 * @param userId 用户ID
 * @param code 任务code
 * @param title 新标题
 * @returns 重命名结果
 *
 * @example
 * ```ts
 * const response = await renameTask('user_123', 'task_code_1', '新任务名称')
 * console.log(response.data) // true
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /task/rename
 * Headers: { userId: string }
 * Query: { code: string, title: string }
 *
 * 通过 Vite proxy 代理到: http://localhost:8901/task/rename
 * 前端调用路径: /api/task/rename (会被 proxy 转发)
 */
export async function renameTask(
  userId: string,
  code: string,
  title: string
): Promise<{ code: number; msg: string; data: boolean }> {
  console.log('renameTask', userId, code, title)
  try {
    const response = await get<{ code: number; msg: string; data: boolean }>('/api/task/rename', {
      params: { code, title },
      headers: {
        userId,
      },
    })

    console.log('[ArenaApi] renameTask response:', response)
    return response
  } catch (error) {
    console.error('[ArenaApi] renameTask failed:', error)
    throw error
  }
}

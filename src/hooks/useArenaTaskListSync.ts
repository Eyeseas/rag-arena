/**
 * useArenaTaskListSync - keep server task list in sync with store
 *
 * This hook owns the network calls; the zustand store only hydrates state.
 */

import { useCallback } from 'react'
import { message } from 'antd'
import { arenaApi } from '@/services/arena'
import { useArenaStore } from '@/stores/arena'

function getUserId(): string {
  return localStorage.getItem('userId') || 'default_user'
}

export interface UseArenaTaskListSyncReturn {
  fetchTaskList: (opts?: { force?: boolean }) => Promise<void>
}

export function useArenaTaskListSync(): UseArenaTaskListSyncReturn {
  const isTasksLoading = useArenaStore((s) => s.isTasksLoading)
  const hasFetchedTasks = useArenaStore((s) => s.hasFetchedTasks)
  const setTasksLoading = useArenaStore((s) => s.setTasksLoading)
  const setHasFetchedTasks = useArenaStore((s) => s.setHasFetchedTasks)
  const applyTaskListFromServer = useArenaStore((s) => s.applyTaskListFromServer)

  const fetchTaskList = useCallback(
    async (opts?: { force?: boolean }) => {
      const force = Boolean(opts?.force)
      if (isTasksLoading || (!force && hasFetchedTasks)) return

      setTasksLoading(true)
      try {
        const userId = getUserId()
        const response = await arenaApi.getTaskList(userId)
        if ((response.code === 200 || response.code === 0) && Array.isArray(response.data)) {
          applyTaskListFromServer(response.data)
          setHasFetchedTasks(true)
        } else {
          setHasFetchedTasks(true)
          message.error(response.msg || '任务列表获取失败')
        }
      } catch (error) {
        setHasFetchedTasks(true)
        message.error(error instanceof Error ? error.message : '任务列表获取失败')
      } finally {
        setTasksLoading(false)
      }
    },
    [
      applyTaskListFromServer,
      hasFetchedTasks,
      isTasksLoading,
      setHasFetchedTasks,
      setTasksLoading,
    ]
  )

  return { fetchTaskList }
}

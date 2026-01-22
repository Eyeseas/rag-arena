/**
 * useDeltaBuffer - SSE 增量缓冲区 Hook
 *
 * 用于批量处理 SSE 增量更新，通过 requestAnimationFrame 合并更新
 * 减少频繁的状态更新，提升性能
 */

import { useCallback, useRef } from 'react'

/**
 * Delta 缓冲区 Hook 返回值
 */
export interface UseDeltaBufferReturn {
  /** 添加增量内容到缓冲区 */
  addDelta: (id: string, delta: string) => void
  /** 强制立即刷新缓冲区 */
  flush: () => void
  /** 清空缓冲区 */
  clear: () => void
}

/**
 * 创建 SSE 增量缓冲区
 *
 * @param onFlush 刷新时的回调函数，接收 Map<id, accumulatedDelta>
 * @returns 缓冲区操作方法
 *
 * @example
 * ```tsx
 * function StreamComponent() {
 *   const { addDelta, flush } = useDeltaBuffer((buffer) => {
 *     for (const [answerId, delta] of buffer) {
 *       appendAnswerDelta(answerId, delta)
 *     }
 *   })
 *
 *   const handleSSE = (event) => {
 *     addDelta(event.answerId, event.delta)
 *   }
 *
 *   const handleDone = () => {
 *     flush() // 确保最后的内容被处理
 *   }
 * }
 * ```
 */
export function useDeltaBuffer(
  onFlush: (buffer: Map<string, string>) => void
): UseDeltaBufferReturn {
  const bufferRef = useRef<Map<string, string>>(new Map())
  const flushScheduledRef = useRef(false)

  const flush = useCallback(() => {
    flushScheduledRef.current = false
    if (bufferRef.current.size > 0) {
      onFlush(bufferRef.current)
      bufferRef.current = new Map()
    }
  }, [onFlush])

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) return
    flushScheduledRef.current = true
    requestAnimationFrame(flush)
  }, [flush])

  const addDelta = useCallback(
    (id: string, delta: string) => {
      const current = bufferRef.current.get(id) || ''
      bufferRef.current.set(id, current + delta)
      scheduleFlush()
    },
    [scheduleFlush]
  )

  const clear = useCallback(() => {
    bufferRef.current = new Map()
    flushScheduledRef.current = false
  }, [])

  return { addDelta, flush, clear }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeltaBuffer } from '@/hooks/useDeltaBuffer'

describe('useDeltaBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should buffer deltas and flush after interval', () => {
    const onFlush = vi.fn()
    const { result } = renderHook(() => useDeltaBuffer(onFlush))

    act(() => {
      result.current.addDelta('answer-1', 'hello ')
      result.current.addDelta('answer-1', 'world')
    })

    expect(onFlush).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(onFlush).toHaveBeenCalled()
  })

  it('should accumulate deltas for the same answer', () => {
    let flushedBuffer: Map<string, string> = new Map()
    const onFlush = vi.fn((buffer: Map<string, string>) => {
      flushedBuffer = new Map(buffer)
    })

    const { result } = renderHook(() => useDeltaBuffer(onFlush))

    act(() => {
      result.current.addDelta('a1', 'first ')
      result.current.addDelta('a1', 'second ')
      result.current.addDelta('a1', 'third')
    })

    act(() => {
      result.current.flush()
    })

    expect(flushedBuffer.get('a1')).toBe('first second third')
  })

  it('should handle multiple answer ids', () => {
    let flushedBuffer: Map<string, string> = new Map()
    const onFlush = vi.fn((buffer: Map<string, string>) => {
      flushedBuffer = new Map(buffer)
    })

    const { result } = renderHook(() => useDeltaBuffer(onFlush))

    act(() => {
      result.current.addDelta('a1', 'answer1')
      result.current.addDelta('a2', 'answer2')
    })

    act(() => {
      result.current.flush()
    })

    expect(flushedBuffer.get('a1')).toBe('answer1')
    expect(flushedBuffer.get('a2')).toBe('answer2')
  })

  it('should clear buffer', () => {
    const onFlush = vi.fn()
    const { result } = renderHook(() => useDeltaBuffer(onFlush))

    act(() => {
      result.current.addDelta('a1', 'content')
    })

    act(() => {
      result.current.clear()
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    if (onFlush.mock.calls.length > 0) {
      const calledBuffer = onFlush.mock.calls[onFlush.mock.calls.length - 1][0] as Map<string, string>
      expect(calledBuffer.get('a1') ?? '').toBe('')
    }
  })
})

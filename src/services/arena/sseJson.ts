import type { SseEventMessage } from '@/lib/sse'

export type JsonSseEventHandlers = Record<string, (data: unknown) => void>

/**
 * Parse `msg.data` as JSON and dispatch by `msg.event`.
 *
 * Intentionally tolerant: unknown events are ignored; JSON parse errors are logged.
 */
export function dispatchJsonSseEvent(msg: SseEventMessage, handlers: JsonSseEventHandlers): void {
  const handler = handlers[msg.event]
  if (!handler) return

  try {
    const data = JSON.parse(msg.data) as unknown
    handler(data)
  } catch (error) {
    console.error('[ArenaApi] Failed to parse SSE event:', error)
  }
}

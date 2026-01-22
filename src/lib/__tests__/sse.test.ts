import { describe, it, expect } from 'vitest'
import { readSseStream } from '@/lib/sse'

describe('SSE Utils', () => {
  describe('readSseStream', () => {
    it('should parse single SSE event', async () => {
      const events: Array<{ event: string; data: string }> = []
      const sseText = 'event: message\ndata: hello world\n\n'

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseText))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(1)
      expect(events[0].event).toBe('message')
      expect(events[0].data).toBe('hello world')
    })

    it('should parse multiple SSE events', async () => {
      const events: Array<{ event: string; data: string }> = []
      const sseText = 'event: start\ndata: begin\n\nevent: delta\ndata: chunk1\n\nevent: done\ndata: end\n\n'

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseText))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(3)
      expect(events[0]).toEqual({ event: 'start', data: 'begin' })
      expect(events[1]).toEqual({ event: 'delta', data: 'chunk1' })
      expect(events[2]).toEqual({ event: 'done', data: 'end' })
    })

    it('should handle chunked stream data', async () => {
      const events: Array<{ event: string; data: string }> = []
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('event: mes'))
          controller.enqueue(encoder.encode('sage\ndata: hel'))
          controller.enqueue(encoder.encode('lo\n\n'))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({ event: 'message', data: 'hello' })
    })

    it('should ignore comment lines starting with :', async () => {
      const events: Array<{ event: string; data: string }> = []
      const sseText = ':this is a comment\nevent: message\ndata: actual data\n\n'

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseText))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(1)
      expect(events[0].data).toBe('actual data')
    })

    it('should throw error for non-ok response', async () => {
      const response = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      })

      await expect(readSseStream(response, () => {})).rejects.toThrow()
    })

    it('should throw error for response without body', async () => {
      const response = new Response(null, { status: 200 })
      Object.defineProperty(response, 'body', { value: null })

      await expect(readSseStream(response, () => {})).rejects.toThrow('Response body is not readable')
    })

    it('should handle default event type as message', async () => {
      const events: Array<{ event: string; data: string }> = []
      const sseText = 'data: no event specified\n\n'

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseText))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(1)
      expect(events[0].event).toBe('message')
    })

    it('should handle multi-line data', async () => {
      const events: Array<{ event: string; data: string }> = []
      const sseText = 'event: message\ndata: line1\ndata: line2\n\n'

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseText))
          controller.close()
        },
      })

      const response = new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })

      await readSseStream(response, (msg) => {
        events.push(msg)
      })

      expect(events).toHaveLength(1)
      expect(events[0].data).toBe('line1\nline2')
    })
  })
})

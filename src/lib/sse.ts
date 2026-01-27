/**
 * SSE (Server-Sent Events) 流式读取工具
 */

export type SseEventMessage = {
  event: string
  data: string
}

function parseSseBlock(block: string): SseEventMessage | null {
  const lines = block.split('\n')
  let event = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message'
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }

  const data = dataLines.join('\n')
  if (!event && !data) return null
  return { event, data }
}

/**
 * 读取 SSE 流式响应
 * @param response fetch 响应对象
 * @param onMessage 消息回调函数
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/stream', {
 *   headers: { Accept: 'text/event-stream' }
 * })
 * await readSseStream(response, (msg) => {
 *   console.log(msg.event, msg.data)
 * })
 * ```
 */
export async function readSseStream(
  response: Response,
  onMessage: (msg: SseEventMessage) => void,
): Promise<void> {
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Response body is not readable')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')

    while (true) {
      const sepIndex = buffer.indexOf('\n\n')
      if (sepIndex === -1) break

      const rawBlock = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + 2)

      const msg = parseSseBlock(rawBlock)
      if (msg) onMessage(msg)
    }
  }
}

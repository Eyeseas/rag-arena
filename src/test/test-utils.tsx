import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhCN}>
      {children}
    </ConfigProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }

export function createMockAnswer(overrides: Partial<{
  id: string
  content: string
  providerId: string
  citations: Array<{ id: string; summary: string }>
  error?: string
}> = {}) {
  return {
    id: overrides.id ?? 'answer-1',
    content: overrides.content ?? '这是一个测试回答内容',
    providerId: overrides.providerId ?? 'A',
    citations: overrides.citations ?? [],
    error: overrides.error,
  }
}

export function createMockSession(overrides: Partial<{
  id: string
  taskId: string
  title: string
  question: string
  answers: ReturnType<typeof createMockAnswer>[]
  votedAnswerId: string | null
  createdAt: number
  updatedAt: number
}> = {}) {
  const now = Date.now()
  return {
    id: overrides.id ?? 'session-1',
    taskId: overrides.taskId ?? 'task-1',
    title: overrides.title ?? '测试会话',
    question: overrides.question ?? '测试问题',
    answers: overrides.answers ?? [],
    votedAnswerId: overrides.votedAnswerId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    serverQuestionId: null as string | null,
    serverSessionId: null as string | null,
    priIdMapping: undefined as Record<string, string> | undefined,
  }
}

export function createMockTask(overrides: Partial<{
  id: string
  title: string
  createdAt: number
  updatedAt: number
  expanded: boolean
}> = {}) {
  const now = Date.now()
  return {
    id: overrides.id ?? 'task-1',
    title: overrides.title ?? '测试任务',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    expanded: overrides.expanded ?? true,
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createMockSseResponse(events: Array<{ event: string; data: string }>) {
  const chunks = events.map(({ event, data }) => 
    `event: ${event}\ndata: ${data}\n\n`
  ).join('')
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(chunks))
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}

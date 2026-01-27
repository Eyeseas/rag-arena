import { useCallback, useEffect, useRef, useState } from 'react'
import type { FollowUpChatMessage } from '@/types/arenaUi'
import type { Answer } from '@/types/arena'
import { arenaApi } from '@/services/arena'
import { getUserId } from '@/lib/userId'

export interface UseAnswerFollowUpChatReturn {
  chatMessages: FollowUpChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  chatLoading: boolean
  hasAskedFollowUp: boolean

  handleSendMessage: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

interface UseAnswerFollowUpChatParams {
  answer: Answer
  taskId: string
  sessionId: string
  initialQuestion: string
}

export function useAnswerFollowUpChat({
  answer,
  taskId,
  sessionId,
  initialQuestion,
}: UseAnswerFollowUpChatParams): UseAnswerFollowUpChatReturn {
  const [chatMessages, setChatMessages] = useState<FollowUpChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const assistantMessageIdRef = useRef<string>('')

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || chatLoading || hasAskedFollowUp) return

    const content = chatInput.trim()
    const userMessage: FollowUpChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    setHasAskedFollowUp(true)

    assistantMessageIdRef.current = `assistant_${Date.now()}`
    const assistantMessage: FollowUpChatMessage = {
      id: assistantMessageIdRef.current,
      role: 'assistant',
      content: '',
    }
    setChatMessages((prev) => [...prev, assistantMessage])

    try {
      const userId = getUserId()
      const priId = answer.id

      await arenaApi.chatPrivate(
        userId,
        {
          taskId,
          priId,
          session_id: sessionId,
          messages: [
            { role: 'user', content: initialQuestion },
            { role: 'assistant', content: answer.content },
            { role: 'user', content },
          ],
        },
        {
          onDelta: (deltaContent: string) => {
            setChatLoading(false)
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageIdRef.current
                  ? { ...msg, content: msg.content + deltaContent }
                  : msg
              )
            )
          },
          onDone: () => {
            setChatLoading(false)
          },
          onError: (error: Error) => {
            console.error('[useAnswerFollowUpChat] Error:', error)
            setChatMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageIdRef.current
                  ? { ...msg, content: `错误：${error.message}` }
                  : msg
              )
            )
            setChatLoading(false)
          },
        }
      )
    } catch (error) {
      console.error('[useAnswerFollowUpChat] Failed to send message:', error)
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageIdRef.current
            ? { ...msg, content: `发送失败：${error instanceof Error ? error.message : '未知错误'}` }
            : msg
        )
      )
      setChatLoading(false)
    }
  }, [chatInput, chatLoading, hasAskedFollowUp, answer, taskId, sessionId, initialQuestion])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  return {
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    hasAskedFollowUp,
    handleSendMessage,
    handleKeyDown,
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface UseAnswerFollowUpChatReturn {
  chatMessages: ChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  chatLoading: boolean
  hasAskedFollowUp: boolean

  handleSendMessage: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

// 每个答案支持一次追问；目前为前端演示用的模拟对话逻辑。
export function useAnswerFollowUpChat(providerId: string): UseAnswerFollowUpChatReturn {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || chatLoading || hasAskedFollowUp) return

    const content = chatInput.trim()
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    setHasAskedFollowUp(true)

    // 模拟 AI 回复（实际应用中需要调用 API）
    timerRef.current = window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `这是模型 ${providerId} 对您追问「${content}」的回复。\n\n在实际应用中，这里会调用后端 API 获取该模型的真实回复。目前为演示效果。`,
      }
      setChatMessages((prev) => [...prev, assistantMessage])
      setChatLoading(false)
      timerRef.current = null
    }, 1500)
  }, [chatInput, chatLoading, hasAskedFollowUp, providerId])

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

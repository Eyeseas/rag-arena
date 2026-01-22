// AnswerCard - 单个回答卡片组件

import { useState, useRef, useEffect, memo } from 'react'
import { Card, Tag, Alert, Tooltip, Modal, Input, Button, Spin } from 'antd'
import {
  FileTextOutlined,
  DownOutlined,
  CheckCircleFilled,
  ExpandOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/themes/light.css'
import type { Answer, Citation } from '@/types/arena'
import { CitationCard } from './CitationCard'
import { CitationDetailDrawer } from './CitationDetailDrawer'
import { HoldToConfirmButton } from './HoldToConfirmButton'

/** 对话消息类型 */
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AnswerCardProps {
  /** 回答数据 */
  answer: Answer
  /** 是否已点赞此回答 */
  isVoted: boolean
  /** 是否禁用点赞 (已投票给其他答案) */
  disabled: boolean
  /** 点赞加载状态 */
  loading?: boolean
  /** 点赞回调 */
  onVote: () => void
  /** 是否模糊（其他卡片的投票按钮被悬浮时） */
  isBlurred?: boolean
  /** 投票按钮悬浮状态变化回调 */
  onVoteHover?: (isHovering: boolean) => void
}

// 供应商标识颜色和渐变映射
const providerConfig: Record<
  string,
  { color: string; gradient: string; bgGradient: string; lightBg: string }
> = {
  A: {
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    lightBg: 'bg-blue-50',
  },
  B: {
    color: 'green',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    lightBg: 'bg-emerald-50',
  },
  C: {
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 to-amber-50',
    lightBg: 'bg-orange-50',
  },
  D: {
    color: 'rose',
    gradient: 'from-rose-500 to-orange-500',
    bgGradient: 'from-rose-50 to-orange-50',
    lightBg: 'bg-rose-50',
  },
}

const defaultConfig = {
  color: 'default',
  gradient: 'from-slate-500 to-gray-500',
  bgGradient: 'from-slate-50 to-gray-50',
  lightBg: 'bg-slate-50',
}

export const AnswerCard = memo(function AnswerCard({
  answer,
  isVoted,
  disabled,
  loading = false,
  onVote,
  isBlurred = false,
  onVoteHover,
}: AnswerCardProps) {
  const config = providerConfig[answer.providerId] || defaultConfig
  const [citationsExpanded, setCitationsExpanded] = useState(true)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false) // 是否已追问过
  const [citationDrawerOpen, setCitationDrawerOpen] = useState(false)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const hasCitations = answer.citations && answer.citations.length > 0
  const hasError = Boolean(answer.error)
  const hasContent = answer.content.length > 0

  // 内容区域 ref，用于自动滚动
  const contentRef = useRef<HTMLDivElement>(null)
  const chatContentRef = useRef<HTMLDivElement>(null)

  // 流式渲染时自动滚动到底部
  useEffect(() => {
    if (contentRef.current && answer.content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [answer.content])

  // 对话区域自动滚动到底部
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
    }
  }, [chatMessages])

  // 打开全屏弹窗
  const handleOpenFullscreen = () => {
    setFullscreenOpen(true)
  }

  // 关闭全屏弹窗
  const handleCloseFullscreen = () => {
    setFullscreenOpen(false)
  }

  // 发送追问消息（模拟）- 只允许追问一次
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || hasAskedFollowUp) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
    }
    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    setHasAskedFollowUp(true) // 标记已追问

    // 模拟 AI 回复（实际应用中需要调用 API）
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `这是模型 ${answer.providerId} 对您追问「${userMessage.content}」的回复。\n\n在实际应用中，这里会调用后端 API 获取该模型的真实回复。目前为演示效果。`,
      }
      setChatMessages((prev) => [...prev, assistantMessage])
      setChatLoading(false)
    }, 1500)
  }

  // 处理回车键发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 处理引用卡片点击
  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation)
    setCitationDrawerOpen(true)
  }

  // 关闭引用详情抽屉
  const handleCloseCitationDrawer = () => {
    setCitationDrawerOpen(false)
    setSelectedCitation(null)
  }

  return (
    <Card
      className={`
        flex flex-col transition-all duration-300 !rounded-md overflow-hidden
        ${isVoted ? 'ring-2 ring-teal-500 shadow-xl shadow-teal-500/20 animate-vote-glow' : 'hover:shadow-lg'}
        ${!hasContent && !hasError ? 'animate-pulse-soft' : ''}
        ${isBlurred ? 'blur-[2px] opacity-60 scale-[0.98]' : ''}
      `}
      styles={{
        header: {
          background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
          borderBottom: 'none',
          padding: '16px 20px',
        },
        body: {
          padding: '16px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      title={
        <div className="flex items-center gap-3">
          {/* 模型标识 */}
          <div
            className={`
              w-10 h-10 rounded bg-gradient-to-br ${config.gradient}
              flex items-center justify-center shadow-md
              text-white font-bold text-lg
            `}
          >
            {answer.providerId}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-700 font-semibold">模型 {answer.providerId}</span>
            {hasCitations && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FileTextOutlined className="text-[10px]" />
                {answer.citations!.length} 个引用
              </span>
            )}
          </div>

          {/* 已投票标识 */}
          {isVoted && (
            <Tag
              icon={<CheckCircleFilled />}
              color="success"
              className="ml-auto !m-0 !rounded-full !px-3"
            >
              最佳回答
            </Tag>
          )}
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          <Tooltip title={isVoted ? '点击取消投票' : disabled ? '已投票给其他回答' : '长按投票'}>
            <div>
              <HoldToConfirmButton
                isConfirmed={isVoted}
                disabled={disabled}
                loading={loading}
                onConfirm={onVote}
                onHover={onVoteHover}
              />
            </div>
          </Tooltip>
          <Tooltip title="全屏查看">
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={handleOpenFullscreen}
              className="!w-9 !h-9 !rounded hover:!bg-slate-100 !text-slate-500 hover:!text-teal-500"
            />
          </Tooltip>
        </div>
      }
    >
      {/* 回答内容区域 */}
      <div ref={contentRef} className="flex-1 pr-1">
        {hasError && (
          <Alert
            type="error"
            showIcon
            message="生成失败"
            description={answer.error}
            className="mb-3 !rounded"
          />
        )}
        {!hasContent && !hasError && (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            正在生成回答...
          </div>
        )}
        {hasContent && (
          <XMarkdown className="x-markdown-light prose prose-slate prose-sm max-w-none" content={answer.content} />
        )}
      </div>

      {/* 引用摘要区域 */}
      {hasCitations && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          {/* 标题 */}
          <button
            onClick={() => setCitationsExpanded(!citationsExpanded)}
            className="flex items-center gap-2 w-full mb-2 text-left cursor-pointer hover:text-slate-900 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              参考来源
            </span>
            <span className="text-xs text-slate-500">
              ({answer.citations!.length})
            </span>
            <DownOutlined
              className={`text-xs text-slate-400 transition-transform duration-200 ${
                citationsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* 引用列表 */}
          {citationsExpanded && (
            <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
              {answer.citations!.map((citation, index) => (
                <CitationCard 
                  key={citation.id} 
                  citation={citation} 
                  index={index}
                  onClick={handleCitationClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 全屏弹窗 */}
      <Modal
        open={fullscreenOpen}
        onCancel={handleCloseFullscreen}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: 1200 }}
        styles={{
          body: { 
            height: 'calc(90vh - 55px)', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        title={
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient}
                flex items-center justify-center shadow-md
                text-white font-bold text-lg
              `}
            >
              {answer.providerId}
            </div>
            <div className="flex flex-col">
              <span className="text-slate-700 font-semibold">模型 {answer.providerId}</span>
              <span className="text-xs text-slate-500">全屏查看 · 支持追问</span>
            </div>
          </div>
        }
        destroyOnClose
      >
        {/* 弹窗内容区域 */}
        <div className="flex flex-col h-full">
          {/* 原始回答 + 对话历史区域 */}
          <div ref={chatContentRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 原始回答 */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`
                    w-8 h-8 rounded bg-gradient-to-br ${config.gradient}
                    flex items-center justify-center shadow-sm
                    text-white text-sm
                  `}
                >
                  <RobotOutlined />
                </div>
                <span className="text-sm font-medium text-slate-600">初始回答</span>
              </div>
              {hasError && (
                <Alert
                  type="error"
                  showIcon
                  message="生成失败"
                  description={answer.error}
                  className="mb-3 !rounded"
                />
              )}
              {hasContent && (
                <XMarkdown className="x-markdown-light prose prose-slate prose-sm max-w-none" content={answer.content} />
              )}
            </div>

            {/* 引用来源 */}
            {hasCitations && (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-700">参考来源</span>
                  <span className="text-xs text-slate-500">({answer.citations!.length})</span>
                </div>
                <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
                  {answer.citations!.map((citation, index) => (
                    <CitationCard 
                      key={citation.id} 
                      citation={citation} 
                      index={index}
                      onClick={handleCitationClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 对话历史 */}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-5 rounded-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 ml-12'
                    : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200 mr-12'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`
                      w-8 h-8 rounded flex items-center justify-center shadow-sm text-white text-sm
                      ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' : `bg-gradient-to-br ${config.gradient}`}
                    `}
                  >
                    {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    {msg.role === 'user' ? '您的追问' : `模型 ${answer.providerId} 回复`}
                  </span>
                </div>
                <XMarkdown className="x-markdown-light prose prose-slate prose-sm max-w-none" content={msg.content} />
              </div>
            ))}

            {/* 加载状态 */}
            {chatLoading && (
              <div className="flex items-center gap-3 p-5 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-100 mr-12">
                <Spin size="small" />
                <span className="text-slate-600 text-sm">模型 {answer.providerId} 正在思考...</span>
              </div>
            )}
          </div>

          {/* 底部对话输入区域 */}
          <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            {hasAskedFollowUp && !chatLoading ? (
              // 已追问后显示提示
              <div className="text-center py-3">
                <p className="text-slate-600 text-sm">
                  您已完成一次追问，每个模型仅支持追问一次
                </p>
              </div>
            ) : (
              // 未追问时显示输入框
              <>
                <div className="flex items-end gap-3">
                  <Input.TextArea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`继续向模型 ${answer.providerId} 提问...`}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="!rounded !border-slate-200 focus:!border-teal-400 !py-3 !px-4 !text-sm"
                    disabled={chatLoading}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={chatLoading}
                    disabled={!chatInput.trim()}
                    className="!h-11 !px-5 !rounded !bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 hover:!from-teal-600 hover:!to-emerald-600"
                  >
                    发送
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500 text-center">
                  按 Enter 发送，Shift + Enter 换行（仅可追问一次）
                </p>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* 引用详情抽屉 */}
      <CitationDetailDrawer
        open={citationDrawerOpen}
        citation={selectedCitation}
        onClose={handleCloseCitationDrawer}
      />
    </Card>
  )
})

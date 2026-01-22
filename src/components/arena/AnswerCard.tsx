// AnswerCard - 单个回答卡片组件

import { useEffect, useRef, useState, memo } from 'react'
import { Card, Tag, Alert, Tooltip, Button } from 'antd'
import {
  FileTextOutlined,
  CheckCircleFilled,
  ExpandOutlined,
} from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/themes/light.css'
import type { Answer, Citation } from '@/types/arena'
import { CitationDetailDrawer } from './CitationDetailDrawer'
import { HoldToConfirmButton } from './HoldToConfirmButton'
import { AnswerCardFullscreenModal } from './AnswerCardFullscreenModal'
import { AnswerCardCitations } from './AnswerCardCitations'
import { getProviderVisualConfig } from './AnswerCardProviderConfig'
import { useAnswerFollowUpChat } from '@/hooks/useAnswerFollowUpChat'

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

export const AnswerCard = memo(function AnswerCard({
  answer,
  isVoted,
  disabled,
  loading = false,
  onVote,
  isBlurred = false,
  onVoteHover,
}: AnswerCardProps) {
  const config = getProviderVisualConfig(answer.providerId)
  const [citationsExpanded, setCitationsExpanded] = useState(true)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [citationDrawerOpen, setCitationDrawerOpen] = useState(false)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const hasCitations = answer.citations && answer.citations.length > 0
  const hasError = Boolean(answer.error)
  const hasContent = answer.content.length > 0

  const {
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    hasAskedFollowUp,
    handleSendMessage,
    handleKeyDown,
  } = useAnswerFollowUpChat(answer.providerId)

  // 内容区域 ref，用于自动滚动
  const contentRef = useRef<HTMLDivElement>(null)

  // 流式渲染时自动滚动到底部
  useEffect(() => {
    if (contentRef.current && answer.content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [answer.content])

  // 打开全屏弹窗
  const handleOpenFullscreen = () => {
    setFullscreenOpen(true)
  }

  // 关闭全屏弹窗
  const handleCloseFullscreen = () => {
    setFullscreenOpen(false)
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
        <AnswerCardCitations
          citations={answer.citations!}
          expanded={citationsExpanded}
          onToggleExpanded={() => setCitationsExpanded(!citationsExpanded)}
          onCitationClick={handleCitationClick}
        />
      )}

      <AnswerCardFullscreenModal
        open={fullscreenOpen}
        onClose={handleCloseFullscreen}
        answer={answer}
        config={config}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        hasAskedFollowUp={hasAskedFollowUp}
        onSendMessage={handleSendMessage}
        onKeyDown={handleKeyDown}
        onCitationClick={handleCitationClick}
      />

      {/* 引用详情抽屉 */}
      <CitationDetailDrawer
        open={citationDrawerOpen}
        citation={selectedCitation}
        onClose={handleCloseCitationDrawer}
      />
    </Card>
  )
})

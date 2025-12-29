// AnswerCard - 单个回答卡片组件

import { useState, useRef, useEffect } from 'react'
import { Card, Button, Tag, Alert, Tooltip } from 'antd'
import {
  LikeOutlined,
  LikeFilled,
  FileTextOutlined,
  DownOutlined,
  CheckCircleFilled,
} from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/themes/light.css'
import type { Answer } from '@/types/arena'
import { CitationCard } from './CitationCard'

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
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    lightBg: 'bg-purple-50',
  },
}

const defaultConfig = {
  color: 'default',
  gradient: 'from-slate-500 to-gray-500',
  bgGradient: 'from-slate-50 to-gray-50',
  lightBg: 'bg-slate-50',
}

export function AnswerCard({
  answer,
  isVoted,
  disabled,
  loading = false,
  onVote,
}: AnswerCardProps) {
  const config = providerConfig[answer.providerId] || defaultConfig
  const [citationsExpanded, setCitationsExpanded] = useState(true)
  const hasCitations = answer.citations && answer.citations.length > 0
  const hasError = Boolean(answer.error)
  const hasContent = answer.content.length > 0

  // 内容区域 ref，用于自动滚动
  const contentRef = useRef<HTMLDivElement>(null)

  // 流式渲染时自动滚动到底部
  useEffect(() => {
    if (contentRef.current && answer.content) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [answer.content])

  return (
    <Card
      className={`
        h-full flex flex-col transition-all duration-300 !rounded-2xl overflow-hidden
        ${isVoted ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 animate-vote-glow' : 'hover:shadow-lg'}
        ${!hasContent && !hasError ? 'animate-pulse-soft' : ''}
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
              w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient}
              flex items-center justify-center shadow-md
              text-white font-bold text-lg
            `}
          >
            {answer.providerId}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-700 font-semibold">模型 {answer.providerId}</span>
            {hasCitations && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
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
        <Tooltip title={isVoted ? '取消投票' : disabled ? '已投票给其他回答' : '投票'}>
          <Button
            type={isVoted ? 'primary' : 'default'}
            icon={isVoted ? <LikeFilled /> : <LikeOutlined />}
            onClick={onVote}
            disabled={disabled && !isVoted}
            loading={loading}
            className={`
              !rounded-xl transition-all duration-300
              ${isVoted ? '!shadow-lg !shadow-indigo-500/25' : ''}
            `}
          >
            {isVoted ? '已投票' : '投票'}
          </Button>
        </Tooltip>
      }
    >
      {/* 回答内容区域 */}
      <div ref={contentRef} className="flex-1 overflow-auto max-h-80 pr-1">
        {hasError && (
          <Alert
            type="error"
            showIcon
            message="生成失败"
            description={answer.error}
            className="mb-3 !rounded-xl"
          />
        )}
        {!hasContent && !hasError && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            正在生成回答...
          </div>
        )}
        {hasContent && (
          <XMarkdown className="x-markdown-light prose prose-slate prose-sm max-w-none" content={answer.content} />
        )}
      </div>

      {/* 引用摘要区域 */}
      {hasCitations && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* 展开/收起按钮 */}
          <button
            onClick={() => setCitationsExpanded(!citationsExpanded)}
            className={`
              flex items-center gap-3 w-full px-4 py-3 rounded-xl
              bg-gradient-to-r ${config.bgGradient}
              hover:shadow-md
              border border-slate-100 hover:border-slate-200
              transition-all duration-300 group
            `}
          >
            {/* 图标容器 */}
            <div
              className={`
                w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient}
                flex items-center justify-center shadow-sm
                group-hover:shadow-md group-hover:scale-105 transition-all duration-300
              `}
            >
              <FileTextOutlined className="text-white text-sm" />
            </div>

            {/* 文字 */}
            <div className="flex-1 text-left">
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                参考来源
              </span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/80 text-slate-600 text-xs font-bold shadow-sm">
                {answer.citations!.length}
              </span>
            </div>

            {/* 展开/收起图标 */}
            <div
              className={`
                w-7 h-7 rounded-full bg-white shadow-sm
                flex items-center justify-center
                text-slate-400 group-hover:text-slate-600
                transition-all duration-300
                ${citationsExpanded ? 'rotate-180' : 'rotate-0'}
              `}
            >
              <DownOutlined className="text-xs" />
            </div>
          </button>

          {/* 引用列表 - 带动画 */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-out
              ${citationsExpanded ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
            `}
          >
            <div className="space-y-3 max-h-80 overflow-auto pr-1">
              {answer.citations!.map((citation, index) => (
                <CitationCard key={citation.id} citation={citation} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// AnswerGrid - 回答网格布局组件

import { useState, memo } from 'react'
import { Row, Col, Tabs, Tag, Skeleton, Card } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { AnswerCard } from './AnswerCard'
import type { Answer } from '@/types/arena'
import type { LayoutMode } from './LayoutSwitcher'

interface AnswerGridProps {
  /** 回答列表 */
  answers: Answer[]
  /** 已点赞的回答 ID */
  votedAnswerId: string | null
  /** 点赞加载状态 */
  votingAnswerId: string | null
  /** 点赞回调 */
  onVote: (answerId: string) => void
  /** 布局模式 */
  layoutMode?: LayoutMode
  /** 禁用投票（如流式生成中） */
  disableVoting?: boolean
}

// 供应商标识颜色映射
const providerColors: Record<string, string> = {
  A: 'blue',
  B: 'green',
  C: 'orange',
  D: 'magenta',
}

// 根据布局模式获取列宽配置
function getColSpan(mode: LayoutMode) {
  switch (mode) {
    case 'four-col':
      return { xs: 24, sm: 12, lg: 6 }
    case 'two-col':
      return { xs: 24, md: 12 }
    case 'one-col':
      return { xs: 24 }
    default:
      return { xs: 24, md: 12 }
  }
}

export const AnswerGrid = memo(function AnswerGrid({
  answers,
  votedAnswerId,
  votingAnswerId,
  onVote,
  layoutMode = 'two-col',
  disableVoting = false,
}: AnswerGridProps) {
  // 当前悬浮在投票按钮上的回答 ID
  const [hoveredAnswerId, setHoveredAnswerId] = useState<string | null>(null)

  if (answers.length === 0) {
    return null
  }

  // Tabs 布局模式
  if (layoutMode === 'tabs') {
    return (
      <div className="w-full">
        <Tabs
          type="card"
          className="answer-tabs"
          items={answers.map((answer) => ({
            key: answer.id,
            label: (
              <span className="flex items-center gap-2">
                <Tag color={providerColors[answer.providerId]} className="!m-0 !rounded-full">
                  {answer.providerId}
                </Tag>
                模型 {answer.providerId}
                {votedAnswerId === answer.id && (
                  <span className="text-emerald-500 ml-1">✓</span>
                )}
              </span>
            ),
            children: (
              <AnswerCard
                answer={answer}
                isVoted={votedAnswerId === answer.id}
                disabled={disableVoting || (votedAnswerId !== null && votedAnswerId !== answer.id)}
                loading={votingAnswerId === answer.id}
                onVote={() => onVote(answer.id)}
                isBlurred={hoveredAnswerId !== null && hoveredAnswerId !== answer.id}
                onVoteHover={(isHovering) => setHoveredAnswerId(isHovering ? answer.id : null)}
              />
            ),
          }))}
        />
      </div>
    )
  }

  // Grid 布局模式 (four-col / two-col / one-col)
  const colSpan = getColSpan(layoutMode)

  return (
    <div className="w-full">
      <Row gutter={[20, 20]}>
        {answers.map((answer, index) => (
          <Col
            key={answer.id}
            {...colSpan}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <AnswerCard
              answer={answer}
              isVoted={votedAnswerId === answer.id}
              disabled={disableVoting || (votedAnswerId !== null && votedAnswerId !== answer.id)}
              loading={votingAnswerId === answer.id}
              onVote={() => onVote(answer.id)}
              isBlurred={hoveredAnswerId !== null && hoveredAnswerId !== answer.id}
              onVoteHover={(isHovering) => setHoveredAnswerId(isHovering ? answer.id : null)}
            />
          </Col>
        ))}
      </Row>
    </div>
  )
})

interface AnswerGridSkeletonProps {
  /** 是否显示 */
  visible: boolean
  /** 显示多少个骨架卡片 */
  count?: number
}

// 骨架卡片组件
function SkeletonCard({ index }: { index: number }) {
  const colors = ['blue', 'green', 'orange', 'magenta']
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-orange-500',
  ]
  const labels = ['A', 'B', 'C', 'D']

  return (
    <Card
      className="!rounded-md overflow-hidden animate-pulse-soft"
      styles={{
        header: {
          borderBottom: 'none',
          padding: '16px 20px',
        },
        body: {
          padding: '16px 20px',
        },
      }}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded bg-gradient-to-br ${gradients[index % 4]}
              flex items-center justify-center shadow-md
              text-white font-bold text-lg
            `}
          >
            {labels[index % 4]}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-700 font-semibold">模型 {labels[index % 4]}</span>
            <span className="text-xs text-slate-500">正在生成回答...</span>
          </div>
        </div>
      }
      extra={
        <Tag color={colors[index % 4]} className="!rounded-full animate-pulse">
          生成中
        </Tag>
      }
    >
      <div className="space-y-3">
        <Skeleton.Input active block style={{ height: 16 }} />
        <Skeleton.Input active block style={{ height: 16, width: '90%' }} />
        <Skeleton.Input active block style={{ height: 16, width: '75%' }} />
        <div className="h-4" />
        <Skeleton.Input active block style={{ height: 16, width: '85%' }} />
        <Skeleton.Input active block style={{ height: 16, width: '60%' }} />
      </div>
    </Card>
  )
}

export function AnswerGridSkeleton({ visible, count = 4 }: AnswerGridSkeletonProps) {
  if (!visible) return null

  return (
    <div className="w-full">
      {/* 顶部提示 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
          <RobotOutlined className="text-teal-500 text-lg animate-pulse" />
          <span className="text-slate-600 font-medium">多个 AI 模型正在思考您的问题...</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>

      {/* 骨架卡片网格 */}
      <Row gutter={[20, 20]}>
        {Array.from({ length: count }).map((_, index) => (
          <Col
            key={index}
            xs={24}
            md={12}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <SkeletonCard index={index} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

// AnswerGrid - 回答网格布局组件

import { useState, memo } from 'react'
import { Row, Col, Tabs, Tag } from 'antd'
import { AnswerCard } from './AnswerCard'
import type { Answer } from '@/types/arena'
import type { LayoutMode } from './LayoutSwitcher'

export { AnswerGridSkeleton } from './AnswerGridSkeleton'

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

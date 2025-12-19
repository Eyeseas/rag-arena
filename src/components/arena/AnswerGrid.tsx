// AnswerGrid - 回答网格布局组件

import { Row, Col, Spin } from 'antd'
import { AnswerCard } from './AnswerCard'
import type { Answer } from '@/types/arena'

interface AnswerGridProps {
  /** 回答列表 */
  answers: Answer[]
  /** 已点赞的回答 ID */
  votedAnswerId: string | null
  /** 点赞加载状态 */
  votingAnswerId: string | null
  /** 点赞回调 */
  onVote: (answerId: string) => void
}

export function AnswerGrid({
  answers,
  votedAnswerId,
  votingAnswerId,
  onVote,
}: AnswerGridProps) {
  if (answers.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <Row gutter={[16, 16]}>
        {answers.map((answer) => (
          <Col key={answer.id} xs={24} md={12}>
            <AnswerCard
              answer={answer}
              isVoted={votedAnswerId === answer.id}
              disabled={votedAnswerId !== null && votedAnswerId !== answer.id}
              loading={votingAnswerId === answer.id}
              onVote={() => onVote(answer.id)}
            />
          </Col>
        ))}
      </Row>
    </div>
  )
}

interface AnswerGridSkeletonProps {
  /** 是否显示 */
  visible: boolean
}

export function AnswerGridSkeleton({ visible }: AnswerGridSkeletonProps) {
  if (!visible) return null

  return (
    <div className="w-full flex items-center justify-center py-20">
      <Spin size="large" tip="正在获取回答..." />
    </div>
  )
}

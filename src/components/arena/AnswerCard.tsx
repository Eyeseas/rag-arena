// AnswerCard - 单个回答卡片组件

import { Card, Button, Tag } from 'antd'
import { LikeOutlined, LikeFilled } from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/themes/light.css'
import type { Answer } from '@/types/arena'

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

// 供应商标识颜色映射
const providerColors: Record<string, string> = {
  A: 'blue',
  B: 'green',
  C: 'orange',
  D: 'purple',
}

export function AnswerCard({
  answer,
  isVoted,
  disabled,
  loading = false,
  onVote,
}: AnswerCardProps) {
  const color = providerColors[answer.providerId] || 'default'

  return (
    <Card
      className={`h-full flex flex-col transition-all ${
        isVoted ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      title={
        <div className="flex items-center gap-2">
          <Tag color={color} className="text-base px-3 py-1">
            模型 {answer.providerId}
          </Tag>
        </div>
      }
      extra={
        <Button
          type={isVoted ? 'primary' : 'default'}
          icon={isVoted ? <LikeFilled /> : <LikeOutlined />}
          onClick={onVote}
          disabled={disabled && !isVoted}
          loading={loading}
          size="small"
        >
          {isVoted ? '已点赞' : '点赞'}
        </Button>
      }
    >
      <div className="flex-1 overflow-auto max-h-80">
        <XMarkdown className="x-markdown-light" content={answer.content} />
      </div>
    </Card>
  )
}

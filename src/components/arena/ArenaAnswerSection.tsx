/**
 * ArenaAnswerSection - 回答区域组件
 *
 * 包含当前问题展示、布局切换、回答网格和投票提示
 */

import { Button, Badge, Tag } from 'antd'
import { FileTextOutlined, StarFilled } from '@ant-design/icons'
import {
  AnswerGrid,
  AnswerGridSkeleton,
  LayoutSwitcher,
  type LayoutMode,
} from '@/components/arena'
import type { Answer } from '@/types/arena'

interface ArenaAnswerSectionProps {
  /** 当前问题 */
  question: string
  /** 回答列表 */
  answers: Answer[]
  /** 已投票的回答 ID */
  votedAnswerId: string | null
  /** 正在投票的回答 ID */
  votingAnswerId: string | null
  /** 引用总数 */
  citationsCount: number
  /** 是否加载中 */
  isLoading: boolean
  /** 是否有回答 */
  hasAnswers: boolean
  /** 布局模式 */
  layoutMode: LayoutMode
  /** 布局模式变更回调 */
  onLayoutModeChange: (mode: LayoutMode) => void
  /** 投票回调 */
  onVote: (answerId: string) => void
  /** 打开引用面板回调 */
  onOpenSources: () => void
  /** 任务ID */
  taskId?: string
  /** 会话ID */
  sessionId?: string
}

/**
 * 回答区域组件
 */
export function ArenaAnswerSection({
  question,
  answers,
  votedAnswerId,
  votingAnswerId,
  citationsCount,
  isLoading,
  hasAnswers,
  layoutMode,
  onLayoutModeChange,
  onVote,
  onOpenSources,
  taskId = '',
  sessionId = '',
}: ArenaAnswerSectionProps) {
  return (
    <div className="flex-1 w-full animate-fade-in">
      {/* 当前问题展示 + 布局切换 */}
      {question && hasAnswers && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 glass-card rounded-2xl p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tag color="blue" className="!m-0">
                当前问题
              </Tag>
              {votedAnswerId && (
                <Tag color="green" icon={<StarFilled />} className="!m-0">
                  已投票
                </Tag>
              )}
            </div>
            <span className="text-slate-700 line-clamp-2">{question}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            {citationsCount > 0 && (
              <Badge count={citationsCount} size="small" color="#14b8a6">
                <Button
                  icon={<FileTextOutlined />}
                  onClick={onOpenSources}
                  className="!rounded-xl"
                >
                  引用面板
                </Button>
              </Badge>
            )}
            <LayoutSwitcher value={layoutMode} onChange={onLayoutModeChange} />
          </div>
        </div>
      )}

      {/* 加载状态 */}
      <AnswerGridSkeleton visible={isLoading && !hasAnswers} />

      {/* 回答网格 */}
      {hasAnswers && (
        <AnswerGrid
          answers={answers}
          votedAnswerId={votedAnswerId}
          votingAnswerId={votingAnswerId}
          onVote={onVote}
          layoutMode={layoutMode}
          disableVoting={isLoading}
          taskId={taskId}
          sessionId={sessionId}
          initialQuestion={question}
        />
      )}

      {/* AI 生成内容免责提示 */}
      {hasAnswers && !isLoading && (
        <div className="text-center mt-4 py-2">
          <p className="text-xs text-slate-400">
            ⚠️ 以上内容均由 AI 模型生成，可能存在错误或不准确之处，请自行核实相关数据和信息
          </p>
        </div>
      )}

      {/* 投票提示 */}
      {hasAnswers && !votedAnswerId && !isLoading && (
        <div className="text-center mt-8 py-4 glass rounded-2xl">
          <span className="text-slate-600">
            <StarFilled className="text-amber-400 mr-2" />
            阅读各模型回答后，请为您认为最佳的答案投票
          </span>
        </div>
      )}
    </div>
  )
}

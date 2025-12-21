// Arena Page - RAG 问答竞技场首页

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Typography, message, Alert } from 'antd'
import { TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons'
import {
  QuestionInput,
  AnswerGrid,
  AnswerGridSkeleton,
  LayoutSwitcher,
  type LayoutMode,
  type DateRange,
} from '@/components/arena'
import { useArenaStore } from '@/stores/arena'
import { arenaApi } from '@/services/arena'

const { Title, Text } = Typography

export const Route = createFileRoute('/')({
  component: ArenaPage,
})

function ArenaPage() {
  const {
    question,
    questionId,
    answers,
    isLoading,
    votedAnswerId,
    setQuestion,
    setQuestionId,
    setAnswers,
    setLoading,
    setVotedAnswerId,
    reset,
  } = useArenaStore()

  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('two-col')

  // 提交问题
  const handleSubmit = async (q: string, dateRange?: DateRange) => {
    setQuestion(q)
    setLoading(true)

    try {
      const response = await arenaApi.submitQuestion(q, dateRange)
      setQuestionId(response.questionId)
      setAnswers(response.answers)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取回答失败，请重试')
      reset()
    } finally {
      setLoading(false)
    }
  }

  // 点赞
  const handleVote = async (answerId: string) => {
    if (!questionId) return

    // 如果点击已点赞的回答，取消点赞
    if (votedAnswerId === answerId) {
      setVotedAnswerId(null)
      return
    }

    setVotingAnswerId(answerId)

    try {
      await arenaApi.submitVote({ questionId, answerId })
      setVotedAnswerId(answerId)
      message.success('点赞成功！')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '点赞失败，请重试')
    } finally {
      setVotingAnswerId(null)
    }
  }

  // 重新提问
  const handleReset = () => {
    reset()
  }

  const hasAnswers = answers.length > 0
  const isActive = hasAnswers || isLoading

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* 标题和输入区域 */}
      <div
        className={`w-full max-w-4xl mx-auto ${
          isActive ? 'pt-0' : 'flex-1 flex flex-col justify-center'
        }`}
      >
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <Title
            level={isActive ? 3 : 1}
            className="flex items-center justify-center gap-3 !mb-3"
          >
            <TrophyOutlined className="text-yellow-500" />
            RAG 问答竞技场
          </Title>

          {!isActive && (
            <Text type="secondary" className="text-base">
              <ThunderboltOutlined className="mr-2 text-amber-500" />
              提出问题，对比 4 个 AI 模型的回答，为最佳答案点赞
            </Text>
          )}
        </div>

        {/* 问题输入区域 */}
        <div className="mb-8">
          <QuestionInput
            loading={isLoading}
            disabled={hasAnswers}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
        </div>
      </div>

      {/* 回答区域 */}
      {isActive && (
        <div className="flex-1 w-full max-w-7xl mx-auto">
          {/* 当前问题展示 + 布局切换 */}
          {question && hasAnswers && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <Alert
                message="当前问题"
                description={question}
                type="info"
                showIcon
                className="flex-1 w-full sm:w-auto"
              />
              <div className="flex-shrink-0">
                <LayoutSwitcher value={layoutMode} onChange={setLayoutMode} />
              </div>
            </div>
          )}

          {/* 加载状态 */}
          <AnswerGridSkeleton visible={isLoading} />

          {/* 回答网格 */}
          {!isLoading && (
            <AnswerGrid
              answers={answers}
              votedAnswerId={votedAnswerId}
              votingAnswerId={votingAnswerId}
              onVote={handleVote}
              layoutMode={layoutMode}
            />
          )}

          {/* 投票提示 */}
          {hasAnswers && !votedAnswerId && !isLoading && (
            <div className="text-center mt-6">
              <Text type="secondary">
                请为您认为最好的回答点赞 👆
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

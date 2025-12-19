// Arena Page - RAG 问答竞技场首页

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Typography, message, Alert } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { QuestionInput, AnswerGrid, AnswerGridSkeleton } from '@/components/arena'
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

  // 提交问题
  const handleSubmit = async (q: string) => {
    setQuestion(q)
    setLoading(true)

    try {
      const response = await arenaApi.submitQuestion(q)
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center gap-3 !mb-2">
          <TrophyOutlined className="text-yellow-500" />
          RAG 问答竞技场
        </Title>
        <Text type="secondary">
          提出问题，对比 4 个 AI 模型的回答，为最佳答案点赞
        </Text>
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

      {/* 当前问题展示 */}
      {question && hasAnswers && (
        <Alert
          message="当前问题"
          description={question}
          type="info"
          showIcon
          className="mb-6"
        />
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
  )
}

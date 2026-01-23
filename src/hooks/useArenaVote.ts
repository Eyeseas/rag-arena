/**
 * useArenaVote - 投票与反馈流程 Hook
 *
 * 封装投票、反馈提交等逻辑
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import { selectAnswerById } from '@/stores/arenaSelectors'
import { arenaApi } from '@/services/arena'
import type { VoteFeedbackData } from '@/types/arena'
import { useArenaSession } from './useArenaSession'

/**
 * 投票流程 Hook 返回值
 */
export interface UseArenaVoteReturn {
  /** 正在投票的回答 ID */
  votingAnswerId: string | null
  /** 反馈弹窗是否打开 */
  feedbackModalOpen: boolean
  /** 正在反馈的回答 ID */
  feedbackAnswerId: string | null
  /** 正在反馈的供应商 ID */
  feedbackProviderId: string
  /** 提交投票 */
  handleVote: (answerId: string) => Promise<void>
  /** 提交反馈 */
  handleSubmitFeedback: (feedbackData: VoteFeedbackData) => Promise<void>
  /** 关闭反馈弹窗 */
  closeFeedbackModal: () => void
}

/**
 * 投票与反馈流程 Hook
 *
 * @returns 投票流程相关方法和状态
 *
 * @example
 * ```tsx
 * function VoteButtons() {
 *   const {
 *     votingAnswerId,
 *     feedbackModalOpen,
 *     handleVote,
 *     handleSubmitFeedback,
 *     closeFeedbackModal,
 *   } = useArenaVote()
 *
 *   return (
 *     <>
 *       {answers.map((answer) => (
 *         <button
 *           key={answer.id}
 *           onClick={() => handleVote(answer.id)}
 *           disabled={votingAnswerId === answer.id}
 *         >
 *           投票
 *         </button>
 *       ))}
 *       <VoteFeedbackModal
 *         open={feedbackModalOpen}
 *         onClose={closeFeedbackModal}
 *         onSubmit={handleSubmitFeedback}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
export function useArenaVote(): UseArenaVoteReturn {
  const { setVotedAnswerId } = useArenaStore()
  const { questionId, answers, votedAnswerId, isLoading } = useArenaSession()

  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackAnswerId, setFeedbackAnswerId] = useState<string | null>(null)
  const [feedbackProviderId, setFeedbackProviderId] = useState<string>('')

  const handleVote = useCallback(
    async (answerId: string) => {
      if (isLoading) return
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
        message.success('投票成功！')

        // 找到对应的回答，获取 providerId，打开反馈弹窗
        const answer = selectAnswerById(answers, answerId)
        if (answer) {
          setFeedbackAnswerId(answerId)
          setFeedbackProviderId(answer.providerId)
          setFeedbackModalOpen(true)
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : '投票失败，请重试')
      } finally {
        setVotingAnswerId(null)
      }
    },
    [isLoading, questionId, votedAnswerId, answers, setVotedAnswerId]
  )

  const handleSubmitFeedback = useCallback(
    async (feedbackData: VoteFeedbackData) => {
      if (!questionId || !feedbackAnswerId) return

      // 合并所有反馈原因
      const reasons = [...feedbackData.answerIssues, ...feedbackData.citationIssues]

      try {
        await arenaApi.submitVoteFeedback({
          questionId,
          answerId: feedbackAnswerId,
          reasons,
        })
        message.success('反馈提交成功！')
      } catch (error) {
        message.error(error instanceof Error ? error.message : '反馈提交失败，请重试')
        throw error
      }
    },
    [questionId, feedbackAnswerId]
  )

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModalOpen(false)
    setFeedbackAnswerId(null)
    setFeedbackProviderId('')
  }, [])

  return {
    votingAnswerId,
    feedbackModalOpen,
    feedbackAnswerId,
    feedbackProviderId,
    handleVote,
    handleSubmitFeedback,
    closeFeedbackModal,
  }
}

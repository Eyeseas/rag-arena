/**
 * useArenaVote - 投票与评分流程 Hook
 *
 * 封装投票、评分提交等逻辑
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import { selectAnswerById } from '@/stores/arenaSelectors'
import { arenaApi } from '@/services/arena'
import type { RatingData } from '@/types/arena'
import { useArenaSession } from './useArenaSession'

/**
 * 投票流程 Hook 返回值
 */
export interface UseArenaVoteReturn {
  /** 正在投票的回答 ID */
  votingAnswerId: string | null
  /** 评分弹窗是否打开 */
  ratingModalOpen: boolean
  /** 正在评分的回答 ID */
  ratingAnswerId: string | null
  /** 正在评分的供应商 ID */
  ratingProviderId: string
  /** 提交投票 */
  handleVote: (answerId: string) => Promise<void>
  /** 提交评分 */
  handleSubmitRating: (ratingData: RatingData) => Promise<void>
  /** 关闭评分弹窗 */
  closeRatingModal: () => void
}

/**
 * 投票与评分流程 Hook
 *
 * @returns 投票流程相关方法和状态
 *
 * @example
 * ```tsx
 * function VoteButtons() {
 *   const {
 *     votingAnswerId,
 *     ratingModalOpen,
 *     handleVote,
 *     handleSubmitRating,
 *     closeRatingModal,
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
 *       <RatingModal
 *         open={ratingModalOpen}
 *         onClose={closeRatingModal}
 *         onSubmit={handleSubmitRating}
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
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [ratingAnswerId, setRatingAnswerId] = useState<string | null>(null)
  const [ratingProviderId, setRatingProviderId] = useState<string>('')

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

        // 找到对应的回答，获取 providerId
        const answer = selectAnswerById(answers, answerId)
        if (answer) {
          setRatingAnswerId(answerId)
          setRatingProviderId(answer.providerId)
          setRatingModalOpen(true)
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : '投票失败，请重试')
      } finally {
        setVotingAnswerId(null)
      }
    },
    [isLoading, questionId, votedAnswerId, answers, setVotedAnswerId]
  )

  const handleSubmitRating = useCallback(
    async (ratingData: RatingData) => {
      if (!questionId || !ratingAnswerId) return

      try {
        await arenaApi.submitRating({
          questionId,
          answerId: ratingAnswerId,
          rating: ratingData,
        })
        message.success('评分提交成功！')
      } catch (error) {
        message.error(error instanceof Error ? error.message : '评分提交失败，请重试')
        throw error
      }
    },
    [questionId, ratingAnswerId]
  )

  const closeRatingModal = useCallback(() => {
    setRatingModalOpen(false)
    setRatingAnswerId(null)
    setRatingProviderId('')
  }, [])

  return {
    votingAnswerId,
    ratingModalOpen,
    ratingAnswerId,
    ratingProviderId,
    handleVote,
    handleSubmitRating,
    closeRatingModal,
  }
}

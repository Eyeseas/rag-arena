/**
 * useArenaVote - 投票与反馈流程 Hook
 *
 * 封装投票、反馈提交等逻辑
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { useArenaStore } from '@/stores/arena'
import { selectAnswerById } from '@/stores/arenaSelectors'
import { arenaApi, maskCodeToProviderId } from '@/services/arena'
import type { VoteFeedbackData } from '@/types/arena'
import { useArenaSession } from './useArenaSession'
import { getUserId } from './arenaQuestion/userId'

const providerIdToMaskCode: Record<string, string> = Object.fromEntries(
  Object.entries(maskCodeToProviderId).map(([k, v]) => [v, k])
)

const feedbackReasonLabels: Record<string, string> = {
  SLOW_RESPONSE: '响应速度太慢',
  IRRELEVANT_DIALOGUE: '存在无关话单',
  HALLUCINATION: '存在编造内容',
  CITATION_SUMMARY_INACCURATE: '摘要不够准确',
  KEY_CONTENT_LOCATE_INACCURATE: '关键内容定位不够准确',
}

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
  const { answers, votedAnswerId, isLoading, activeSession } = useArenaSession()

  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackAnswerId, setFeedbackAnswerId] = useState<string | null>(null)
  const [feedbackProviderId, setFeedbackProviderId] = useState<string>('')

  const handleVote = useCallback(
    async (answerId: string) => {
      if (isLoading) return
      if (votedAnswerId) return

      const answer = selectAnswerById(answers, answerId)
      if (!answer) return

      const maskCode = providerIdToMaskCode[answer.providerId]
      const priIdMapping = activeSession?.priIdMapping
      const priId = priIdMapping?.[maskCode]

      if (!priId) {
        message.error('投票信息不完整，请刷新页面重试')
        return
      }

      setVotingAnswerId(answerId)

      try {
        const userId = getUserId()
        await arenaApi.submitVote({ priId }, userId)
        setVotedAnswerId(answerId)
        message.success('投票成功！')

        setFeedbackAnswerId(answerId)
        setFeedbackProviderId(answer.providerId)
        setFeedbackModalOpen(true)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '投票失败，请重试')
      } finally {
        setVotingAnswerId(null)
      }
    },
    [isLoading, votedAnswerId, answers, activeSession, setVotedAnswerId]
  )

  const handleSubmitFeedback = useCallback(
    async (feedbackData: VoteFeedbackData) => {
      if (!feedbackAnswerId) return

      const answer = selectAnswerById(answers, feedbackAnswerId)
      if (!answer) return

      const maskCode = providerIdToMaskCode[answer.providerId]
      const priIdMapping = activeSession?.priIdMapping
      const priId = priIdMapping?.[maskCode]

      if (!priId) {
        message.error('反馈信息不完整，请刷新页面重试')
        return
      }

      const comments = [...feedbackData.answerIssues, ...feedbackData.citationIssues]
        .map(reason => feedbackReasonLabels[reason] || reason)

      try {
        const response = await arenaApi.submitFeedback(priId, comments)
        if (response.code === 0 || response.code === 200) {
          message.success('反馈提交成功！')
        } else {
          message.error(response.msg || '反馈提交失败')
          throw new Error(response.msg)
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : '反馈提交失败，请重试')
        throw error
      }
    },
    [feedbackAnswerId, answers, activeSession]
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

/**
 * @file 问答管理 Slice
 * @description 处理问题提交、回答接收和投票等核心业务逻辑
 *
 * 这是 Arena 的核心 slice，负责：
 * - 使用问题开始/更新会话
 * - 管理回答的流式接收和更新
 * - 处理投票状态
 * - 错误处理
 */

import type { StateCreator } from 'zustand'
import type { Answer } from '@/types/arena'
import type { ArenaAnswerSlice, ArenaState } from '../arenaStoreTypes'
import { createEmptySession, toSessionTitle } from '../arenaHelpers'
import { touchTask, updateActiveSession } from './internalHelpers'
import { truncateStreamContent, isStreamTruncated } from '@/lib/streamTruncate'

/**
 * 创建问答管理 Slice
 *
 * @param set - Zustand set 函数
 * @param get - Zustand get 函数
 * @returns Answer slice 的 action 实现
 */
export const createAnswerSlice: StateCreator<ArenaState, [], [], ArenaAnswerSlice> = (set, get) => {
  return {
    // ========== 问答管理 Actions ==========

    /**
     * 使用问题开始会话
     * - 如果当前会话已有内容（问题/回答/投票），创建新会话
     * - 否则更新当前会话的问题
     *
     * @param question - 用户问题
     * @returns 会话 ID（新创建或当前会话）
     */
    startSessionWithQuestion: async (question) => {
      const { activeTaskId, activeSessionId, sessions } = get()
      const active = sessions.find((s) => s.id === activeSessionId)
      const safeQuestion = question.trim()

      // 判断是否需要创建新会话
      const shouldCreateNew =
        !active ||
        active.question.trim().length > 0 ||
        active.answers.length > 0 ||
        active.votedAnswerId

      if (shouldCreateNew) {
        // 创建新的本地会话（不调用接口，等待发送问题时再创建）
        const newSession = createEmptySession(activeTaskId, {
          question: safeQuestion,
        })
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
        }))
        touchTask(set, activeTaskId)
        return newSession.id
      }

      // 更新当前会话的问题（保留 priIdMapping）
      updateActiveSession(set, get, (s) => ({
        ...s,
        question: safeQuestion,
        title: toSessionTitle(safeQuestion),
        updatedAt: Date.now(),
        serverQuestionId: null,
        answers: [],
        votedAnswerId: null,
        priIdMapping: s.priIdMapping,
      }))
      touchTask(set, activeTaskId)
      return activeSessionId
    },

    /**
     * 设置服务端返回的问题 ID
     * 在发送问题到服务端后调用
     *
     * @param questionId - 服务端问题 ID 或 null
     */
    setServerQuestionId: (questionId) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        serverQuestionId: questionId,
        updatedAt: Date.now(),
      }))
    },

    /**
     * 设置当前会话的回答列表
     * 通常在开始接收流式响应时调用，初始化回答占位
     *
     * @param answers - 回答数组
     */
    setAnswers: (answers) => {
      updateActiveSession(set, get, (s) => ({ ...s, answers, updatedAt: Date.now() }))
    },

    /**
     * 追加流式回答内容
     * 用于 SSE 流式响应时逐步更新回答内容
     * 包含内容截断保护，防止内存溢出
     *
     * @param answerId - 回答 ID
     * @param delta - 增量内容
     */
    appendAnswerDelta: (answerId, delta) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) => {
          if (answer.id !== answerId) return answer
          // 如果内容已被截断，不再追加
          if (isStreamTruncated(answer.content)) return answer
          // 追加内容并检查是否需要截断
          return { ...answer, content: truncateStreamContent(`${answer.content}${delta}`) }
        }),
      }))
    },

    /**
     * 完成回答并更新最终状态
     * 在流式响应结束时调用，更新回答的最终内容和元数据
     *
     * @param answerId - 回答 ID
     * @param patch - 要更新的字段（如 isComplete、citations 等）
     */
    finalizeAnswer: (answerId, patch: Partial<Answer>) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) =>
          answer.id === answerId ? { ...answer, ...patch, error: undefined } : answer
        ),
      }))
    },

    /**
     * 设置回答的错误信息
     * 当某个模型的回答生成失败时调用
     *
     * @param answerId - 回答 ID
     * @param message - 错误消息
     */
    setAnswerError: (answerId, message) => {
      updateActiveSession(set, get, (s) => ({
        ...s,
        updatedAt: Date.now(),
        answers: s.answers.map((answer) => (answer.id === answerId ? { ...answer, error: message } : answer)),
      }))
    },

    /**
     * 设置全局加载状态
     * 在开始/结束获取回答时调用
     *
     * @param isLoading - 是否正在加载
     */
    setLoading: (isLoading) => set({ isLoading }),

    /**
     * 设置用户投票的回答 ID
     * 用户选择最佳回答后调用
     *
     * @param answerId - 回答 ID 或 null（取消投票）
     */
    setVotedAnswerId: (answerId) => {
      updateActiveSession(set, get, (s) => ({ ...s, votedAnswerId: answerId, updatedAt: Date.now() }))
    },

    /**
     * 设置投票提交状态
     * 在开始/结束提交投票时调用
     *
     * @param isVoting - 是否正在投票
     */
    setVoting: (isVoting) => set({ isVoting }),
  }
}

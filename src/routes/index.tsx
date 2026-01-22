// Arena Page - RAG 问答竞技场首页

import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  QuestionInput,
  TaskSidebar,
  RatingModal,
  ArenaHeader,
  ArenaAnswerSection,
  ArenaMobileDrawer,
  ArenaSourcesDrawer,
  type LayoutMode,
  type DateRange,
} from '@/components/arena'
import { useArenaStore } from '@/stores/arena'
import { useArenaSession, useArenaVote } from '@/hooks'
import { arenaApi } from '@/services/arena'
import { message } from 'antd'
import { useDeltaBuffer } from '@/hooks/useDeltaBuffer'

export const Route = createFileRoute('/')({
  component: ArenaPage,
})

function ArenaPage() {
  const {
    setAnswers,
    appendAnswerDelta,
    finalizeAnswer,
    setAnswerError,
    setLoading,
    startNewSession,
    startSessionWithQuestion,
    setServerQuestionId,
  } = useArenaStore()

  // 使用自定义 Hooks
  const {
    activeSessionId,
    question,
    answers,
    votedAnswerId,
    hasAnswers,
    isActive,
    citationsCount,
    isLoading,
  } = useArenaSession()

  const {
    votingAnswerId,
    ratingModalOpen,
    ratingAnswerId,
    ratingProviderId,
    handleVote,
    handleSubmitRating,
    closeRatingModal,
  } = useArenaVote()

  // 本地 UI 状态
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('two-col')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [sourcesTab, setSourcesTab] = useState<string>('all')
  const [draftQuestion, setDraftQuestion] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 会话切换时重置状态
  useEffect(() => {
    setDraftQuestion('')
  }, [activeSessionId])

  // Delta 缓冲区
  const { addDelta, flush, clear } = useDeltaBuffer((buffer) => {
    for (const [answerId, delta] of buffer) {
      if (delta) appendAnswerDelta(answerId, delta)
    }
  })

  // 提交问题
  const handleSubmit = async (q: string, dateRange?: DateRange) => {
    setDraftQuestion(q)
    await startSessionWithQuestion(q)
    setLoading(true)
    clear()

    try {
      setServerQuestionId(null)
      setAnswers([])

      await arenaApi.submitQuestionStream(q, dateRange, {
        onMeta: (meta) => {
          setServerQuestionId(meta.questionId)
          setAnswers(
            meta.answers.map((a) => ({
              id: a.answerId,
              providerId: a.providerId,
              content: '',
            }))
          )
        },
        onDelta: (e) => {
          addDelta(e.answerId, e.delta)
        },
        onAnswerDone: (e) => {
          flush()
          finalizeAnswer(e.answerId, {
            content: e.content,
            citations: e.citations,
          })
        },
        onAnswerError: (e) => {
          flush()
          setAnswerError(e.answerId, e.message)
        },
        onDone: (e) => {
          flush()
          if (!e.ok) {
            throw new Error(e.message || '获取回答失败，请重试')
          }
        },
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取回答失败，请重试')
      setServerQuestionId(null)
      setAnswers([])
    } finally {
      setLoading(false)
    }
  }

  // 重新提问
  const handleReset = async () => {
    if (isLoading) return
    await startNewSession()
  }

  // 打开引用面板
  const handleOpenSources = () => {
    setSourcesTab('all')
    setSourcesOpen(true)
  }

  return (
    <div className="min-h-full relative">
      {/* 左侧可折叠侧边栏 - 固定定位 */}
      <aside
        className={`hidden lg:block fixed top-8 left-6 bottom-8 transition-all duration-300 ease-out z-10 ${
          sidebarCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        <TaskSidebar
          className="h-full w-full"
          disabled={isLoading}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </aside>

      {/* 主内容区 - 使用全局滚动，占据剩余所有空间 */}
      <div
        className={`min-w-0 flex flex-col transition-all duration-300 pr-4 ${
          sidebarCollapsed ? 'lg:ml-24' : 'lg:ml-80'
        }`}
      >
        {/* 标题和输入区域 */}
        <div
          className={`transition-all duration-500 ease-out ${
            isActive ? 'pt-0' : 'flex-1 flex flex-col justify-center'
          }`}
        >
          <div className="w-full">
            {/* 页面标题 */}
            <ArenaHeader
              isActive={isActive}
              isLoading={isLoading}
              onOpenHistory={() => setHistoryOpen(true)}
            />

            {/* 问题输入区域 */}
            <div className={`transition-all duration-500 ${isActive ? 'mb-6' : 'mb-0'}`}>
              <QuestionInput
                key={activeSessionId}
                loading={isLoading}
                disabled={hasAnswers}
                value={draftQuestion}
                onChange={setDraftQuestion}
                onSubmit={handleSubmit}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>

        {/* 回答区域 */}
        {isActive && (
          <ArenaAnswerSection
            question={question}
            answers={answers}
            votedAnswerId={votedAnswerId}
            votingAnswerId={votingAnswerId}
            citationsCount={citationsCount}
            isLoading={isLoading}
            hasAnswers={hasAnswers}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            onVote={handleVote}
            onOpenSources={handleOpenSources}
          />
        )}
      </div>

      {/* 移动端抽屉侧边栏 */}
      <ArenaMobileDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        isLoading={isLoading}
      />

      {/* 引用来源面板 */}
      <ArenaSourcesDrawer
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        answers={answers}
        citationsCount={citationsCount}
        activeTab={sourcesTab}
        onTabChange={setSourcesTab}
      />

      {/* 评分弹窗 */}
      {ratingAnswerId && (
        <RatingModal
          open={ratingModalOpen}
          answerId={ratingAnswerId}
          providerId={ratingProviderId}
          onClose={closeRatingModal}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  )
}

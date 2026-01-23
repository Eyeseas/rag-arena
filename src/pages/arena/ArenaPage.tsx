// ArenaPage - RAG 问答竞技场首页（提取自路由文件，避免 routes 目录承担页面实现细节）

import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import {
  QuestionInput,
  TaskSidebar,
  ArenaHeader,
  ArenaAnswerSection,
  ArenaMobileDrawer,
  ArenaSourcesDrawer,
} from '@/components/arena'

// 懒加载 VoteFeedbackModal - 仅在投票后使用
const VoteFeedbackModal = lazy(() => import('@/components/arena/VoteFeedbackModal').then(m => ({ default: m.VoteFeedbackModal })))
import { useArenaSession, useArenaVote, useArenaQuestion, useArenaUI } from '@/hooks'
import type { DateRange } from '@/types/common'

export function ArenaPage() {
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

  const { submitQuestion, resetQuestion } = useArenaQuestion()

  const {
    votingAnswerId,
    feedbackModalOpen,
    feedbackAnswerId,
    feedbackProviderId,
    handleVote,
    handleSubmitFeedback,
    closeFeedbackModal,
  } = useArenaVote()

  // 页面 UI 状态（与业务数据解耦）
  const {
    layoutMode,
    setLayoutMode,
    historyOpen,
    openHistory,
    closeHistory,
    sourcesOpen,
    sourcesTab,
    setSourcesTab,
    openSources,
    closeSources,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useArenaUI()

  // 提交问题
  const handleSubmit = async (q: string, dateRange?: DateRange) => {
    await submitQuestion(q, dateRange)
  }

  // 重新提问
  const handleReset = async () => {
    if (isLoading) return
    await resetQuestion()
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
            <ArenaHeader isActive={isActive} isLoading={isLoading} onOpenHistory={openHistory} />

            {/* 问题输入区域 */}
            <div className={`transition-all duration-500 ${isActive ? 'mb-6' : 'mb-0'}`}>
              <QuestionInput
                key={activeSessionId}
                loading={isLoading}
                disabled={hasAnswers}
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
            onOpenSources={() => openSources('all')}
          />
        )}
      </div>

      {/* 移动端抽屉侧边栏 */}
      <ArenaMobileDrawer open={historyOpen} onClose={closeHistory} isLoading={isLoading} />

      {/* 引用来源面板 */}
      <ArenaSourcesDrawer
        open={sourcesOpen}
        onClose={closeSources}
        answers={answers}
        citationsCount={citationsCount}
        activeTab={sourcesTab}
        onTabChange={setSourcesTab}
      />

      {/* 投票反馈弹窗 - 懒加载 */}
      {feedbackAnswerId && (
        <Suspense fallback={<Spin />}>
          <VoteFeedbackModal
            open={feedbackModalOpen}
            providerId={feedbackProviderId}
            onClose={closeFeedbackModal}
            onSubmit={handleSubmitFeedback}
          />
        </Suspense>
      )}
    </div>
  )
}

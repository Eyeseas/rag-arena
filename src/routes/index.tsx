// Arena Page - RAG 问答竞技场首页

import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Typography, message, Drawer, Button, Tabs, Empty, Badge, Tag } from 'antd'
import {
  TrophyOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  FileTextOutlined,
  StarFilled,
} from '@ant-design/icons'
import {
  QuestionInput,
  AnswerGrid,
  AnswerGridSkeleton,
  LayoutSwitcher,
  TaskSidebar,
  CitationSourcesPanel,
  type LayoutMode,
  type DateRange,
} from '@/components/arena'
import { buildSourcesItemsFromAnswers } from '@/lib/citationSources'
import { useArenaStore } from '@/stores/arena'
import { arenaApi } from '@/services/arena'

const { Title, Paragraph } = Typography

export const Route = createFileRoute('/')({
  component: ArenaPage,
})

function ArenaPage() {
  const {
    isLoading,
    setAnswers,
    appendAnswerDelta,
    finalizeAnswer,
    setAnswerError,
    setLoading,
    setVotedAnswerId,
    startNewSession,
    startSessionWithQuestion,
    setServerQuestionId,
  } = useArenaStore()

  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('two-col')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [sourcesTab, setSourcesTab] = useState<string>('all')
  const [draftQuestion, setDraftQuestion] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const activeSessionId = useArenaStore((s) => s.activeSessionId)
  const activeSession = useArenaStore(
    (s) => s.sessions.find((ss) => ss.id === s.activeSessionId) || null,
  )

  const question = activeSession?.question || ''
  const questionId = activeSession?.serverQuestionId || null
  const answers = activeSession?.answers || []
  const votedAnswerId = activeSession?.votedAnswerId || null

  useEffect(() => {
    setVotingAnswerId(null)
    setDraftQuestion('')
  }, [activeSessionId])

  const citationsCount = answers.reduce((sum, a) => sum + (a.citations?.length || 0), 0)

  // 提交问题
  const handleSubmit = async (q: string, dateRange?: DateRange) => {
    setDraftQuestion(q)
    startSessionWithQuestion(q)
    setLoading(true)

    try {
      setServerQuestionId(null)
      setAnswers([])

      const deltaBuffer = new Map<string, string>()
      let flushScheduled = false
      const flush = () => {
        flushScheduled = false
        for (const [answerId, delta] of deltaBuffer) {
          if (delta) appendAnswerDelta(answerId, delta)
        }
        deltaBuffer.clear()
      }
      const scheduleFlush = () => {
        if (flushScheduled) return
        flushScheduled = true
        requestAnimationFrame(flush)
      }

      await arenaApi.submitQuestionStream(q, dateRange, {
        onMeta: (meta) => {
          setServerQuestionId(meta.questionId)
          setAnswers(
            meta.answers.map((a) => ({
              id: a.answerId,
              providerId: a.providerId,
              content: '',
            })),
          )
        },
        onDelta: (e) => {
          deltaBuffer.set(e.answerId, `${deltaBuffer.get(e.answerId) || ''}${e.delta}`)
          scheduleFlush()
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

  // 点赞
  const handleVote = async (answerId: string) => {
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
    } catch (error) {
      message.error(error instanceof Error ? error.message : '投票失败，请重试')
    } finally {
      setVotingAnswerId(null)
    }
  }

  // 重新提问
  const handleReset = () => {
    if (isLoading) return
    startNewSession()
  }

  const hasAnswers = answers.length > 0
  const isActive = hasAnswers || isLoading

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
            <div
              className={`text-center relative transition-all duration-500 ${
                isActive ? 'mb-6' : 'mb-8'
              }`}
            >
              {/* 移动端侧栏按钮 */}
              <Button
                className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2"
                icon={<HistoryOutlined />}
                onClick={() => setHistoryOpen(true)}
                disabled={isLoading}
              >
                历史
              </Button>

              {/* Logo 和标题 - 水平排列 */}
              <div
                className={`inline-flex items-center gap-3 transition-all duration-500 ${
                  isActive ? 'scale-95' : 'scale-100'
                }`}
              >
                {/* Logo */}
                <div
                  className={`relative flex-shrink-0 transition-all duration-500 ${
                    isActive ? 'w-10 h-10' : 'w-12 h-12'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-xl rotate-6 opacity-20 blur-lg" />
                  <div className="relative w-full h-full bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                    <TrophyOutlined
                      className={`text-white transition-all duration-500 ${
                        isActive ? 'text-lg' : 'text-2xl'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-start">
                  <Title
                    level={isActive ? 4 : 3}
                    className="!mb-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent"
                  >
                    RAG 问答竞技场
                  </Title>
                  {!isActive && (
                    <span className="text-slate-600 text-sm mt-1 animate-fade-in">
                      <ThunderboltOutlined className="mr-1.5 text-amber-500" />
                      对比多个 AI 模型的回答，为最佳答案投票
                    </span>
                  )}
                </div>
              </div>
            </div>

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
                        onClick={() => {
                          setSourcesTab('all')
                          setSourcesOpen(true)
                        }}
                        className="!rounded-xl"
                      >
                        引用面板
                      </Button>
                    </Badge>
                  )}
                  <LayoutSwitcher value={layoutMode} onChange={setLayoutMode} />
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
                onVote={handleVote}
                layoutMode={layoutMode}
                disableVoting={isLoading}
              />
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
        )}
      </div>

      {/* 移动端抽屉侧边栏 - 只保留历史会话 */}
      <Drawer
        title={
          <span className="flex items-center gap-2">
            <HistoryOutlined className="text-teal-500" />
            任务列表
          </span>
        }
        placement="left"
        styles={{
          content: { width: 320 },
          body: { padding: 16 },
        }}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        className="lg:hidden"
      >
        <TaskSidebar
          className="h-full"
          disabled={isLoading}
          onAfterSelect={() => setHistoryOpen(false)}
        />
      </Drawer>

      {/* 引用来源面板 */}
      <Drawer
        title={
          <span className="flex items-center gap-2">
            <FileTextOutlined className="text-teal-500" />
            引用来源面板
            <Badge count={citationsCount} size="small" color="#14b8a6" />
          </span>
        }
        placement="right"
        styles={{
          content: { width: 480 },
          body: { padding: 16 },
        }}
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
      >
        {citationsCount === 0 ? (
          <Empty description="暂无引用来源" />
        ) : (
          <Tabs
            activeKey={sourcesTab}
            onChange={setSourcesTab}
            items={[
              {
                key: 'all',
                label: '全部',
                children: (
                  <CitationSourcesPanel
                    items={buildSourcesItemsFromAnswers(answers)}
                    onClickItem={(item) => {
                      if (!item.url) return
                      window.open(item.url, '_blank', 'noopener,noreferrer')
                    }}
                  />
                ),
              },
              ...Array.from(new Set(answers.map((a) => a.providerId))).map((providerId) => ({
                key: providerId,
                label: `模型 ${providerId}`,
                children: (
                  <CitationSourcesPanel
                    items={buildSourcesItemsFromAnswers(answers, providerId)}
                    onClickItem={(item) => {
                      if (!item.url) return
                      window.open(item.url, '_blank', 'noopener,noreferrer')
                    }}
                  />
                ),
              })),
            ]}
          />
        )}
      </Drawer>
    </div>
  )
}

// Arena Page - RAG 问答竞技场首页

import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Typography, message, Drawer, Button, Tabs, Empty, Badge, Tag } from 'antd'
import {
  TrophyOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  FileTextOutlined,
  RobotOutlined,
  StarFilled,
} from '@ant-design/icons'
import {
  QuestionInput,
  AnswerGrid,
  AnswerGridSkeleton,
  LayoutSwitcher,
  SessionSidebar,
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
    <div className="mx-auto w-full max-w-7xl flex gap-6 min-h-[calc(100vh-4rem)]">
      {/* 桌面端侧边栏 - 只保留历史会话 */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-6 h-[calc(100vh-5rem)]">
          <SessionSidebar className="h-full" disabled={isLoading} />
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 标题和输入区域 */}
        <div
          className={`transition-all duration-500 ease-out ${
            isActive ? 'pt-0' : 'flex-1 flex flex-col justify-center'
          }`}
        >
          <div className="w-full max-w-4xl mx-auto">
            {/* 页面标题 */}
            <div
              className={`text-center relative transition-all duration-500 ${
                isActive ? 'mb-6' : 'mb-10'
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

              {/* Logo 和标题 */}
              <div
                className={`inline-flex flex-col items-center transition-all duration-500 ${
                  isActive ? 'scale-90' : 'scale-100'
                }`}
              >
                {/* Logo */}
                <div
                  className={`relative mb-4 transition-all duration-500 ${
                    isActive ? 'w-12 h-12' : 'w-20 h-20'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl rotate-6 opacity-20 blur-lg" />
                  <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <TrophyOutlined
                      className={`text-white transition-all duration-500 ${
                        isActive ? 'text-xl' : 'text-4xl'
                      }`}
                    />
                  </div>
                </div>

                <Title
                  level={isActive ? 4 : 2}
                  className="!mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                >
                  RAG 问答竞技场
                </Title>

                {!isActive && (
                  <Paragraph className="text-slate-500 max-w-md animate-fade-in">
                    <ThunderboltOutlined className="mr-2 text-amber-500" />
                    提出问题，对比多个 AI 模型的回答，为最佳答案投票
                  </Paragraph>
                )}
              </div>
            </div>

            {/* 空状态特性展示 */}
            {!isActive && (
              <div className="grid grid-cols-3 gap-4 mb-10 animate-fade-in-up">
                {[
                  {
                    icon: <RobotOutlined className="text-indigo-500" />,
                    title: '多模型对比',
                    desc: '同时获取多个 AI 的回答',
                  },
                  {
                    icon: <FileTextOutlined className="text-purple-500" />,
                    title: '引用溯源',
                    desc: '每个回答都有来源出处',
                  },
                  {
                    icon: <StarFilled className="text-amber-500" />,
                    title: '社区投票',
                    desc: '投票选出最优质回答',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <div className="font-semibold text-slate-700 text-sm mb-1">
                      {feature.title}
                    </div>
                    <div className="text-xs text-slate-500">{feature.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 问题输入区域 */}
            <div className={`transition-all duration-500 ${isActive ? 'mb-6' : 'mb-8'}`}>
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
                    <Badge count={citationsCount} size="small" color="#6366f1">
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
            <HistoryOutlined className="text-indigo-500" />
            历史会话
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
        <SessionSidebar
          className="h-full"
          disabled={isLoading}
          onAfterSelect={() => setHistoryOpen(false)}
        />
      </Drawer>

      {/* 引用来源面板 */}
      <Drawer
        title={
          <span className="flex items-center gap-2">
            <FileTextOutlined className="text-indigo-500" />
            引用来源面板
            <Badge count={citationsCount} size="small" color="#6366f1" />
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

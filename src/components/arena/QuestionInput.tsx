// QuestionInput - 问题输入组件 (使用 @ant-design/x Sender + Prompts)

import { useState, useRef } from 'react'
import { Sender, Prompts, type PromptsItemType } from '@ant-design/x'
import type { SenderRef } from '@ant-design/x/es/sender'
import { Button, DatePicker, Tooltip, Collapse } from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  SendOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  DownOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ARENA_PROMPT_TEMPLATES, getPromptTextByKey } from '@/lib/prompts'
import { useArenaStore } from '@/stores/arena'
import { arenaApi } from '@/services/arena'
import { message } from 'antd'

const { RangePicker } = DatePicker

export type DateRange = [Dayjs | null, Dayjs | null] | null

interface QuestionInputProps {
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 (已有回答时) */
  disabled?: boolean
  /** 受控输入值（用于 Prompt 库填入等） */
  value?: string
  /** 受控输入变更回调 */
  onChange?: (value: string) => void
  /** 提交问题回调 */
  onSubmit: (question: string, dateRange?: DateRange) => void
  /** 重新提问回调 */
  onReset?: () => void
}

const getPresets = () => [
  { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
  { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近3个月', value: [dayjs().subtract(3, 'month'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近1年', value: [dayjs().subtract(1, 'year'), dayjs()] as [Dayjs, Dayjs] },
]

// Prompt 图标映射
const iconByKey: Record<string, React.ReactNode> = {
  'rag.citations.extract': <FileSearchOutlined className="text-sky-500" />,
  'rag.citations.verify': <SafetyCertificateOutlined className="text-emerald-500" />,
  'rag.compare.4models': <BarChartOutlined className="text-teal-500" />,
  'rag.summarize.actionable': <CheckSquareOutlined className="text-amber-500" />,
  'rag.write.dashboard_spec': <FileTextOutlined className="text-rose-500" />,
}

// 构建 Prompts 数据
function buildPromptItems(): PromptsItemType[] {
  const grouped = new Map<string, PromptsItemType>()

  for (const prompt of ARENA_PROMPT_TEMPLATES) {
    const groupKey = `group:${prompt.group}`
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        key: groupKey,
        label: prompt.group,
        children: [],
      })
    }

    grouped.get(groupKey)!.children!.push({
      key: prompt.key,
      label: prompt.title,
      description: prompt.description,
      icon: iconByKey[prompt.key] || <BulbOutlined className="text-slate-500" />,
    })
  }

  return Array.from(grouped.values())
}

export function QuestionInput({
  loading = false,
  disabled = false,
  value,
  onChange,
  onSubmit,
  onReset,
}: QuestionInputProps) {
  const [innerValue, setInnerValue] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>(null)
  const [promptsExpanded, setPromptsExpanded] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const senderRef = useRef<SenderRef>(null)

  // 从 store 获取状态和操作
  const {
    activeTaskId,
    activeSessionId,
    startSessionWithQuestion,
    setLoading,
    setAnswers,
    appendAnswerDelta,
    finalizeAnswer,
    setAnswerError,
    setServerQuestionId,
  } = useArenaStore()

  const mergedValue = value ?? innerValue
  const setMergedValue = onChange ?? setInnerValue

  const promptItems = buildPromptItems()

  // 获取 userId
  const getUserId = () => {
    const storedUserId = localStorage.getItem('userId')
    return storedUserId || 'default_user'
  }

  const handleSubmit = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    // 如果没有 taskId，先调用 onSubmit（保持向后兼容）
    if (!activeTaskId) {
      onSubmit(trimmed, dateRange)
      return
    }

    // 使用流式接口
    setIsStreaming(true)
    setLoading(true)

    try {
      // 创建或获取会话
      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = await startSessionWithQuestion(trimmed)
      }

      // 获取当前会话
      let currentSession = useArenaStore.getState().sessions.find((s) => s.id === sessionId)
      
      // 如果会话没有priIdMapping，先调用创建对话接口
      if (!currentSession?.priIdMapping) {
        try {
          const response = await arenaApi.createConversation(getUserId(), {
            taskId: activeTaskId,
            messages: [],
          })

          let serverSessionId = ''
          let priIdMapping: Record<string, string> | undefined
          if (response.code === 200 || response.code === 0) {
            serverSessionId = response.data.sessionId
            priIdMapping = response.data.priIdMapping
          } else {
            message.error('创建会话失败，请重试')
            return
          }

          // 更新会话，保存priIdMapping和serverSessionId
          const finalSessionId = serverSessionId || sessionId
          
          // 更新会话的priIdMapping和sessionId
          useArenaStore.setState((state) => ({
            sessions: state.sessions.map((s) => 
              s.id === sessionId 
                ? { 
                    ...s, 
                    id: finalSessionId, // 使用服务器返回的sessionId
                    priIdMapping,
                    serverQuestionId: null,
                    answers: [],
                    votedAnswerId: null,
                  }
                : s
            ),
            activeSessionId: finalSessionId,
          }))

          // 更新当前会话引用和sessionId
          sessionId = finalSessionId
          currentSession = useArenaStore.getState().sessions.find((s) => s.id === sessionId)
        } catch (error) {
          message.error(error instanceof Error ? error.message : '创建会话失败，请重试')
          return
        }
      }

      // 获取当前会话的priIdMapping
      const priIdMapping = currentSession?.priIdMapping

      if (!priIdMapping) {
        message.error('未找到模型映射信息，请重新创建会话')
        return
      }

      // 获取当前会话的消息历史
      const messages = currentSession
        ? [
            ...(currentSession.answers.map((a) => ({
              role: 'assistant',
              content: a.content,
            })) as Array<{ role: string; content: string }>),
            { role: 'user', content: trimmed },
          ]
        : [{ role: 'user', content: trimmed }]

      // 格式化时间范围
      const startTime = dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss')
      const endTime = dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss')

      // 准备请求参数
      const request = {
        taskId: activeTaskId,
        session_id: sessionId,
        messages,
        start_time: startTime,
        end_time: endTime,
      }

      // 初始化答案 - 预先创建4个模型框，确保它们一直存在
      setServerQuestionId(null)
      
      // 将 maskCode 映射到 providerId (ALPHA->A, BRAVO->B, CHARLIE->C, DELTA->D)
      const maskCodeToProviderId: Record<string, string> = {
        ALPHA: 'A',
        BRAVO: 'B',
        CHARLIE: 'C',
        DELTA: 'D',
      }
      
      // 定义模型顺序：A、B、C、D
      const orderedMaskCodes = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA']
      
      // 根据priIdMapping创建answer框（按A、B、C、D顺序）
      const initialAnswers = orderedMaskCodes
        .filter((maskCode) => priIdMapping[maskCode]) // 只创建存在的模型
        .map((maskCode) => {
          const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
          return {
            id: providerId, // 使用providerId作为id
            providerId,
            content: '',
          }
        })
      setAnswers(initialAnswers)

      // 调用多模型流式接口 - 按顺序发送4个SSE请求（A、B、C、D）
      await arenaApi.chatConversationMultiModel(
        getUserId(),
        request,
        priIdMapping,
        {
          onDelta: (maskCode, content) => {
            // 根据 maskCode 映射到 providerId
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            const answerId = providerId
            
            // 立即追加内容到对应的answer框 - 确保实时显示
            appendAnswerDelta(answerId, content)
          },
          onDone: (maskCode, citations) => {
            // 根据 maskCode 找到对应的 providerId，然后更新对应的 answer
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            finalizeAnswer(providerId, {
              citations,
            })
          },
          onError: (maskCode, error) => {
            message.error(`模型 ${maskCode} 获取回答失败: ${error.message}`)
            // 为对应的模型设置错误
            const providerId = maskCodeToProviderId[maskCode] || maskCode.charAt(0)
            setAnswerError(providerId, error.message)
          },
        }
      )
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取回答失败，请重试')
      setServerQuestionId(null)
      // 保持4个模型框存在，不清空
      // setAnswers([]) // 注释掉，保持4个框显示
    } finally {
      setIsStreaming(false)
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMergedValue('')
    setDateRange(null)
    onReset?.()
  }

  const handleDateChange = (dates: DateRange) => {
    setDateRange(dates)
  }

  const handlePromptClick = (info: { data: PromptsItemType }) => {
    const text = getPromptTextByKey(info.data.key as string)
    if (!text) return

    // 将 prompt 文本填入输入框
    setMergedValue(text)
    setPromptsExpanded(false)

    // 聚焦到输入框
    setTimeout(() => {
      senderRef.current?.focus({ cursor: 'end' })
    }, 100)
  }

  // 已有回答时，显示重新提问按钮
  if (disabled) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-4 px-8 py-6 border rounded-md bg-gradient-to-r from-slate-50 via-teal-50/30 to-emerald-50/30 border-slate-200">
          <div className="flex-1 text-left">
            <div className="mb-1 text-sm font-medium text-slate-600">想要探索新问题？</div>
            <div className="text-xs text-slate-500">开始一个新的对话，获取更多 AI 模型的回答</div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleReset}
            size="large"
            disabled={loading}
            className="!rounded !h-11 !px-6 !text-sm !font-medium bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 !border-0 !shadow-lg !shadow-teal-500/25 hover:!shadow-xl hover:!shadow-teal-500/35 hover:scale-105 transition-all duration-300"
          >
            新会话
          </Button>
        </div>
      </div>
    )
  }

  // 头部内容：时间选择器 + Prompt 展开区
  const headerNode = (
    <div className="border-b border-slate-200">

      {/* 时间范围选择器 */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-teal-50/50 via-emerald-50/30 to-cyan-50/50">
        <div className="flex items-center flex-shrink-0 gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-teal-500 to-emerald-500">
            <CalendarOutlined className="text-xs text-white" />
          </div>
          <span className="text-sm font-medium text-slate-600">时间范围</span>
        </div>
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            presets={getPresets()}
            placeholder={['开始日期', '结束日期']}
            allowClear
            size="small"
            disabled={loading}
            className="!min-w-0 !rounded-md !h-8 !border-slate-200 hover:!border-teal-400 focus-within:!border-teal-500 focus-within:!shadow-sm focus-within:!shadow-teal-500/20 transition-all duration-200 [&_.ant-picker-input]:!h-8 [&_.ant-picker-input>input]:!text-xs [&_.ant-picker-separator]:!text-slate-400"
          />
          {dateRange && (
            <Tooltip title="清除时间范围">
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setDateRange(null)}
                className="!h-8 !w-8 !p-0 !flex !items-center !justify-center !text-slate-500 hover:!text-red-600 hover:!bg-red-50 !rounded-md transition-all duration-200 cursor-pointer flex-shrink-0"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {/* 主输入框卡片 */}
      <div className="relative group">
        {/* 背景光晕效果 */}
        <div className="absolute transition-opacity duration-500 rounded-lg -inset-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 opacity-15 blur-xl group-hover:opacity-25" />

        {/* 输入框容器 - 单一边框 */}
        <div className="relative overflow-hidden transition-all duration-300 border rounded-md shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-teal-200/30 bg-white/95 backdrop-blur-xl border-slate-200/60 hover:border-teal-300/50">
          <Sender
            ref={senderRef}
            value={mergedValue}
            onChange={setMergedValue}
            onSubmit={handleSubmit}
            onCancel={() => setMergedValue('')}
            loading={loading || isStreaming}
            placeholder="输入您想问的问题，让多个 AI 模型为您解答..."
            autoSize={{ minRows: 3, maxRows: 8 }}
            header={headerNode}
            className="!border-0 !rounded-none !bg-transparent [&_.ant-sender-content]:!bg-transparent [&_.ant-sender-header]:!border-0"
            actions={(_, { SendButton, LoadingButton }) => {
              if (loading) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 animate-pulse">正在思考...</span>
                    <LoadingButton className="!rounded" />
                  </div>
                )
              }
              return (
                <Tooltip title="发送问题 (Enter)">
                  <SendButton
                    icon={<SendOutlined className="rotate-[-45deg] text-lg" />}
                    className="!w-11 !h-11 !rounded !bg-gradient-to-br !from-teal-500 !via-emerald-500 !to-cyan-500 hover:!from-teal-600 hover:!via-emerald-600 hover:!to-cyan-600 !border-0 !shadow-lg !shadow-teal-500/25 hover:!shadow-xl hover:!shadow-teal-500/35 hover:scale-105 transition-all duration-300"
                  />
                </Tooltip>
              )
            }}
          />
        </div>
      </div>

      {/* 底部提示 */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <kbd className="px-2 py-1 bg-white/80 rounded text-slate-600 font-mono text-[11px] shadow-sm border border-slate-200">
            Enter
          </kbd>
          <span>发送</span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <kbd className="px-2 py-1 bg-white/80 rounded text-slate-600 font-mono text-[11px] shadow-sm border border-slate-200">
            Shift + Enter
          </kbd>
          <span>换行</span>
        </div>
      </div>
    </div>
  )
}

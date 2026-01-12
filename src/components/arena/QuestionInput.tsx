// QuestionInput - 问题输入组件 (使用 @ant-design/x Sender + Prompts)

import { useState, useRef } from 'react'
import { Sender, Prompts, type PromptsItemType } from '@ant-design/x'
import type { SenderRef } from '@ant-design/x/es/sender'
import { Button, DatePicker, Tooltip, Collapse, Space } from 'antd'
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
  const senderRef = useRef<SenderRef>(null)

  const mergedValue = value ?? innerValue
  const setMergedValue = onChange ?? setInnerValue

  const promptItems = buildPromptItems()

  const handleSubmit = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed, dateRange)
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
        <div className="flex items-center justify-center gap-4 py-6 px-8 rounded-md bg-gradient-to-r from-slate-50 via-teal-50/30 to-emerald-50/30 border border-slate-200">
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-slate-600 mb-1">想要探索新问题？</div>
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
      {/* Prompts 展开面板 */}
      <Collapse
        ghost
        activeKey={promptsExpanded ? ['prompts'] : []}
        onChange={(keys) => setPromptsExpanded(keys.includes('prompts'))}
        expandIcon={({ isActive }) => (
          <DownOutlined
            className="!text-slate-500 transition-transform duration-300"
            style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
        items={[
          {
            key: 'prompts',
            label: (
              <span className="flex items-center gap-2 text-sm">
                <BulbOutlined className="text-amber-500" />
                <span className="font-medium text-slate-600">Prompt 模板库</span>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {ARENA_PROMPT_TEMPLATES.length} 个模板
                </span>
              </span>
            ),
            children: (
              <div className="pb-3 max-h-52 overflow-auto">
                <Prompts items={promptItems} wrap onItemClick={handlePromptClick} />
              </div>
            ),
          },
        ]}
        className="!bg-transparent"
      />

      {/* 时间范围选择器 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-50/50 via-emerald-50/30 to-cyan-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <CalendarOutlined className="text-white text-xs" />
          </div>
          <span className="text-sm font-medium text-slate-600">时间范围</span>
        </div>
        <Space size="small">
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            presets={getPresets()}
            placeholder={['开始日期', '结束日期']}
            allowClear
            size="small"
            disabled={loading}
            className="!rounded !border-slate-200 hover:!border-teal-400 focus-within:!border-teal-500 focus-within:!shadow-sm focus-within:!shadow-teal-500/20"
          />
          {dateRange && (
            <Tooltip title="清除时间范围">
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setDateRange(null)}
                className="!text-slate-500 hover:!text-red-600 hover:!bg-red-50 !rounded transition-all cursor-pointer"
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {/* 主输入框卡片 */}
      <div className="relative group">
        {/* 背景光晕效果 */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-lg opacity-15 blur-xl group-hover:opacity-25 transition-opacity duration-500" />

        {/* 输入框容器 - 单一边框 */}
        <div className="relative rounded-md overflow-hidden shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-teal-200/30 transition-all duration-300 bg-white/95 backdrop-blur-xl border border-slate-200/60 hover:border-teal-300/50">
          <Sender
            ref={senderRef}
            value={mergedValue}
            onChange={setMergedValue}
            onSubmit={handleSubmit}
            onCancel={() => setMergedValue('')}
            loading={loading}
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
      <div className="mt-4 flex items-center justify-center gap-4">
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

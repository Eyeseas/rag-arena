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
  'rag.compare.4models': <BarChartOutlined className="text-purple-500" />,
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
      icon: iconByKey[prompt.key] || <BulbOutlined className="text-slate-400" />,
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
      <div className="w-full max-w-3xl mx-auto text-center">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleReset}
          size="large"
          disabled={loading}
          className="!rounded-xl !h-12 !px-8 !shadow-lg !shadow-indigo-500/25 hover:!shadow-xl hover:!shadow-indigo-500/30 transition-all duration-300"
        >
          新建会话
        </Button>
      </div>
    )
  }

  // 头部内容：时间选择器 + Prompt 展开区
  const headerNode = (
    <div className="border-b border-slate-100">
      {/* Prompts 展开面板 */}
      <Collapse
        ghost
        activeKey={promptsExpanded ? ['prompts'] : []}
        onChange={(keys) => setPromptsExpanded(keys.includes('prompts'))}
        expandIcon={({ isActive }) => (
          <DownOutlined
            className="!text-slate-400 transition-transform duration-300"
            style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
        items={[
          {
            key: 'prompts',
            label: (
              <span className="flex items-center gap-2 text-sm">
                <BulbOutlined className="text-amber-500" />
                <span className="font-medium text-slate-700">Prompt 模板库</span>
                <span className="text-xs text-slate-400">
                  ({ARENA_PROMPT_TEMPLATES.length} 个模板)
                </span>
              </span>
            ),
            children: (
              <div className="pb-2 max-h-52 overflow-auto">
                <Prompts items={promptItems} wrap onItemClick={handlePromptClick} />
              </div>
            ),
          },
        ]}
        className="!bg-transparent"
      />

      {/* 时间范围选择器 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/50">
        <div className="flex items-center gap-2 text-slate-600">
          <CalendarOutlined className="text-indigo-500" />
          <span className="text-sm font-medium">时间范围</span>
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
            className="!rounded-lg"
          />
          {dateRange && (
            <Tooltip title="清除时间范围">
              <Button
                type="text"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => setDateRange(null)}
                className="!text-slate-400 hover:!text-slate-600"
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-shadow duration-300">
        <Sender
          ref={senderRef}
          value={mergedValue}
          onChange={setMergedValue}
          onSubmit={handleSubmit}
          onCancel={() => setMergedValue('')}
          loading={loading}
          placeholder="输入您的问题，或展开模板库快速开始..."
          autoSize={{ minRows: 2, maxRows: 6 }}
          header={headerNode}
          actions={(_, { SendButton, LoadingButton }) => {
            if (loading) {
              return <LoadingButton />
            }
            return (
              <Tooltip title="发送 (Enter)">
                <SendButton
                  icon={<SendOutlined className="rotate-[-45deg]" />}
                  className="!bg-gradient-to-r !from-indigo-500 !to-purple-500 hover:!from-indigo-600 hover:!to-purple-600 !border-0 !shadow-md !shadow-indigo-500/25"
                />
              </Tooltip>
            )
          }}
        />
      </div>

      {/* 提示文本 */}
      <div className="mt-3 text-center">
        <span className="text-xs text-slate-400">
          按{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">
            Enter
          </kbd>{' '}
          发送，
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[10px]">
            Shift + Enter
          </kbd>{' '}
          换行
        </span>
      </div>
    </div>
  )
}

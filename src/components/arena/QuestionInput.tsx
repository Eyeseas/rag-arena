// QuestionInput - 问题输入组件 (使用 @ant-design/x Sender)

import { useState } from 'react'
import { Sender } from '@ant-design/x'
import { Button, DatePicker } from 'antd'
import { ReloadOutlined, CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export type DateRange = [Dayjs | null, Dayjs | null] | null

interface QuestionInputProps {
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 (已有回答时) */
  disabled?: boolean
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

export function QuestionInput({
  loading = false,
  disabled = false,
  onSubmit,
  onReset,
}: QuestionInputProps) {
  const [value, setValue] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>(null)

  const handleSubmit = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed, dateRange)
  }

  const handleReset = () => {
    setValue('')
    setDateRange(null)
    onReset?.()
  }

  const handleDateChange = (dates: DateRange) => {
    setDateRange(dates)
  }

  // 已有回答时，显示重新提问按钮
  if (disabled) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          size="large"
        >
          重新提问
        </Button>
      </div>
    )
  }

  // 时间选择器头部面板
  const headerNode = (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-t-lg border-b border-gray-100">
      <CalendarOutlined className="text-blue-500" />
      <span className="text-sm text-gray-600">时间范围：</span>
      <RangePicker
        value={dateRange}
        onChange={handleDateChange}
        presets={getPresets()}
        placeholder={['开始日期', '结束日期']}
        allowClear
        size="small"
        disabled={loading}
      />
    </div>
  )

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Sender
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onCancel={() => setValue('')}
        loading={loading}
        placeholder="输入您的问题，按 Enter 发送..."
        autoSize={{ minRows: 2, maxRows: 6 }}
        header={headerNode}
      />
    </div>
  )
}

import { Button, DatePicker, Tooltip } from 'antd'
import { CalendarOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

import type { DateRange } from '@/types/common'

const { RangePicker } = DatePicker

const getPresets = () => [
  { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
  { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近3个月', value: [dayjs().subtract(3, 'month'), dayjs()] as [Dayjs, Dayjs] },
  { label: '最近1年', value: [dayjs().subtract(1, 'year'), dayjs()] as [Dayjs, Dayjs] },
]

interface QuestionInputDateRangeHeaderProps {
  dateRange: DateRange
  loading: boolean
  onDateChange: (dates: DateRange) => void
  onClearDateRange: () => void
}

export function QuestionInputDateRangeHeader({
  dateRange,
  loading,
  onDateChange,
  onClearDateRange,
}: QuestionInputDateRangeHeaderProps) {
  return (
    <div className="border-b border-slate-200">
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
            onChange={onDateChange}
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
                onClick={onClearDateRange}
                className="!h-8 !w-8 !p-0 !flex !items-center !justify-center !text-slate-500 hover:!text-red-600 hover:!bg-red-50 !rounded-md transition-all duration-200 cursor-pointer flex-shrink-0"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

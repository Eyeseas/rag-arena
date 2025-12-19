// QuestionInput - 问题输入组件 (使用 @ant-design/x Sender)

import { useState } from 'react'
import { Sender } from '@ant-design/x'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface QuestionInputProps {
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 (已有回答时) */
  disabled?: boolean
  /** 提交问题回调 */
  onSubmit: (question: string) => void
  /** 重新提问回调 */
  onReset?: () => void
}

export function QuestionInput({
  loading = false,
  disabled = false,
  onSubmit,
  onReset,
}: QuestionInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  const handleReset = () => {
    setValue('')
    onReset?.()
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
      />
    </div>
  )
}

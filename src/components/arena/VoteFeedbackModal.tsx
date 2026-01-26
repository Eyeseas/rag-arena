// VoteFeedbackModal - 投票反馈弹窗组件

import { useState, useCallback } from 'react'
import { Modal, Checkbox, Button, Space, Typography, Divider } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import type { VoteFeedbackReason, VoteFeedbackData } from '@/types/arena'

const { Text } = Typography

interface VoteFeedbackModalProps {
  /** 是否显示 */
  open: boolean
  /** 模型标识 */
  providerId: string
  /** 关闭回调 */
  onClose: () => void
  /** 提交回调 */
  onSubmit: (data: VoteFeedbackData) => Promise<void>
}

/** 回答质量问题选项 */
const ANSWER_ISSUES: Array<{ value: VoteFeedbackReason; label: string }> = [
  { value: 'SLOW_RESPONSE', label: '响应速度太慢' },
  { value: 'IRRELEVANT_DIALOGUE', label: '存在无关话单' },
  { value: 'HALLUCINATION', label: '存在编造内容' },
]

/** 引用质量问题选项 */
const CITATION_ISSUES: Array<{ value: VoteFeedbackReason; label: string }> = [
  { value: 'CITATION_SUMMARY_INACCURATE', label: '摘要不够准确' },
  { value: 'KEY_CONTENT_LOCATE_INACCURATE', label: '关键内容定位不够准确' },
]

export function VoteFeedbackModal(props: VoteFeedbackModalProps) {
  const { open, providerId, onClose, onSubmit } = props
  const [answerIssues, setAnswerIssues] = useState<VoteFeedbackReason[]>([])
  const [citationIssues, setCitationIssues] = useState<VoteFeedbackReason[]>([])
  const [submitting, setSubmitting] = useState(false)

  // 重置状态
  const resetState = useCallback(() => {
    setAnswerIssues([])
    setCitationIssues([])
  }, [])

  // 处理提交
  const handleSubmit = async () => {
    // 至少选择一项才能提交
    if (answerIssues.length === 0 && citationIssues.length === 0) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        answerIssues,
        citationIssues,
      })
      // 提交成功后重置状态并关闭
      resetState()
      onClose()
    } catch (error) {
      console.error('提交反馈失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    resetState()
    onClose()
  }

  // 检查是否可以提交（至少选择一项）
  const canSubmit = answerIssues.length > 0 || citationIssues.length > 0

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div className="flex items-center gap-2">
          <MessageOutlined className="text-teal-500" />
          <span>反馈模型 {providerId} 的回答问题</span>
        </div>
      }
      width={480}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>
            没有问题，不反馈
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            className="!bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 hover:!from-teal-600 hover:!to-emerald-600"
          >
            提交反馈
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <div className="py-4">
        <Text type="secondary" className="text-sm">
          请选择您认为存在的问题（可多选，可选填）
        </Text>

        <Divider className="my-4" />

        {/* 回答质量部分 */}
        <div className="mb-6">
          <Text className="text-base font-medium mb-3 block text-slate-700">
            回答质量
          </Text>
          <Checkbox.Group
            value={answerIssues}
            onChange={(values) => setAnswerIssues(values as VoteFeedbackReason[])}
            className="flex flex-col gap-3"
          >
            {ANSWER_ISSUES.map((item) => (
              <Checkbox
                key={item.value}
                value={item.value}
                className="!ml-0 text-slate-600"
              >
                {item.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>

        <Divider className="my-4" />

        {/* 引用质量部分 */}
        <div>
          <Text className="text-base font-medium mb-3 block text-slate-700">
            引用质量
          </Text>
          <Checkbox.Group
            value={citationIssues}
            onChange={(values) => setCitationIssues(values as VoteFeedbackReason[])}
            className="flex flex-col gap-3"
          >
            {CITATION_ISSUES.map((item) => (
              <Checkbox
                key={item.value}
                value={item.value}
                className="!ml-0 text-slate-600"
              >
                {item.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-md">
          <Text type="secondary" className="text-sm">
            您的反馈将帮助我们改进模型质量，感谢您的参与！
          </Text>
        </div>
      </div>
    </Modal>
  )
}

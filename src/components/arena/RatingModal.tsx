// RatingModal - 评分弹窗组件

import { useState } from 'react'
import { Modal, Rate, Input, Button, Space, Typography, Divider } from 'antd'
import { StarFilled } from '@ant-design/icons'
import type { RatingData } from '@/types/arena'

const { TextArea } = Input
const { Text } = Typography

interface RatingModalProps {
  /** 是否显示 */
  open: boolean
  /** 回答ID */
  answerId: string
  /** 模型标识 */
  providerId: string
  /** 关闭回调 */
  onClose: () => void
  /** 提交回调 */
  onSubmit: (data: RatingData) => Promise<void>
}

/** 评分项配置 */
const RATING_ITEMS: Array<{ key: keyof RatingData; label: string }> = [
  { key: 'timeCost', label: '耗时' },
  { key: 'thinkingContent', label: '思考内容' },
  { key: 'answerAccuracy', label: '回答准确度' },
  { key: 'thinkingSensitivity', label: '思考敏感度' },
  { key: 'citationSummary', label: '引用内容摘要' },
  { key: 'tagAccuracy', label: '标签准确度' },
  { key: 'intelligentProcessing', label: '智能化处理' },
]

export function RatingModal({
  open,
  answerId: _answerId,
  providerId,
  onClose,
  onSubmit,
}: RatingModalProps) {
  const [ratings, setRatings] = useState<Partial<RatingData>>({})
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 处理评分变化
  const handleRatingChange = (key: keyof RatingData, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }))
  }

  // 处理提交
  const handleSubmit = async () => {
    // 检查是否所有评分项都已填写
    const allRated = RATING_ITEMS.every((item) => ratings[item.key] !== undefined)
    
    if (!allRated) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        ...ratings as RatingData,
        remark: remark.trim() || undefined,
      })
      // 提交成功后重置状态并关闭
      setRatings({})
      setRemark('')
      onClose()
    } catch (error) {
      console.error('提交评分失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    setRatings({})
    setRemark('')
    onClose()
  }

  // 检查是否可以提交
  const canSubmit = RATING_ITEMS.every((item) => ratings[item.key] !== undefined)

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div className="flex items-center gap-2">
          <StarFilled className="text-amber-400" />
          <span>为模型 {providerId} 的回答评分</span>
        </div>
      }
      width={600}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={submitting}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            className="!bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 hover:!from-teal-600 hover:!to-emerald-600"
          >
            提交评分
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <div className="py-4">
        <Text type="secondary" className="text-sm">
          请为以下7个维度进行1-5星评分
        </Text>

        <Divider className="my-4" />

        {/* 评分项列表 */}
        <div className="space-y-4">
          {RATING_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <Text className="text-base font-medium min-w-[140px]">
                {item.label}
              </Text>
              <Rate
                value={ratings[item.key] as number}
                onChange={(value) => handleRatingChange(item.key, value)}
                allowClear
                className="flex-1"
              />
              {ratings[item.key] && (
                <Text type="secondary" className="ml-3 min-w-[40px] text-right">
                  {ratings[item.key]} 星
                </Text>
              )}
            </div>
          ))}
        </div>

        <Divider className="my-4" />

        {/* 备注输入框 */}
        <div>
          <Text className="text-base font-medium mb-2 block">备注</Text>
          <TextArea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入您的备注（可选）"
            rows={4}
            maxLength={500}
            showCount
            className="!rounded"
          />
        </div>

        {/* 提示信息 */}
        {!canSubmit && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Text type="warning" className="text-sm">
              请完成所有7个维度的评分后再提交
            </Text>
          </div>
        )}
      </div>
    </Modal>
  )
}

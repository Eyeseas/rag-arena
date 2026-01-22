// AnswerGridSkeleton - 回答区域骨架屏（从 AnswerGrid 拆分，保持主组件聚焦布局/交互）

import { Card, Col, Row, Skeleton, Tag } from 'antd'
import { RobotOutlined } from '@ant-design/icons'

interface AnswerGridSkeletonProps {
  /** 是否显示 */
  visible: boolean
  /** 显示多少个骨架卡片 */
  count?: number
}

function SkeletonCard({ index }: { index: number }) {
  const colors = ['blue', 'green', 'orange', 'magenta']
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-orange-500',
  ]
  const labels = ['A', 'B', 'C', 'D']

  return (
    <Card
      className="!rounded-md overflow-hidden animate-pulse-soft"
      styles={{
        header: {
          borderBottom: 'none',
          padding: '16px 20px',
        },
        body: {
          padding: '16px 20px',
        },
      }}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded bg-gradient-to-br ${gradients[index % 4]}
              flex items-center justify-center shadow-md
              text-white font-bold text-lg
            `}
          >
            {labels[index % 4]}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-700 font-semibold">模型 {labels[index % 4]}</span>
            <span className="text-xs text-slate-500">正在生成回答...</span>
          </div>
        </div>
      }
      extra={
        <Tag color={colors[index % 4]} className="!rounded-full animate-pulse">
          生成中
        </Tag>
      }
    >
      <div className="space-y-3">
        <Skeleton.Input active block style={{ height: 16 }} />
        <Skeleton.Input active block style={{ height: 16, width: '90%' }} />
        <Skeleton.Input active block style={{ height: 16, width: '75%' }} />
        <div className="h-4" />
        <Skeleton.Input active block style={{ height: 16, width: '85%' }} />
        <Skeleton.Input active block style={{ height: 16, width: '60%' }} />
      </div>
    </Card>
  )
}

export function AnswerGridSkeleton({ visible, count = 4 }: AnswerGridSkeletonProps) {
  if (!visible) return null

  return (
    <div className="w-full">
      {/* 顶部提示 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
          <RobotOutlined className="text-teal-500 text-lg animate-pulse" />
          <span className="text-slate-600 font-medium">多个 AI 模型正在思考您的问题...</span>
          <div className="flex gap-1">
            <div
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>

      {/* 骨架卡片网格 */}
      <Row gutter={[20, 20]}>
        {Array.from({ length: count }).map((_, index) => (
          <Col
            key={index}
            xs={24}
            md={12}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <SkeletonCard index={index} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

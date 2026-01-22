import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface QuestionInputDisabledStateProps {
  loading: boolean
  onReset: () => void
}

export function QuestionInputDisabledState({ loading, onReset }: QuestionInputDisabledStateProps) {
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
          onClick={onReset}
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

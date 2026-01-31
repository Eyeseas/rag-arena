/**
 * ArenaHeader - 竞技场页面标题组件
 *
 * 包含 Logo、标题和移动端侧栏按钮
 */

import { Button, Typography } from 'antd'
import { TrophyOutlined, ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons'
import { UserAvatar } from './UserAvatar'

const { Title } = Typography

interface ArenaHeaderProps {
  /** 是否处于活跃状态（有回答或加载中） */
  isActive: boolean
  /** 是否加载中 */
  isLoading: boolean
  /** 打开历史抽屉 */
  onOpenHistory: () => void
}

/**
 * 竞技场页面标题组件
 */
export function ArenaHeader({ isActive, isLoading, onOpenHistory }: ArenaHeaderProps) {
  return (
    <div
      className={`text-center relative transition-all duration-500 ${
        isActive ? 'mb-6' : 'mb-8'
      }`}
    >
      <Button
        className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2"
        icon={<HistoryOutlined />}
        onClick={onOpenHistory}
        disabled={isLoading}
      >
        历史
      </Button>

      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <UserAvatar />
      </div>

      {/* Logo 和标题 - 水平排列 */}
      <div
        className={`inline-flex items-center gap-3 transition-all duration-500 ${
          isActive ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Logo */}
        <div
          className={`relative flex-shrink-0 transition-all duration-500 ${
            isActive ? 'w-10 h-10' : 'w-12 h-12'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-xl rotate-6 opacity-20 blur-lg" />
          <div className="relative w-full h-full bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
            <TrophyOutlined
              className={`text-white transition-all duration-500 ${
                isActive ? 'text-lg' : 'text-2xl'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-col items-start">
          <Title
            level={isActive ? 4 : 3}
            className="!mb-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent"
          >
            RAG 问答竞技场
          </Title>
          {!isActive && (
            <span className="text-slate-600 text-sm mt-1 animate-fade-in">
              <ThunderboltOutlined className="mr-1.5 text-amber-500" />
              对比多个 AI 模型的回答，为最佳答案投票
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

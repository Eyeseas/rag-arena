/**
 * ArenaMobileDrawer - 移动端历史抽屉组件
 */

import { Drawer } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { TaskSidebar } from '@/components/arena'

interface ArenaMobileDrawerProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 是否加载中 */
  isLoading: boolean
}

/**
 * 移动端历史抽屉组件
 */
export function ArenaMobileDrawer({ open, onClose, isLoading }: ArenaMobileDrawerProps) {
  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <HistoryOutlined className="text-teal-500" />
          任务列表
        </span>
      }
      placement="left"
      width={320}
      styles={{
        body: { padding: 16 },
      }}
      open={open}
      onClose={onClose}
      className="lg:hidden"
    >
      <TaskSidebar
        className="h-full"
        disabled={isLoading}
        onAfterSelect={onClose}
      />
    </Drawer>
  )
}

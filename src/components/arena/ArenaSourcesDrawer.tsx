/**
 * ArenaSourcesDrawer - 引用来源面板抽屉组件
 */

import { Drawer, Tabs, Empty, Badge } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { CitationSourcesPanel } from '@/components/arena'
import { buildSourcesItemsFromAnswers } from '@/lib/citationSources'
import type { Answer } from '@/types/arena'
import type { ArenaSourcesTabKey } from '@/types/arenaUi'

interface ArenaSourcesDrawerProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 回答列表 */
  answers: Answer[]
  /** 引用总数 */
  citationsCount: number
  /** 当前选中的 Tab */
  activeTab: ArenaSourcesTabKey
  /** Tab 变更回调 */
  onTabChange: (tab: ArenaSourcesTabKey) => void
}

/**
 * 引用来源面板抽屉组件
 */
export function ArenaSourcesDrawer({
  open,
  onClose,
  answers,
  citationsCount,
  activeTab,
  onTabChange,
}: ArenaSourcesDrawerProps) {
  const handleClickItem = (item: { url?: string }) => {
    if (!item.url) return
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <FileTextOutlined className="text-teal-500" />
          引用来源面板
          <Badge count={citationsCount} size="small" color="#14b8a6" />
        </span>
      }
      placement="right"
      width={480}
      styles={{
        body: { padding: 16 },
      }}
      open={open}
      onClose={onClose}
    >
      {citationsCount === 0 ? (
        <Empty description="暂无引用来源" />
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={[
            {
              key: 'all',
              label: '全部',
              children: (
                <CitationSourcesPanel
                  items={buildSourcesItemsFromAnswers(answers)}
                  onClickItem={handleClickItem}
                />
              ),
            },
            ...Array.from(new Set(answers.map((a) => a.providerId))).map((providerId) => ({
              key: providerId,
              label: `模型 ${providerId}`,
              children: (
                <CitationSourcesPanel
                  items={buildSourcesItemsFromAnswers(answers, providerId)}
                  onClickItem={handleClickItem}
                />
              ),
            })),
          ]}
        />
      )}
    </Drawer>
  )
}

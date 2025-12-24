// CitationSourcesPanel - 引用来源面板（使用 @ant-design/x Sources）

import type { ReactNode } from 'react'
import { Sources, type SourcesProps } from '@ant-design/x'
import type { SourcesItem } from '@/types/antdx'

interface CitationSourcesPanelProps {
  items: SourcesItem[]
  title?: ReactNode
  activeKey?: SourcesProps['activeKey']
  expanded?: SourcesProps['expanded']
  onExpand?: SourcesProps['onExpand']
  onClickItem?: (item: SourcesItem) => void
}

export function CitationSourcesPanel({
  items,
  title = '引用来源',
  activeKey,
  expanded,
  onExpand,
  onClickItem,
}: CitationSourcesPanelProps) {
  return (
    <Sources
      title={title}
      items={items}
      activeKey={activeKey}
      expanded={expanded}
      onExpand={onExpand}
      onClick={(item) => onClickItem?.(item)}
      popoverOverlayWidth={420}
    />
  )
}

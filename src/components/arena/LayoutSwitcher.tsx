// LayoutSwitcher - 布局切换组件

import { Segmented } from 'antd'
import {
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  FolderOutlined,
} from '@ant-design/icons'

import type { LayoutMode } from '@/types/arenaUi'
export type { LayoutMode } from '@/types/arenaUi'

interface LayoutSwitcherProps {
  value: LayoutMode
  onChange: (mode: LayoutMode) => void
}

const layoutOptions = [
  {
    value: 'four-col' as const,
    icon: <AppstoreOutlined />,
    label: '4列',
  },
  {
    value: 'two-col' as const,
    icon: <TableOutlined />,
    label: '2列',
  },
  {
    value: 'one-col' as const,
    icon: <UnorderedListOutlined />,
    label: '1列',
  },
  {
    value: 'tabs' as const,
    icon: <FolderOutlined />,
    label: 'Tabs',
  },
]

export function LayoutSwitcher({ value, onChange }: LayoutSwitcherProps) {
  return (
    <Segmented
      value={value}
      onChange={(val) => onChange(val as LayoutMode)}
      className="!bg-slate-100/80 !rounded !p-1"
      options={layoutOptions.map((opt) => ({
        value: opt.value,
        label: (
          <span className="inline-flex items-center gap-1.5 px-1">
            <span className="text-sm flex items-center">{opt.icon}</span>
            <span className="hidden sm:inline text-xs">{opt.label}</span>
          </span>
        ),
      }))}
    />
  )
}

// LayoutSwitcher - 布局切换组件

import { Segmented, Tooltip } from 'antd'
import {
  AppstoreOutlined,
  TableOutlined,
  UnorderedListOutlined,
  FolderOutlined,
} from '@ant-design/icons'

export type LayoutMode = 'four-col' | 'two-col' | 'one-col' | 'tabs'

interface LayoutSwitcherProps {
  value: LayoutMode
  onChange: (mode: LayoutMode) => void
}

const layoutOptions = [
  {
    value: 'four-col' as const,
    icon: <AppstoreOutlined />,
    label: '4列',
    tooltip: '四列网格布局',
  },
  {
    value: 'two-col' as const,
    icon: <TableOutlined />,
    label: '2列',
    tooltip: '双列网格布局',
  },
  {
    value: 'one-col' as const,
    icon: <UnorderedListOutlined />,
    label: '1列',
    tooltip: '单列列表布局',
  },
  {
    value: 'tabs' as const,
    icon: <FolderOutlined />,
    label: 'Tabs',
    tooltip: '标签页切换',
  },
]

export function LayoutSwitcher({ value, onChange }: LayoutSwitcherProps) {
  return (
    <Segmented
      value={value}
      onChange={(val) => onChange(val as LayoutMode)}
      className="!bg-slate-100/80 !rounded-xl !p-1"
      options={layoutOptions.map((opt) => ({
        value: opt.value,
        label: (
          <Tooltip title={opt.tooltip} placement="bottom">
            <span className="flex items-center gap-1.5 px-1">
              {opt.icon}
              <span className="hidden sm:inline text-xs">{opt.label}</span>
            </span>
          </Tooltip>
        ),
      }))}
    />
  )
}

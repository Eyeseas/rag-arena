// antdx - @ant-design/x 衍生类型（用于补齐未导出的类型）

import type { Key, ReactNode } from 'react'

export interface SourcesItem {
  key?: Key
  title: ReactNode
  url?: string
  icon?: ReactNode
  description?: ReactNode
}


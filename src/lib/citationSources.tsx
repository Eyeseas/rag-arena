// citationSources - 引用来源聚合工具（供面板/组件复用）

import { FileTextOutlined } from '@ant-design/icons'
import type { Answer, Citation } from '@/types/arena'
import type { SourcesItem } from '@/types/antdx'

function toSourcesItem(citation: Citation): SourcesItem {
  return {
    key: citation.id,
    title: citation.summary || '未命名来源',
    url: undefined, // 新接口中没有 URL 字段
    icon: <FileTextOutlined />,
    description: citation.summary,
  }
}

export function buildSourcesItemsFromAnswers(answers: Answer[], providerId?: string) {
  const items: SourcesItem[] = []

  for (const answer of answers) {
    if (providerId && answer.providerId !== providerId) continue
    for (const citation of answer.citations || []) {
      items.push(toSourcesItem(citation))
    }
  }

  return items
}

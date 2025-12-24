// citationSources - 引用来源聚合工具（供面板/组件复用）

import type { ReactNode } from 'react'
import {
  ApiOutlined,
  DatabaseOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import type { Answer, Citation } from '@/types/arena'
import type { SourcesItem } from '@/types/antdx'

const docTypeIcon: Record<string, ReactNode> = {
  pdf: <FilePdfOutlined />,
  webpage: <GlobalOutlined />,
  database: <DatabaseOutlined />,
  api: <ApiOutlined />,
  file: <FileOutlined />,
  other: <FileTextOutlined />,
}

function toSourcesItem(citation: Citation): SourcesItem {
  const docType = citation.docType || 'other'
  return {
    key: citation.id,
    title: citation.title || '未命名来源',
    url: citation.source,
    icon: docTypeIcon[docType] || docTypeIcon.other,
    description: citation.content,
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

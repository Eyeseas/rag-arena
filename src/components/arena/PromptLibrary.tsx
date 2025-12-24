// PromptLibrary - Prompt 库面板（使用 @ant-design/x Prompts）

import type { ReactNode } from 'react'
import { Prompts, type PromptsItemType } from '@ant-design/x'
import { Card } from 'antd'
import {
  FileSearchOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import clsx from 'clsx'
import { ARENA_PROMPT_TEMPLATES, getPromptTextByKey } from '@/lib/prompts'

interface PromptLibraryProps {
  className?: string
  disabled?: boolean
  onPick: (text: string) => void
  onAfterPick?: () => void
}

const iconByKey: Record<string, ReactNode> = {
  'rag.citations.extract': <FileSearchOutlined />,
  'rag.citations.verify': <SafetyCertificateOutlined />,
  'rag.compare.4models': <BarChartOutlined />,
  'rag.summarize.actionable': <CheckSquareOutlined />,
  'rag.write.dashboard_spec': <FileTextOutlined />,
}

function buildPromptItems(): PromptsItemType[] {
  const grouped = new Map<string, PromptsItemType>()

  for (const prompt of ARENA_PROMPT_TEMPLATES) {
    const groupKey = `group:${prompt.group}`
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        key: groupKey,
        label: prompt.group,
        children: [],
      })
    }

    grouped.get(groupKey)!.children!.push({
      key: prompt.key,
      label: prompt.title,
      description: prompt.description,
      icon: iconByKey[prompt.key],
    })
  }

  return Array.from(grouped.values())
}

export function PromptLibrary({
  className,
  disabled = false,
  onPick,
  onAfterPick,
}: PromptLibraryProps) {
  const items = buildPromptItems()

  return (
    <Card
      size="small"
      title="Prompt 库"
      className={clsx('h-full', className)}
      bodyStyle={{ padding: 8, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex-1 overflow-auto">
        <Prompts
          items={items}
          vertical
          wrap={false}
          fadeIn
          onItemClick={({ data }) => {
            if (disabled) return
            const text = getPromptTextByKey(data.key)
            if (!text) return
            onPick(text)
            onAfterPick?.()
          }}
        />
      </div>
    </Card>
  )
}

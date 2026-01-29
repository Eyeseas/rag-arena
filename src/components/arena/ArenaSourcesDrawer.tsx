import { useState, useMemo } from 'react'
import { Drawer, Tabs, Empty, Badge } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { CitationCard } from './CitationCard'
import { CitationDetailDrawer } from './CitationDetailDrawer'
import type { Answer, Citation } from '@/types/arena'
import type { ArenaSourcesTabKey } from '@/types/arenaUi'

interface CitationWithSource {
  citation: Citation
  priId: string
}

interface ArenaSourcesDrawerProps {
  open: boolean
  onClose: () => void
  answers: Answer[]
  citationsCount: number
  activeTab: ArenaSourcesTabKey
  onTabChange: (tab: ArenaSourcesTabKey) => void
}

export function ArenaSourcesDrawer({
  open,
  onClose,
  answers,
  citationsCount,
  activeTab,
  onTabChange,
}: ArenaSourcesDrawerProps) {
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [selectedPriId, setSelectedPriId] = useState<string | null>(null)

  const allCitationsWithSource = useMemo(() => {
    const result: CitationWithSource[] = []
    for (const answer of answers) {
      for (const citation of answer.citations || []) {
        result.push({ citation, priId: answer.id })
      }
    }
    return result
  }, [answers])

  const citationsByProvider = useMemo(() => {
    const map = new Map<string, CitationWithSource[]>()
    for (const answer of answers) {
      const list = map.get(answer.providerId) || []
      for (const citation of answer.citations || []) {
        list.push({ citation, priId: answer.id })
      }
      map.set(answer.providerId, list)
    }
    return map
  }, [answers])

  const providerIds = useMemo(() => {
    return Array.from(new Set(answers.map((a) => a.providerId)))
  }, [answers])

  const handleCitationClick = (citation: Citation, priId: string) => {
    setSelectedCitation(citation)
    setSelectedPriId(priId)
    setDetailDrawerOpen(true)
  }

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false)
    setSelectedCitation(null)
    setSelectedPriId(null)
  }

  const renderCitationList = (items: CitationWithSource[]) => {
    if (items.length === 0) {
      return <Empty description="暂无引用来源" />
    }
    return (
      <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
        {items.map((item, index) => (
          <CitationCard
            key={item.citation.id}
            citation={item.citation}
            index={index}
            onClick={() => handleCitationClick(item.citation, item.priId)}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <Drawer
        title={
          <span className="flex items-center gap-2">
            <FileTextOutlined className="text-teal-500" />
            引用来源面板
            <Badge count={citationsCount} size="small" color="#14b8a6" showZero />
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
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={[
            {
              key: 'all',
              label: `全部 (${citationsCount})`,
              children: renderCitationList(allCitationsWithSource),
            },
            ...providerIds.map((providerId) => {
              const providerCitations = citationsByProvider.get(providerId) || []
              return {
                key: providerId,
                label: `模型 ${providerId} (${providerCitations.length})`,
                children: renderCitationList(providerCitations),
              }
            }),
          ]}
        />
      </Drawer>

      <CitationDetailDrawer
        open={detailDrawerOpen}
        citation={selectedCitation}
        priId={selectedPriId}
        onClose={handleCloseDetailDrawer}
      />
    </>
  )
}

import { DownOutlined } from '@ant-design/icons'

import type { Citation } from '@/types/arena'

import { CitationCard } from './CitationCard'

interface AnswerCardCitationsProps {
  citations: Citation[]
  expanded: boolean
  onToggleExpanded: () => void
  onCitationClick: (citation: Citation) => void
}

export function AnswerCardCitations({
  citations,
  expanded,
  onToggleExpanded,
  onCitationClick,
}: AnswerCardCitationsProps) {
  return (
    <div className="mt-4 pt-3 border-t border-slate-200">
      <button
        onClick={onToggleExpanded}
        className="flex items-center gap-2 w-full mb-2 text-left cursor-pointer hover:text-slate-900 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">参考来源</span>
        <span className="text-xs text-slate-500">({citations.length})</span>
        <DownOutlined
          className={`text-xs text-slate-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
          {citations.map((citation, index) => (
            <CitationCard
              key={citation.id}
              citation={citation}
              index={index}
              onClick={onCitationClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

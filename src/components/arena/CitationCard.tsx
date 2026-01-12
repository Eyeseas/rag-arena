// CitationCard - 引用摘要卡片组件（传统学术引用风格）

import { CalendarOutlined, ClockCircleOutlined, PhoneOutlined, ArrowRightOutlined } from '@ant-design/icons'
import type { Citation } from '@/types/arena'

interface CitationCardProps {
  /** 引用数据 */
  citation: Citation
  /** 序号 */
  index: number
  /** 点击回调 */
  onClick?: (citation: Citation) => void
}

// 格式化时长（秒转为分钟:秒）
function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化日期（只显示日期部分）
function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

// 根据关联度获取样式配置
function getRelevanceStyle(relevance: number) {
  if (relevance >= 80) {
    // 高关联度：绿色系
    return {
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      shadow: 'shadow-sm shadow-emerald-500/10',
    }
  } else if (relevance >= 50) {
    // 中等关联度：黄色/橙色系
    return {
      bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      shadow: 'shadow-sm shadow-amber-500/10',
    }
  } else {
    // 低关联度：灰色系
    return {
      bg: 'bg-gradient-to-r from-slate-50 to-gray-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
      shadow: 'shadow-sm shadow-slate-500/5',
    }
  }
}

export function CitationCard({ citation, index, onClick }: CitationCardProps) {
  const labels = citation.labels?.split('|').filter(Boolean) || []
  const formattedDuration = formatDuration(citation.duration)
  const formattedDate = formatDate(citation.start_time)
  // 兼容性处理：如果没有summary但有其他字段，显示占位符
  const summary = citation.summary || '无标题引用'
  
  // 获取关联度样式
  const relevanceStyle = citation.relevance !== undefined 
    ? getRelevanceStyle(citation.relevance)
    : null

  const handleClick = () => {
    onClick?.(citation)
  }

  return (
    <div 
      className={`py-2 border-b border-slate-100 last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-slate-50 transition-colors duration-200 rounded px-2 -mx-2 -my-1 my-1 hover:shadow-sm' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2.5">
        {/* 序号 */}
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        
        <div className="flex-1 min-w-0">
          {/* 标题行：标题 + 关联度 */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="text-sm text-slate-900 leading-relaxed line-clamp-2 flex-1 min-w-0">
              {summary}
            </div>
            {citation.relevance !== undefined && relevanceStyle && (
              <span 
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded ${relevanceStyle.bg} ${relevanceStyle.border} ${relevanceStyle.text} ${relevanceStyle.shadow} border text-[11px] font-semibold transition-all duration-200`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {citation.relevance}%
              </span>
            )}
          </div>

          {/* 元信息行：时间、时长、号码 */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
            {/* 日期 */}
            {formattedDate && (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <CalendarOutlined className="text-[10px] text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            )}
            
            {/* 时长 */}
            {formattedDuration && (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <ClockCircleOutlined className="text-[10px] text-slate-400" />
                <span>{formattedDuration}</span>
              </span>
            )}
            
            {/* 主号码 */}
            {citation.callnumber && (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <PhoneOutlined className="text-[10px] text-slate-400" />
                <span className="font-mono">{citation.callnumber}</span>
              </span>
            )}
            
            {/* 被号码 */}
            {citation.callednumber && (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <ArrowRightOutlined className="text-[10px] text-slate-400" />
                <span className="font-mono">{citation.callednumber}</span>
              </span>
            )}
          </div>

          {/* 标签 */}
          {labels.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {labels.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CitationListProps {
  /** 引用列表 */
  citations: Citation[]
}

export function CitationList({ citations }: CitationListProps) {
  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <div className="mt-4 pt-3 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-700">
          参考来源
        </span>
        <span className="text-xs text-slate-500">
          ({citations.length})
        </span>
      </div>
      <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
        {citations.map((citation, index) => (
          <CitationCard key={citation.id} citation={citation} index={index} />
        ))}
      </div>
    </div>
  )
}

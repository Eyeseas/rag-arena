import { Typography, Tag } from 'antd'
import { FileTextOutlined, BulbOutlined, UserOutlined, BankOutlined, CalendarOutlined } from '@ant-design/icons'
import type { CitationDetail } from '@/types/arena'

const { Title, Paragraph, Text } = Typography

interface CitationAnalysisPanelProps {
  summary?: string
  keyElements?: CitationDetail['key_elements']
}

export function CitationAnalysisPanel({ summary, keyElements }: CitationAnalysisPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 border-l border-slate-200 pl-6">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {/* 摘要 */}
        <div>
          <Title level={5} className="mb-3 flex items-center gap-2">
            <FileTextOutlined />
            摘要
          </Title>
          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <Paragraph className="mb-0 text-sm text-slate-700 leading-relaxed">
              {summary || '暂无摘要'}
            </Paragraph>
          </div>
        </div>

        {/* 要素提取 */}
        {keyElements && (
          <div>
            <Title level={5} className="mb-4 flex items-center gap-2">
              <BulbOutlined className="text-amber-500" />
              要素提取
            </Title>
            <div className="space-y-3">
              {keyElements.persons && keyElements.persons.length > 0 && (
                <div className="group p-3.5 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-200/60 hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <UserOutlined className="text-white text-xs" />
                    </div>
                    <Text strong className="text-sm text-slate-800">
                      人物
                    </Text>
                    <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {keyElements.persons.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keyElements.persons.map((person, i) => (
                      <Tag
                        key={i}
                        color="purple"
                        className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-purple-300/50 hover:!border-purple-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                      >
                        {person}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {keyElements.organizations && keyElements.organizations.length > 0 && (
                <div className="group p-3.5 bg-gradient-to-br from-cyan-50 to-cyan-50/50 rounded-lg border border-cyan-200/60 hover:border-cyan-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                      <BankOutlined className="text-white text-xs" />
                    </div>
                    <Text strong className="text-sm text-slate-800">
                      组织
                    </Text>
                    <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {keyElements.organizations.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keyElements.organizations.map((org, i) => (
                      <Tag
                        key={i}
                        color="cyan"
                        className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-cyan-300/50 hover:!border-cyan-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                      >
                        {org}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {keyElements.events && keyElements.events.length > 0 && (
                <div className="group p-3.5 bg-gradient-to-br from-orange-50 to-orange-50/50 rounded-lg border border-orange-200/60 hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                      <CalendarOutlined className="text-white text-xs" />
                    </div>
                    <Text strong className="text-sm text-slate-800">
                      事件
                    </Text>
                    <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {keyElements.events.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keyElements.events.map((event, i) => (
                      <Tag
                        key={i}
                        color="orange"
                        className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-orange-300/50 hover:!border-orange-400 hover:!shadow-sm transition-all duration-200 cursor-default"
                      >
                        {event}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {keyElements.others && keyElements.others.length > 0 && (
                <div className="group p-3.5 bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-lg border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                      <BulbOutlined className="text-white text-xs" />
                    </div>
                    <Text strong className="text-sm text-slate-800">
                      其他
                    </Text>
                    <span className="ml-auto text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full">
                      {keyElements.others.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keyElements.others.map((other, i) => (
                      <Tag
                        key={i}
                        className="m-0 !px-2.5 !py-1 !text-xs !rounded-md !border-slate-300/50 hover:!border-slate-400 hover:!shadow-sm transition-all duration-200 cursor-default !bg-white !text-slate-700"
                      >
                        {other}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

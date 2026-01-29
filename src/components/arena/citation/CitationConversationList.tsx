import { Typography, Tooltip, Empty } from 'antd'
import { FileTextOutlined, PhoneOutlined, CustomerServiceOutlined ,UserOutlined} from '@ant-design/icons'
import { formatTimePoint } from './utils'

const { Title } = Typography

interface CitationConversationListProps {
  content?: string
}

export function CitationConversationList({ content }: CitationConversationListProps) {
  // 解析 JSON 字符串内容
  const parseContent = (contentStr?: string) => {
    if (!contentStr) return []
    try {
      const parsed = JSON.parse(contentStr)
      return Array.isArray(parsed) ? parsed : [{ text: contentStr, time: 0 }]
    } catch {
      return [{ text: contentStr, time: 0 }]
    }
  }

  const contentItems = parseContent(content)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Title level={5} className="mb-3 flex items-center gap-2 flex-shrink-0">
        <FileTextOutlined />
        原始材料
      </Title>
      <div className="flex-1 overflow-y-auto pr-2">
        {contentItems.length > 0 ? (
          <div className="space-y-3">
            {contentItems.map((item: { role?: string; callnumber?: string; caller?: string; caller_number?: string; callednumber?: string; called?: string; called_number?: string; text?: string; content?: string; speech?: string; time?: number }, index: number) => {
              // 解析对话内容：支持 role 字段或根据 callnumber/callednumber 判断
              let role = item.role
              if (!role) {
                // 尝试从 item 中提取角色信息
                if (item.callnumber || item.caller || item.caller_number) {
                  role = 'caller'
                } else if (item.callednumber || item.called || item.called_number) {
                  role = 'called'
                } else {
                  // 默认交替显示
                  role = index % 2 === 0 ? 'caller' : 'called'
                }
              }
              const isCaller = role === 'caller' || role === '主' || role === 'caller_number'
              const textContent = item.text || item.content || item.speech
              const text = typeof textContent === 'string' ? textContent : String(textContent || '')

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${isCaller ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* 头像和时间 */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                        isCaller
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                      }`}
                    >
                      <UserOutlined />
                    </div>
                    {/* 时间小标识 - 统一放在头像下方 */}
                    {item.time !== undefined && (
                      <Tooltip title={formatTimePoint(item.time)}>
                        <span className="text-[10px] text-slate-400 cursor-help">
                          {formatTimePoint(item.time)}
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex-1 min-w-0 ${isCaller ? '' : 'flex justify-end'}`}>
                    <div
                      className={`inline-block max-w-[75%] px-3 py-2 rounded transition-all duration-200 hover:shadow-sm text-left ${
                        isCaller
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words text-left">
                        {text}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty description="暂无对话内容" />
        )}
      </div>
    </div>
  )
}

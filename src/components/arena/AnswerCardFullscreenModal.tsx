import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Collapse, Input, Modal, Spin } from 'antd'
import { RobotOutlined, SendOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import { Think } from '@ant-design/x'

import type { Answer, Citation } from '@/types/arena'
import type { FollowUpChatMessage } from '@/types/arenaUi'

import type { ProviderVisualConfig } from './AnswerCardProviderConfig'
import { CitationCard } from './CitationCard'

interface AnswerCardFullscreenModalProps {
  open: boolean
  onClose: () => void
  answer: Answer
  config: ProviderVisualConfig

  chatMessages: FollowUpChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  chatLoading: boolean
  hasAskedFollowUp: boolean
  onSendMessage: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void

  onCitationClick: (citation: Citation) => void
}

export function AnswerCardFullscreenModal({
  open,
  onClose,
  answer,
  config,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  hasAskedFollowUp,
  onSendMessage,
  onKeyDown,
  onCitationClick,
}: AnswerCardFullscreenModalProps) {
  const hasCitations = answer.citations && answer.citations.length > 0
  const hasError = Boolean(answer.error)
  const hasContent = answer.content.length > 0

  // 初始回答的参考来源折叠状态（默认展开）
  const [initialCitationsExpanded, setInitialCitationsExpanded] = useState<string[]>(['initial'])

  // 对话区域自动滚动到底部
  const chatContentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
    }
  }, [chatMessages, answer.content])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20, maxWidth: 1200 }}
      styles={{
        body: {
          height: 'calc(90vh - 55px)',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      title={
        <div className="flex items-center gap-3">
          <div
            className={
              `w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} ` +
              'flex items-center justify-center shadow-md text-white font-bold text-lg'
            }
          >
            {answer.providerId}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-700 font-semibold">模型 {answer.providerId}</span>
            <span className="text-xs text-slate-500">全屏查看 · 支持追问</span>
          </div>
        </div>
      }
      destroyOnClose
    >
      <div className="flex flex-col h-full">
        <div ref={chatContentRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={
                  `w-8 h-8 rounded bg-gradient-to-br ${config.gradient} ` +
                  'flex items-center justify-center shadow-sm text-white text-sm'
                }
              >
                <RobotOutlined />
              </div>
              <span className="text-sm font-medium text-slate-600">初始回答</span>
            </div>

            {hasError && (
              <Alert
                type="error"
                showIcon
                message="生成失败"
                description={answer.error}
                className="mb-3 !rounded"
              />
            )}
            {hasContent && (
              <XMarkdown
                className="x-markdown-light prose prose-slate prose-sm max-w-none"
                content={answer.content}
                components={{
                  think: ({ children }) => <Think title="深度思考">{children}</Think>,
                }}
              />
            )}
          </div>

          {hasCitations && (
            <Collapse
              activeKey={initialCitationsExpanded}
              onChange={(keys) => setInitialCitationsExpanded(keys as string[])}
              className="!border-0 !bg-transparent"
              items={[
                {
                  key: 'initial',
                  label: (
                    <div className="flex items-center gap-2">
                      <FileTextOutlined className="text-teal-500" />
                      <span className="text-sm font-medium text-slate-700">参考来源</span>
                      <span className="text-xs text-slate-500">({answer.citations!.length})</span>
                    </div>
                  ),
                  children: (
                    <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
                      {answer.citations!.map((citation, index) => (
                        <CitationCard
                          key={citation.id}
                          citation={citation}
                          index={index}
                          onClick={onCitationClick}
                        />
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={
                'p-5 rounded-md ' +
                (msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 ml-12'
                  : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200 mr-12')
              }
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={
                    'w-8 h-8 rounded flex items-center justify-center shadow-sm text-white text-sm ' +
                    (msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                      : `bg-gradient-to-br ${config.gradient}`)
                  }
                >
                  {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {msg.role === 'user' ? '您的追问' : `模型 ${answer.providerId} 回复`}
                </span>
              </div>
              <XMarkdown
                className="x-markdown-light prose prose-slate prose-sm max-w-none"
                content={msg.content}
                components={{
                  think: ({ children }) => <Think title="深度思考">{children}</Think>,
                }}
              />
              {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                <Collapse
                  defaultActiveKey={[]}
                  className="!border-0 !bg-transparent mt-4"
                  items={[
                    {
                      key: msg.id,
                      label: (
                        <div className="flex items-center gap-2">
                          <FileTextOutlined className="text-teal-500" />
                          <span className="text-sm font-medium text-slate-700">参考来源</span>
                          <span className="text-xs text-slate-500">({msg.citations.length})</span>
                        </div>
                      ),
                      children: (
                        <div className="bg-slate-50/50 rounded px-3 py-2 border border-slate-100">
                          {msg.citations.map((citation, index) => (
                            <CitationCard
                              key={citation.id}
                              citation={citation}
                              index={index}
                              onClick={onCitationClick}
                            />
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-3 p-5 bg-gradient-to-br from-slate-50 to-white rounded-md border border-slate-100 mr-12">
              <Spin size="small" />
              <span className="text-slate-600 text-sm">模型 {answer.providerId} 正在思考...</span>
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              ⚠️ 内容由 AI 生成，可能存在错误，请自行核实相关信息
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          {hasAskedFollowUp && !chatLoading ? (
            <div className="text-center py-3">
              <p className="text-slate-600 text-sm">您已完成一次追问，每个模型仅支持追问一次</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <Input.TextArea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`继续向模型 ${answer.providerId} 提问...`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="!rounded !border-slate-200 focus:!border-teal-400 !py-3 !px-4 !text-sm"
                  disabled={chatLoading}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={onSendMessage}
                  loading={chatLoading}
                  disabled={!chatInput.trim()}
                  className="!h-11 !px-5 !rounded !bg-gradient-to-r !from-teal-500 !to-emerald-500 !border-0 hover:!from-teal-600 hover:!to-emerald-600"
                >
                  发送
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500 text-center">按 Enter 发送，Shift + Enter 换行（仅可追问一次）</p>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

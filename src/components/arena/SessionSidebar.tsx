// SessionSidebar - 历史会话侧边栏（使用 @ant-design/x Conversations）

import type { CSSProperties } from 'react'
import { Conversations, type ConversationItemType } from '@ant-design/x'
import { Card, Modal, Empty, Badge } from 'antd'
import { MessageOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons'
import clsx from 'clsx'
import { useArenaStore } from '@/stores/arena'

interface SessionSidebarProps {
  className?: string
  style?: CSSProperties
  /** 禁用交互（例如流式生成中避免跨会话串写） */
  disabled?: boolean
  /** 选中会话后回调（如用于关闭移动端抽屉） */
  onAfterSelect?: () => void
}

export function SessionSidebar({
  className,
  style,
  disabled = false,
  onAfterSelect,
}: SessionSidebarProps) {
  const sessions = useArenaStore((s) => s.sessions)
  const activeSessionId = useArenaStore((s) => s.activeSessionId)
  const startNewSession = useArenaStore((s) => s.startNewSession)
  const setActiveSessionId = useArenaStore((s) => s.setActiveSessionId)
  const deleteSession = useArenaStore((s) => s.deleteSession)

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  const items: ConversationItemType[] = sortedSessions.map((s) => ({
    key: s.id,
    label: s.title || '新会话',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <MessageOutlined className="text-indigo-500 text-sm" />
      </div>
    ),
    disabled,
  }))

  const handleCreate = () => {
    if (disabled) return
    startNewSession()
    onAfterSelect?.()
  }

  const handleSelect = (sessionId: string) => {
    if (disabled) return
    setActiveSessionId(sessionId)
    onAfterSelect?.()
  }

  const handleDelete = (sessionId: string) => {
    if (disabled) return
    Modal.confirm({
      title: '删除会话',
      icon: <DeleteOutlined className="text-red-500" />,
      content: '删除后将无法恢复（仅影响本地浏览器）。确认删除？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteSession(sessionId),
    })
  }

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <HistoryOutlined className="text-white text-xs" />
          </div>
          <span className="font-semibold text-slate-700">历史会话</span>
          <Badge
            count={sessions.length}
            size="small"
            className="ml-auto"
            color="#6366f1"
          />
        </div>
      }
      className={clsx('glass-card !rounded-2xl overflow-hidden', className)}
      styles={{
        header: {
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '12px 16px',
        },
        body: {
          padding: 8,
          height: 'calc(100% - 56px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      style={style}
    >
      {sessions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无历史会话"
          className="my-8"
        />
      ) : (
        <div className="flex-1 overflow-auto">
          <Conversations
            items={items}
            activeKey={activeSessionId}
            onActiveChange={handleSelect}
            creation={{
              label: '新建会话',
              onClick: handleCreate,
              disabled,
            }}
            menu={(conversation) => ({
              items: [
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                  icon: <DeleteOutlined />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'delete') handleDelete(conversation.key)
              },
            })}
          />
        </div>
      )}
    </Card>
  )
}

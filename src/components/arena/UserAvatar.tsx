import { Avatar, Space, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'

const { Text } = Typography

const AVATAR_COLORS = [
  '#14b8a6',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  if (!name) return '?'
  
  const isChinese = /[\u4e00-\u9fa5]/.test(name)
  return isChinese ? name.charAt(0) : name.charAt(0).toUpperCase()
}

export function UserAvatar() {
  const user = useAuthStore((state) => state.user)
  
  if (!user) {
    return null
  }
  
  const initials = getInitials(user.name)
  const bgColor = getAvatarColor(user.name)
  
  return (
    <Space size={8} className="cursor-default select-none">
      <Avatar
        size={32}
        icon={!user.name ? <UserOutlined /> : undefined}
        style={{ 
          backgroundColor: bgColor,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {initials}
      </Avatar>
      <Text 
        className="text-slate-700 hidden sm:inline max-w-[120px] truncate"
        title={user.name}
      >
        {user.name}
      </Text>
    </Space>
  )
}

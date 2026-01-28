// UI-level types for the Arena feature.

export type LayoutMode = 'four-col' | 'two-col' | 'one-col' | 'tabs'

// Tabs in ArenaSourcesDrawer: "all" and per-provider tabs.
// Provider ids are currently modeled as string, so this stays flexible.
export type ArenaSourcesTabKey = 'all' | string

export interface FollowUpChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** 追问回答的参考来源（仅 assistant 消息有） */
  citations?: import('./arena').Citation[]
}

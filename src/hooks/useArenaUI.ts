import { useCallback, useState } from 'react'

import type { LayoutMode } from '@/components/arena'

export interface UseArenaUIReturn {
  layoutMode: LayoutMode
  setLayoutMode: (mode: LayoutMode) => void

  historyOpen: boolean
  openHistory: () => void
  closeHistory: () => void

  sourcesOpen: boolean
  sourcesTab: string
  setSourcesTab: (tab: string) => void
  openSources: (tab?: string) => void
  closeSources: () => void

  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

// Arena 页面本地 UI 状态（抽屉/布局/侧边栏等），与业务数据解耦。
export function useArenaUI(): UseArenaUIReturn {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('two-col')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [sourcesTab, setSourcesTab] = useState<string>('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const openHistory = useCallback(() => setHistoryOpen(true), [])
  const closeHistory = useCallback(() => setHistoryOpen(false), [])

  const openSources = useCallback((tab: string = 'all') => {
    setSourcesTab(tab)
    setSourcesOpen(true)
  }, [])

  const closeSources = useCallback(() => setSourcesOpen(false), [])

  return {
    layoutMode,
    setLayoutMode,

    historyOpen,
    openHistory,
    closeHistory,

    sourcesOpen,
    sourcesTab,
    setSourcesTab,
    openSources,
    closeSources,

    sidebarCollapsed,
    setSidebarCollapsed,
  }
}

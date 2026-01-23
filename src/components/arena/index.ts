// Arena 组件导出

export { QuestionInput } from './QuestionInput'
// DateRange 类型从 types/common 重新导出，保持向后兼容
export type { DateRange } from '@/types/common'
export { AnswerCard } from './AnswerCard'
export { AnswerGrid, AnswerGridSkeleton } from './AnswerGrid'
export { LayoutSwitcher } from './LayoutSwitcher'
// LayoutMode 类型从 types/arenaUi 重新导出，保持向后兼容
export type { LayoutMode } from '@/types/arenaUi'
export { CitationCard, CitationList } from './CitationCard'
export { TaskSidebar } from './TaskSidebar'
export { CitationSourcesPanel } from './CitationSourcesPanel'
export { HoldToConfirmButton } from './HoldToConfirmButton'
// VoteFeedbackModal 仅通过懒加载使用，不在此导出以保持代码分割

// Arena 页面子组件
export { ArenaHeader } from './ArenaHeader'
export { ArenaAnswerSection } from './ArenaAnswerSection'
export { ArenaMobileDrawer } from './ArenaMobileDrawer'
export { ArenaSourcesDrawer } from './ArenaSourcesDrawer'

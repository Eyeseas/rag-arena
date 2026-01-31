/**
 * @file Arena Store 状态与 Action 类型定义
 * @description 定义 Arena store 的状态结构和各个 slice 的 action 接口
 *
 * 采用 slice 模式组织 store，将状态和 action 按领域拆分：
 * - ArenaCoreState: 核心状态（任务、会话、加载状态等）
 * - ArenaHydrationSlice: 服务端数据水合相关 action
 * - ArenaTaskSlice: 任务管理相关 action
 * - ArenaSessionSlice: 会话管理相关 action
 * - ArenaAnswerSlice: 问答相关 action
 *
 * 保持此文件无实现代码，避免 slice 模块导入时产生循环依赖
 */

import type { Answer, CommonTreeDict, Task } from '@/types/arena'
import type { ArenaSession } from './arenaTypes'

/**
 * Arena 核心状态接口
 * 包含所有需要持久化和响应式更新的状态字段
 */
export interface ArenaCoreState {
  /** 任务列表，支持任务-会话两级结构 */
  tasks: Task[]

  /** 所有会话列表，通过 taskId 关联到对应任务 */
  sessions: ArenaSession[]

  /** 当前激活的任务 ID */
  activeTaskId: string

  /** 当前激活的会话 ID */
  activeSessionId: string

  /** 是否正在加载回答（流式响应中） */
  isLoading: boolean

  /** 是否正在提交投票 */
  isVoting: boolean

  /** 是否任务列表 */
  isTasksLoading: boolean

  /** 是否已从服务端获取过任务列表 */
  hasFetchedTasks: boolean

  /** 是否正在加载会话历史记录 */
  isLoadingHistory: boolean
}

/**
 * 服务端数据水合 Slice 接口
 * 处理从服务端获取数据后更新本地状态的逻辑
 */
export interface ArenaHydrationSlice {
  /**
   * 设置任务列表加载状态
   * @param loading - 是否正在加载
   */
  setTasksLoading: (loading: boolean) => void

  /**
   * 应用服务端返回的任务列表数据
   * 将树形结构转换为扁平的 tasks + sessions
   * @param data - 服务端返回的树形任务数据
   */
  applyTaskListFromServer: (data: CommonTreeDict[]) => void

  /**
   * 设置是否已获取任务列表标记
   * @param fetched - 是否已获取
   */
  setHasFetchedTasks: (fetched: boolean) => void

  /**
   * 设置会话的服务端信息
   * 用于将本地会话 ID 替换为服务端返回的会话 ID
   * @param params.localSessionId - 本地会话 ID
   * @param params.serverSessionId - 服务端会话 ID
   * @param params.priIdMapping - 模型掩码码到私有 ID 的映射
   */
  setSessionConversationInfo: (params: {
    localSessionId: string
    serverSessionId: string
    priIdMapping?: Record<string, string>
  }) => void
}

/**
 * 任务管理 Slice 接口
 * 处理任务的增删改查操作
 */
export interface ArenaTaskSlice {
  /**
   * 创建新任务
   * @param title - 任务标题，默认为"新任务"
   * @returns 新创建任务的 ID
   */
  createTask: (title?: string) => string

  /**
   * 删除任务及其下所有会话
   * @param taskId - 要删除的任务 ID
   */
  deleteTask: (taskId: string) => void

  /**
   * 重命名任务
   * @param taskId - 任务 ID
   * @param title - 新标题
   */
  renameTask: (taskId: string, title: string) => void

  /**
   * 切换任务的展开/折叠状态
   * @param taskId - 任务 ID
   */
  toggleTaskExpanded: (taskId: string) => void

  /**
   * 设置当前激活的任务
   * @param taskId - 任务 ID
   */
  setActiveTaskId: (taskId: string) => void
}

/**
 * 会话管理 Slice 接口
 * 处理会话的生命周期管理
 */
export interface ArenaSessionSlice {
  /**
   * 在当前任务下创建新会话
   * @returns 新会话的 ID
   */
  startNewSession: () => Promise<string>

  /**
   * 设置当前激活的会话
   * 同时会自动切换到该会话所属的任务
   * @param sessionId - 会话 ID
   */
  setActiveSessionId: (sessionId: string) => void

  /**
   * 删除会话
   * 如果删除的是当前任务下唯一的会话，会自动创建新会话
   * @param sessionId - 会话 ID
   */
  deleteSession: (sessionId: string) => void

  /**
   * 重命名会话
   * @param sessionId - 会话 ID
   * @param title - 新标题
   */
  renameSession: (sessionId: string, title: string) => void

  /**
   * 加载会话的历史记录
   * 从服务端获取该会话的问题和回答数据
   * @param sessionId - 会话 ID
   */
  loadSessionHistory: (sessionId: string) => Promise<void>
}

/**
 * 问答管理 Slice 接口
 * 处理问题提交、回答接收和投票等核心业务逻辑
 */
export interface ArenaAnswerSlice {
  /**
   * 使用问题开始会话
   * 如果当前会话已有内容，会创建新会话
   * @param question - 用户问题
   * @returns 会话 ID
   */
  startSessionWithQuestion: (question: string) => Promise<string>

  /**
   * 设置服务端返回的问题 ID
   * @param questionId - 问题 ID 或 null
   */
  setServerQuestionId: (questionId: string | null) => void

  /**
   * 设置当前会话的回答列表
   * @param answers - 回答数组
   */
  setAnswers: (answers: Answer[]) => void

  /**
   * 追加流式回答内容
   * 用于 SSE 流式响应时逐步更新回答内容
   * @param answerId - 回答 ID
   * @param delta - 增量内容
   */
  appendAnswerDelta: (answerId: string, delta: string) => void

  /**
   * 完成回答并更新最终状态
   * @param answerId - 回答 ID
   * @param patch - 要更新的字段
   */
  finalizeAnswer: (answerId: string, patch: Partial<Answer>) => void

  /**
   * 设置回答的错误信息
   * @param answerId - 回答 ID
   * @param message - 错误消息
   */
  setAnswerError: (answerId: string, message: string) => void

  /**
   * 设置加载状态
   * @param loading - 是否正在加载
   */
  setLoading: (loading: boolean) => void

  /**
   * 设置用户投票的回答 ID
   * @param answerId - 回答 ID 或 null（取消投票）
   */
  setVotedAnswerId: (answerId: string | null) => void

  /**
   * 设置投票提交状态
   * @param voting - 是否正在投票
   */
  setVoting: (voting: boolean) => void
}

/**
 * Arena Store 完整状态类型
 * 组合所有 slice 形成完整的 store 类型
 */
export type ArenaState =
  & ArenaCoreState
  & ArenaHydrationSlice
  & ArenaTaskSlice
  & ArenaSessionSlice
  & ArenaAnswerSlice

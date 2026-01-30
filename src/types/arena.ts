/**
 * Arena - RAG 问答竞技场类型定义
 *
 * 这些类型定义用于前后端接口对接，请确保与后端 API 保持一致
 */

// ============================================================================
// 任务 (Task) 相关类型
// ============================================================================

/**
 * 任务 - 会话的分组容器
 * 用于组织和管理多个相关会话
 */
export interface Task {
  /** 任务唯一标识 */
  id: string
  /** 任务标题 */
  title: string
  /** 创建时间（毫秒时间戳） */
  createdAt: number
  /** 更新时间（毫秒时间戳） */
  updatedAt: number
  /** 是否展开（UI 状态） */
  expanded: boolean
}

/**
 * 添加任务请求
 * 对应 API: POST /task/add
 */
export interface TaskAddRequest {
  /** 任务名称 */
  title?: string
  /** 任务描述 */
  description?: string
  /** 支撑单位 */
  supportUnit?: string
  /** 业务方向 */
  busDir?: string
  /** 工作目标 */
  workGoal?: string
}

/**
 * 添加任务响应
 * 对应 API: POST /task/add
 */
export interface TaskAddResponse {
  /** 响应码 */
  code: number
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: boolean
}

// ============================================================================
// 引用 (Citation) 相关类型
// ============================================================================

/**
 * 单个引用摘要
 * 表示回答中引用的外部文档或知识来源
 */
export interface Citation {
  /** 引用唯一标识 */
  id: string
  /** 引用的摘要内容 */
  summary: string
  /** 通话开始时间，格式yyyy-MM-dd HH:mm:ss */
  start_time?: string
  /** 通话时长，单位：秒 */
  duration?: number
  /** 主号码 */
  callnumber?: string
  /** 被号码 */
  callednumber?: string
  /** 相关度，0～100（可选） */
  relevance?: number
  /** 相关标签，用"|"分割（可选） */
  labels?: string
}

/**
 * 引用详情
 * 引用详情接口返回的完整信息
 * 
 * @remarks
 * 对应 API: GET /api/v1/reference/detail/{ref_id}
 */
export interface CitationDetail {
  /** 引用标识ID */
  ref_id: string
  /** 转写内容json数组的字符串化 */
  content: string
  /** 翻译内容数组的字符串化 */
  trans?: string
  /** 时间点，单位：秒 */
  time_point?: number
  /** 关键要素 */
  key_elements?: {
    /** 人物数组 */
    persons?: string[]
    /** 组织数组 */
    organizations?: string[]
    /** 事件数组 */
    events?: string[]
    /** 其余元素数组 */
    others?: string[]
  }
  /** 语音文件URL（可选） */
  file?: string
  /** 开始时间（可选），引用语音文件中开始时间，单位：秒 */
  begin_time?: number
  /** 结束时间（可选），引用语音文件中结束时间，单位：秒 */
  end_time?: number
}

// ============================================================================
// 回答 (Answer) 相关类型
// ============================================================================

/**
 * 单个回答
 * 表示某个 RAG 模型对问题的回答
 */
export interface Answer {
  /** 回答唯一标识 */
  id: string
  /** 回答内容 (支持 Markdown 格式) */
  content: string
  /** 供应商标识 (匿名，如 A/B/C/D) - 用于盲测投票 */
  providerId: string
  /** 引用摘要列表 (可选) - 回答中引用的文档来源 */
  citations?: Citation[]
  /** 错误信息 (可选) - 当该回答生成失败时的错误提示 */
  error?: string
  /** 是否已完成 (可选) - 用于区分流式生成中和历史会话已完成状态 */
  isComplete?: boolean
}

// ============================================================================
// 问答 (Arena) 相关类型
// ============================================================================

/**
 * 竞技场回答响应
 * 后端返回的完整问答结果
 * 
 * @remarks
 * 对应 API: POST /api/arena/ask
 */
export interface ArenaResponse {
  /** 问题 ID - 由后端生成的唯一标识 */
  questionId: string
  /** 原始问题 - 用户提交的问题文本 */
  question: string
  /** 回答列表 - 通常包含 4 个不同模型的回答 */
  answers: Answer[]
}

// ============================================================================
// 投票 (Vote) 相关类型
// ============================================================================

/**
 * 投票请求
 * 用户为某个回答投票时发送的请求
 * 
 * @remarks
 * 对应 API: GET /conv/like
 * 投票后不可取消
 */
export interface VoteRequest {
  /** 私有会话 ID - 根据会话ID计算来的唯一ID */
  priId: string
}

/**
 * 投票响应
 * 投票操作的结果
 */
export interface VoteResponse {
  /** 是否成功 */
  success: boolean
  /** 错误信息 (可选) - 投票失败时的错误提示 */
  message?: string
}

/**
 * 投票反馈原因
 * 用于标记回答或引用的问题类型
 */
export type VoteFeedbackReason =
  | 'SLOW_RESPONSE'                    // 响应速度太慢
  | 'IRRELEVANT_DIALOGUE'              // 存在无关话单
  | 'HALLUCINATION'                    // 存在编造内容
  | 'CITATION_SUMMARY_INACCURATE'      // 摘要不够准确
  | 'KEY_CONTENT_LOCATE_INACCURATE'    // 关键内容定位不够准确

/**
 * 投票反馈数据
 * 用户对回答的问题反馈
 */
export interface VoteFeedbackData {
  /** 回答质量问题 */
  answerIssues: VoteFeedbackReason[]
  /** 引用质量问题 */
  citationIssues: VoteFeedbackReason[]
}

/**
 * 提交投票反馈请求
 * 对应 API: POST /api/arena/vote/feedback
 */
export interface SubmitVoteFeedbackRequest {
  /** 问题 ID */
  questionId: string
  /** 回答 ID */
  answerId: string
  /** 反馈原因列表 */
  reasons: VoteFeedbackReason[]
}

/**
 * 提交投票反馈响应
 */
export interface SubmitVoteFeedbackResponse {
  /** 是否成功 */
  success: boolean
  /** 错误信息 (可选) */
  message?: string
}

// ============================================================================
// 统计 (Stats) 相关类型
// ============================================================================

/**
 * 统计数据响应
 * 各个模型/提供商的投票统计
 * 
 * @remarks
 * 对应 API: GET /api/arena/stats
 * 
 * key: 提供商标识 (如 'openai', 'deepseek', 'claude', 'gemini')
 * value: 投票数量
 * 
 * @example
 * ```ts
 * const stats: StatsResponse = {
 *   openai: 150,
 *   deepseek: 120,
 *   claude: 80,
 *   gemini: 50,
 * }
 * ```
 */
export type StatsResponse = Record<string, number>

// ============================================================================
// 请求参数类型 (用于真实接口对接)
// ============================================================================

/**
 * 提问请求参数
 * 用于 POST /api/arena/ask 接口
 */
export interface AskRequest {
  /** 用户问题 */
  question: string
  /** 开始日期 (可选) - ISO 8601 格式 */
  startDate?: string
  /** 结束日期 (可选) - ISO 8601 格式 */
  endDate?: string
}

/**
 * 流式提问请求参数
 * 用于 POST /api/arena/ask?stream=1 接口
 */
export interface AskStreamRequest extends AskRequest {
  /** 是否启用流式响应 (query param) */
  stream?: boolean
}

// ============================================================================
// 任务列表相关类型
// ============================================================================

/**
 * 通用树形字典（任务列表接口返回的数据结构）
 */
export interface CommonTreeDict {
  /** 任务ID或会话ID */
  id: string
  /** 任务名称或会话名称 */
  val: string
  /** 是否为叶子节点（false=任务, true=会话） */
  leaf: boolean
  /** 子节点（任务的会话列表） */
  children?: CommonTreeDict[]
}

/**
 * 任务列表响应
 * 对应 API: GET /task/list
 */
export interface TaskListResponse {
  /** 响应码 */
  code: number
  /** 响应消息 */
  msg: string
  /** 任务列表数据 */
  data: CommonTreeDict[]
}

// ============================================================================
// 会话相关类型
// ============================================================================

/**
 * 聊天消息
 */
export interface ChatMessage {
  /** 角色 */
  role: string
  /** 内容 */
  content: string
}

/**
 * 创建对话请求
 * 对应 API: POST /conv/create
 */
export interface CreateConversationRequest {
  /** 任务ID */
  taskId: string
  /** 私有ID（可选） */
  priId?: string
  /** 消息列表（可选） */
  messages?: ChatMessage[]
  /** 会话ID（可选） */
  session_id?: string
  /** 开始时间（可选） */
  start_time?: string
  /** 结束时间（可选） */
  end_time?: string
}

/**
 * 私有会话ID映射
 */
export interface PriIdMapping {
  [key: string]: string
}

/**
 * 创建对话响应数据
 */
export interface ConvCreatedVO {
  /** 会话ID */
  sessionId: string
  /** 私有会话ID映射 私有ID,模型code */
  priIdMapping: PriIdMapping
}

/**
 * 创建对话响应
 * 对应 API: POST /conv/create
 */
export interface CreateConversationResponse {
  /** 响应码 */
  code: number
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: ConvCreatedVO
}

// ============================================================================
// 历史会话相关类型
// ============================================================================

/**
 * 聊天选项（增量内容）
 */
export interface ChatChoice {
  /** 索引 */
  index: number
  /** 增量内容 */
  delta: {
    content?: string
  }
  /** 完成原因 */
  finish_reason?: string
}

/**
 * 带点赞状态的聊天响应
 * 对应 API: GET /conv/his 返回的单条聊天记录
 */
export interface ChatRespWithLikedVO {
  /** 会话ID */
  session_id?: string
  /** 对象类型 */
  object?: string
  /** 创建时间戳 */
  created?: number
  /** 聊天选项列表 */
  choices?: ChatChoice[]
  /** 引用列表 */
  citations?: Citation[]
  /** 模型名称 */
  maskName?: string
  /** 模型代码 */
  maskCode?: string
  /** 私有ID */
  privateId?: string
  /** 是否已点赞 */
  liked?: boolean
}

/**
 * 历史会话数据
 * 对应 API: GET /conv/his 返回的 data 字段
 */
export interface HistoryChatVO {
  /** 会话ID */
  sessionId: string
  /** 问题内容 */
  question: string
  /** 聊天记录映射 (key: 模型代码, value: 聊天记录列表) */
  chatMap: Record<string, ChatRespWithLikedVO[]>
}

/**
 * 历史会话响应
 * 对应 API: GET /conv/his
 */
export interface HistoryChatResponse {
  /** 响应码 */
  code: number
  /** 响应消息 */
  msg: string
  /** 响应数据 */
  data: HistoryChatVO
}

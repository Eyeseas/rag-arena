/**
 * @file Arena Store 领域类型定义
 * @description 定义 Arena 竞技场模块中跨模块共享的领域类型
 *
 * 这些类型被 store、selectors、helpers 等多个模块引用
 * 保持类型定义独立可避免循环依赖问题
 */

import type { Answer } from '@/types/arena'

/**
 * Arena 会话接口
 * 表示一次问答会话，包含问题、多个模型的回答和投票信息
 *
 * 会话生命周期：
 * 1. 用户创建新会话（本地生成 id）
 * 2. 用户提问后，服务端返回 serverQuestionId
 * 3. 多个模型并行生成回答
 * 4. 用户投票选择最佳回答
 */
export interface ArenaSession {
  /**
   * 会话唯一标识符
   * 初始为本地生成的 UUID，后续可能被服务端返回的 session id 替换
   */
  id: string

  /** 所属任务 ID，用于建立任务-会话的层级关系 */
  taskId: string

  /** 会话标题，显示在侧边栏，通常取自问题的前 24 个字符 */
  title: string

  /** 创建时间戳（毫秒） */
  createdAt: number

  /** 最后更新时间戳（毫秒），用于排序 */
  updatedAt: number

  /** 用户提出的问题内容 */
  question: string

  /**
   * 服务端问题 ID
   * 发送问题到服务端后返回，用于后续的回答获取和投票操作
   * 未发送时为 null
   */
  serverQuestionId: string | null

  /** 各模型的回答列表 */
  answers: Answer[]

  /**
   * 用户投票选中的回答 ID
   * 未投票时为 null
   */
  votedAnswerId: string | null

  /**
   * 模型掩码码到私有 ID 的映射
   * 来自 conv/create 接口，用于后续的投票等操作
   * 格式：{ [maskCode]: priId }
   */
  priIdMapping?: Record<string, string>
}

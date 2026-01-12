/**
 * Arena Mock 数据
 * 用于前端开发阶段的模拟数据，后续对接真实接口时可替换
 */

import type { Answer, Citation, ArenaResponse, VoteResponse, StatsResponse } from '@/types/arena'

// ============================================================================
// Mock 配置
// ============================================================================

/** 模拟网络延迟配置 (毫秒) */
export const MOCK_DELAY = {
  /** 提问请求延迟 */
  question: 1500,
  /** 投票请求延迟 */
  vote: 500,
  /** 统计请求延迟 */
  stats: 300,
  /** SSE 流式响应初始延迟 */
  streamInit: 200,
}

// ============================================================================
// 引用数据模板
// ============================================================================

/** 技术文档风格引用 */
const TECH_DOC_CITATIONS: Omit<Citation, 'id'>[] = [
  {
    summary: 'RAG系统架构设计指南 - 检索增强生成技术详解',
    start_time: '2026-01-06 15:23:23',
    duration: 120,
    callnumber: '13800138000',
    callednumber: '13900139000',
    relevance: 98,
    labels: '科学|数学|机器',
  },
  {
    summary: '向量数据库性能优化白皮书 - HNSW算法在百万级向量检索中的应用',
    start_time: '2026-01-06 14:15:30',
    duration: 180,
    callnumber: '13800138001',
    callednumber: '13900139001',
    relevance: 87,
    labels: '技术|数据库|优化',
  },
  {
    summary: '知识图谱构建最佳实践 - 实体关系抽取与RAG系统集成方案',
    start_time: '2026-01-06 13:20:45',
    duration: 95,
    callnumber: '13800138002',
    callednumber: '13900139002',
    relevance: 72,
    labels: '知识|图谱|实践',
  },
]

/** 学术论文风格引用 */
const ACADEMIC_CITATIONS: Omit<Citation, 'id'>[] = [
  {
    summary: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks - 参数化与非参数化记忆结合',
    start_time: '2026-01-06 16:30:00',
    duration: 150,
    callnumber: '13800138003',
    callednumber: '13900139003',
    relevance: 92,
    labels: '学术|研究|NLP',
  },
  {
    summary: 'Dense Passage Retrieval for Open-Domain QA - 密集向量检索在开放域问答中的性能提升',
    start_time: '2026-01-06 10:45:12',
    duration: 200,
    callnumber: '13800138004',
    callednumber: '13900139004',
    relevance: 85,
    labels: '检索|向量|算法',
  },
]

/** 内部文档风格引用 */
const INTERNAL_DOC_CITATIONS: Omit<Citation, 'id'>[] = [
  {
    summary: '企业知识库接入指南 v2.3 - 数据预处理、向量化配置与检索策略',
    start_time: '2026-01-06 09:10:20',
    duration: 165,
    callnumber: '13800138005',
    callednumber: '13900139005',
    relevance: 88,
    labels: '企业|知识库|集成',
  },
  {
    summary: '产品FAQ数据库 - 基于用户反馈和客服记录整理的常见问题解答，覆盖产品使用、故障排查、功能介绍',
    start_time: '2026-01-06 11:25:35',
    duration: 110,
    callnumber: '13800138006',
    callednumber: '13900139006',
    relevance: 79,
    labels: '产品|FAQ|数据库',
  },
  {
    summary: 'API检索服务文档 - POST /api/v1/search接口支持语义检索和关键词检索的混合模式',
    start_time: '2026-01-06 12:40:50',
    duration: 140,
    callnumber: '13800138007',
    callednumber: '13900139007',
    relevance: 68,
    labels: 'API|文档|服务',
  },
  {
    summary: '系统运维手册 - 推荐硬件配置：CPU 16核+，内存 64GB+，SSD存储 500GB+',
    start_time: '2026-01-06 08:15:05',
    duration: 125,
    callnumber: '13800138008',
    callednumber: '13900139008',
    relevance: 55,
    labels: '系统|运维|配置',
  },
]

/** 混合风格引用 */
const MIXED_CITATIONS: Omit<Citation, 'id'>[] = [
  {
    summary: 'LangChain RAG实战教程 - 完整的RAG工具链包括文档加载器、文本分割器、向量存储、检索器等组件',
    start_time: '2026-01-06 17:00:00',
    duration: 190,
    callnumber: '13800138009',
    callednumber: '13900139009',
    relevance: 91,
    labels: '教程|LangChain|实战',
  },
  {
    summary: '大模型应用开发实战 - 第8章详细介绍了RAG系统的评估方法，包括检索质量评估和生成质量评估',
    start_time: '2026-01-06 18:20:30',
    duration: 175,
    callnumber: '13800138010',
    callednumber: '13900139010',
    relevance: 83,
    labels: '大模型|开发|实战',
  },
]

/** 边界情况测试数据 - 只有summary的引用 */
const MINIMAL_CITATIONS: Omit<Citation, 'id'>[] = [
  {
    summary: '仅包含摘要的引用示例',
  },
  {
    summary: '包含时间和相关度的引用',
    start_time: '2026-01-06 19:30:00',
    relevance: 75,
  },
  {
    summary: '包含标签的引用示例',
    labels: '测试|示例|数据',
  },
]

/** 所有引用模板集合 */
const CITATION_TEMPLATES = [
  TECH_DOC_CITATIONS,
  ACADEMIC_CITATIONS,
  INTERNAL_DOC_CITATIONS,
  MIXED_CITATIONS,
  MINIMAL_CITATIONS,
]

// ============================================================================
// 回答模板
// ============================================================================

/** 回答模板生成函数类型 */
type AnswerTemplateGenerator = (question: string) => string

/** 模型 A 回答模板 */
const MODEL_A_TEMPLATE: AnswerTemplateGenerator = (question) => `## 模型 A 的回答

针对您的问题「${question}」，我的分析如下：

1. **核心观点**：这是一个很好的问题，需要从多个角度来分析。[1]
2. **详细解释**：根据我的知识库，这个问题涉及到以下几个方面...[2]
3. **建议**：建议您可以进一步了解相关领域的最新研究。[3]

\`\`\`python
# 示例代码
def example():
    return "Hello from Model A"
\`\`\`

希望这个回答对您有帮助！`

/** 模型 B 回答模板 */
const MODEL_B_TEMPLATE: AnswerTemplateGenerator = (question) => `## 模型 B 的回答

关于「${question}」这个问题：

我认为可以从以下几点来理解：

- **第一点**：基础概念的理解非常重要 [1]
- **第二点**：实践经验同样不可或缺
- **第三点**：持续学习是关键 [2]

> 引用：知识就是力量。

| 维度 | 说明 |
|------|------|
| 理论 | 扎实的理论基础 |
| 实践 | 丰富的实战经验 |

这是我的看法，供您参考。`

/** 模型 C 回答模板 */
const MODEL_C_TEMPLATE: AnswerTemplateGenerator = (question) => `## 模型 C 的回答

您好！针对「${question}」，我来分享一下我的见解：

### 背景分析
这个问题在当前环境下非常有意义，因为... [1][2]

### 解决方案
1. 首先，我们需要明确目标 [3]
2. 其次，制定详细的计划
3. 最后，执行并持续优化 [4]

### 代码示例
\`\`\`javascript
const solution = {
  step1: "分析问题",
  step2: "设计方案",
  step3: "实施执行"
};
\`\`\`

如有疑问，欢迎继续探讨！`

/** 模型 D 回答模板 */
const MODEL_D_TEMPLATE: AnswerTemplateGenerator = (question) => `## 模型 D 的回答

**问题**：${question}

**简短回答**：这是一个值得深入探讨的话题。[1]

**详细分析**：

从技术角度来看，这个问题可以分解为几个子问题：

1. 🎯 **目标定义** - 明确我们要解决什么
2. 🔍 **现状分析** - 了解当前的情况 [2]
3. 💡 **方案设计** - 提出可行的解决方案
4. ✅ **验证测试** - 确保方案有效

**总结**：综合以上分析，我建议采取循序渐进的方式来处理这个问题。

---
*以上是我的分析，希望能够帮到您。*`

/** 所有回答模板 */
const ANSWER_TEMPLATES = [
  { providerId: 'A', template: MODEL_A_TEMPLATE },
  { providerId: 'B', template: MODEL_B_TEMPLATE },
  { providerId: 'C', template: MODEL_C_TEMPLATE },
  { providerId: 'D', template: MODEL_D_TEMPLATE },
]

// ============================================================================
// Mock 数据生成器
// ============================================================================

/**
 * 生成唯一 ID
 */
function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 生成模拟引用数据
 * @param prefix ID 前缀
 * @returns 引用列表
 */
export function generateMockCitations(prefix: string): Citation[] {
  const templateIndex = Math.floor(Math.random() * CITATION_TEMPLATES.length)
  const template = CITATION_TEMPLATES[templateIndex]
  
  return template.map((citation, index) => ({
    ...citation,
    id: `${prefix}_c${index + 1}`,
  }))
}

/**
 * 生成单个模拟回答
 * @param questionId 问题 ID
 * @param providerId 供应商 ID
 * @param question 问题内容
 * @param template 回答模板生成器
 * @returns 回答对象
 */
export function generateMockAnswer(
  questionId: string,
  providerId: string,
  question: string,
  template: AnswerTemplateGenerator,
): Answer {
  const answerId = `${questionId}_${providerId.toLowerCase()}`
  return {
    id: answerId,
    providerId,
    content: template(question),
    citations: generateMockCitations(answerId),
  }
}

/**
 * 生成完整的模拟回答响应
 * @param question 用户问题
 * @returns ArenaResponse 对象
 */
export function generateMockArenaResponse(question: string): ArenaResponse {
  const questionId = generateId('q')
  
  const answers: Answer[] = ANSWER_TEMPLATES.map(({ providerId, template }) =>
    generateMockAnswer(questionId, providerId, question, template)
  )

  return {
    questionId,
    question,
    answers,
  }
}

/**
 * 生成模拟投票响应
 * @returns VoteResponse 对象
 */
export function generateMockVoteResponse(): VoteResponse {
  return { success: true }
}

/**
 * 生成模拟统计数据
 * @returns StatsResponse 对象
 */
export function generateMockStatsResponse(): StatsResponse {
  return {
    openai: Math.floor(Math.random() * 20) + 10,
    deepseek: Math.floor(Math.random() * 15) + 8,
    claude: Math.floor(Math.random() * 12) + 5,
    gemini: Math.floor(Math.random() * 10) + 3,
  }
}

// ============================================================================
// Mock 工具函数
// ============================================================================

/**
 * 模拟网络延迟
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 将文本分割为 chunks，用于模拟流式输出
 * @param text 原始文本
 * @param chunkSize 每个 chunk 的大小
 * @returns chunk 数组
 */
export function splitTextToChunks(text: string, chunkSize: number = 64): string[] {
  return text.match(new RegExp(`.{1,${chunkSize}}`, 'gs')) ?? []
}


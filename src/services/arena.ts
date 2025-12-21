// Arena API - RAG 问答竞技场接口服务

import { get, post } from '@/lib/request'
import type { ArenaResponse, VoteRequest, VoteResponse, StatsResponse } from '@/types/arena'

// 模拟模式开关 - 设为 true 使用模拟数据，false 调用真实 API
const USE_MOCK = false

// 模拟延迟 (ms)
const MOCK_DELAY = 1500

/**
 * 生成模拟回答数据
 */
function generateMockAnswers(question: string): ArenaResponse {
  const questionId = `q_${Date.now()}`

  const mockAnswers = [
    {
      id: `${questionId}_a`,
      providerId: 'A',
      content: `## 模型 A 的回答

针对您的问题「${question}」，我的分析如下：

1. **核心观点**：这是一个很好的问题，需要从多个角度来分析。
2. **详细解释**：根据我的知识库，这个问题涉及到以下几个方面...
3. **建议**：建议您可以进一步了解相关领域的最新研究。

\`\`\`python
# 示例代码
def example():
    return "Hello from Model A"
\`\`\`

希望这个回答对您有帮助！`,
    },
    {
      id: `${questionId}_b`,
      providerId: 'B',
      content: `## 模型 B 的回答

关于「${question}」这个问题：

我认为可以从以下几点来理解：

- **第一点**：基础概念的理解非常重要
- **第二点**：实践经验同样不可或缺
- **第三点**：持续学习是关键

> 引用：知识就是力量。

| 维度 | 说明 |
|------|------|
| 理论 | 扎实的理论基础 |
| 实践 | 丰富的实战经验 |

这是我的看法，供您参考。`,
    },
    {
      id: `${questionId}_c`,
      providerId: 'C',
      content: `## 模型 C 的回答

您好！针对「${question}」，我来分享一下我的见解：

### 背景分析
这个问题在当前环境下非常有意义，因为...

### 解决方案
1. 首先，我们需要明确目标
2. 其次，制定详细的计划
3. 最后，执行并持续优化

### 代码示例
\`\`\`javascript
const solution = {
  step1: "分析问题",
  step2: "设计方案",
  step3: "实施执行"
};
\`\`\`

如有疑问，欢迎继续探讨！`,
    },
    {
      id: `${questionId}_d`,
      providerId: 'D',
      content: `## 模型 D 的回答

**问题**：${question}

**简短回答**：这是一个值得深入探讨的话题。

**详细分析**：

从技术角度来看，这个问题可以分解为几个子问题：

1. 🎯 **目标定义** - 明确我们要解决什么
2. 🔍 **现状分析** - 了解当前的情况
3. 💡 **方案设计** - 提出可行的解决方案
4. ✅ **验证测试** - 确保方案有效

**总结**：综合以上分析，我建议采取循序渐进的方式来处理这个问题。

---
*以上是我的分析，希望能够帮到您。*`,
    },
  ]

  return {
    questionId,
    question,
    answers: mockAnswers,
  }
}

/**
 * 提交问题，获取 4 个匿名回答
 * @param question 用户问题
 * @returns 竞技场回答响应
 */
export async function submitQuestion(question: string): Promise<ArenaResponse> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    return generateMockAnswers(question)
  }
  return post<ArenaResponse>('/arena/ask', { question })
}

/**
 * 提交点赞
 * @param request 点赞请求
 * @returns 点赞响应
 */
export async function submitVote(request: VoteRequest): Promise<VoteResponse> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Mock vote:', request)
    return { success: true }
  }
  return post<VoteResponse>('/arena/vote', request)
}

/**
 * 获取投票统计数据
 * @returns 统计数据响应
 */
export async function getStats(): Promise<StatsResponse> {
  if (USE_MOCK) {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      openai: 15,
      deepseek: 12,
      claude: 8,
      gemini: 5,
    }
  }
  return get<StatsResponse>('/arena/stats')
}

export const arenaApi = {
  submitQuestion,
  submitVote,
  getStats,
}

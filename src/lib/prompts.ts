// prompts - Arena 内置 Prompt 库（仅前端模板）

export interface PromptTemplate {
  /** 唯一标识 */
  key: string
  /** 分组名称 */
  group: string
  /** 列表标题 */
  title: string
  /** 列表描述 */
  description: string
  /** 实际填入输入框的文本 */
  text: string
}

export const ARENA_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    key: 'rag.citations.extract',
    group: '引用与证据',
    title: '提取引用要点',
    description: '要求回答给出要点，并逐条标注引用来源。',
    text: '请根据给定问题回答，并以要点形式输出；每个要点都要标注对应的引用来源（标题/链接/位置）。\n\n问题：',
  },
  {
    key: 'rag.citations.verify',
    group: '引用与证据',
    title: '事实核查',
    description: '要求指出哪些结论有引用支持，哪些缺少证据。',
    text: '请对回答进行事实核查：\n1) 列出可以被引用来源直接支持的结论；\n2) 列出缺少引用支持或可能是推断的结论，并说明原因；\n3) 给出补充检索建议。\n\n问题：',
  },
  {
    key: 'rag.compare.4models',
    group: '对比评测',
    title: '四模型对比打分',
    description: '从正确性、完整性、可读性、引用质量等维度对比。',
    text: '请对比 4 个回答，并分别从：正确性、完整性、可读性、引用质量、可执行性 进行打分（1-5 分），给出总评与推荐答案，并指出每个答案最关键的 1 个优点与 1 个问题。\n\n问题：',
  },
  {
    key: 'rag.summarize.actionable',
    group: '结构化输出',
    title: '输出可执行清单',
    description: '将回答转为可执行步骤与检查点。',
    text: '请将回答整理为可执行的步骤清单，并为每一步提供：输入、输出、检查点（验证标准）。\n\n问题：',
  },
  {
    key: 'rag.write.dashboard_spec',
    group: '结构化输出',
    title: '输出需求规格说明',
    description: '将问题整理为 PRD 规格：目标/范围/验收标准。',
    text: '请将该需求整理为规格说明：\n- 目标\n- 范围内/范围外\n- 关键流程\n- 边界与异常\n- 验收标准（可验证）\n\n需求：',
  },
]

export function getPromptTextByKey(key: string) {
  return ARENA_PROMPT_TEMPLATES.find((p) => p.key === key)?.text || null
}


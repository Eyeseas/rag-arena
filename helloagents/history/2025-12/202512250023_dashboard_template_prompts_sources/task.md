# 任务清单: Dashboard 模板完善（Prompt 库与引用来源面板）

目录: `helloagents/history/2025-12/202512250023_dashboard_template_prompts_sources/`

---

## 1. Prompt 库
- [√] 1.1 新增 `src/lib/prompts.ts`，定义内置 Prompt 分组与文本模板
- [√] 1.2 新增 `src/components/arena/PromptLibrary.tsx`，使用 `@ant-design/x` `Prompts` 渲染，并提供 `onPick(text)` 回调
- [√] 1.3 在 `src/routes/index.tsx` 集成 Prompt 库面板，并实现“覆盖确认”逻辑

## 2. 引用来源面板
- [√] 2.1 新增 `src/components/arena/CitationSourcesPanel.tsx`，使用 `@ant-design/x` `Sources` 渲染聚合引用
- [√] 2.2 在 `src/routes/index.tsx` 增加“引用面板”入口（含 Drawer + Tabs：全部/按模型）

## 3. 输入组件受控改造
- [√] 3.1 在 `src/components/arena/QuestionInput.tsx` 增加 `value/onChange`，支持外部填入
- [√] 3.2 在 `src/routes/index.tsx` 使用受控输入并在会话切换时重置草稿

## 4. 安全检查
- [√] 4.1 按G9检查：外部链接跳转安全、覆盖确认、避免在本地存储写入敏感信息

## 5. 文档更新（知识库同步）
- [√] 5.1 更新 `helloagents/wiki/modules/arena.md`、`helloagents/wiki/modules/components.md`、`helloagents/wiki/modules/lib.md`、`helloagents/wiki/modules/types.md`
- [√] 5.2 更新 `helloagents/CHANGELOG.md`、`helloagents/history/index.md`

## 6. 质量检查
- [√] 6.1 运行 `npm run lint`（阻断性）
- [√] 6.2 运行 `tsc -b`（阻断性）

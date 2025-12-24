# components

## 目的
沉淀可复用 UI 组件，并承载 Arena 示例的主要交互组件。

## 模块概述
- **职责:** UI 组件组合、输入/展示/布局切换等交互
- **状态:** 🚧开发中
- **最后更新:** 2025-12-24

## 规范

### 需求: Arena 交互组件
**模块:** components
提供提问输入、答案卡片/网格、引用展示与布局切换等组件。

#### 场景: 用户提交问题
用户输入问题后，组件应触发服务请求并更新 UI 状态。
- 输入校验与禁用态正确
- 加载态与结果渲染正确

### 需求: 会话侧边栏组件
**模块:** components
提供历史会话侧边栏，展示会话列表并支持新建/切换/删除。

#### 场景: 侧边栏展示
侧边栏使用 `@ant-design/x` 的 `Conversations` 组件展示会话列表。
- 会话标题清晰可读
- 流式生成中禁用会话切换，避免跨会话串写

### 需求: Prompt 库组件
**模块:** components
提供 Prompt 库面板，用户可点击 Prompt 触发填入输入框。

#### 场景: 点击 Prompt
点击 Prompt 项触发回调，由页面决定填入策略（直接填入/覆盖确认）。
- Prompt 列表分组清晰
- 支持禁用态（例如加载中）

### 需求: 引用来源面板组件
**模块:** components
提供引用来源聚合展示组件，支持条目点击跳转。

#### 场景: 聚合来源列表
从回答中的 citations 聚合生成来源列表，供面板复用。
- “全部/按模型”过滤正确
- 无链接条目不触发跳转

## 依赖
- stores
- services
- types

## 变更历史
- [202512242354_arena_sidebar_sessions](../../history/2025-12/202512242354_arena_sidebar_sessions/) - 新增 `SessionSidebar`（历史会话侧边栏）
- [202512250023_dashboard_template_prompts_sources](../../history/2025-12/202512250023_dashboard_template_prompts_sources/) - 新增 `PromptLibrary` 与 `CitationSourcesPanel`

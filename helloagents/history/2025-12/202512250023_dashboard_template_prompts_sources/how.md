# 技术设计: Dashboard 模板完善（Prompt 库与引用来源面板）

## 技术方案

### 核心技术
- React + TypeScript + Vite
- Ant Design + `@ant-design/x`
  - `Prompts`：Prompt 库渲染
  - `Sources`：引用来源聚合展示

### 实现要点
- Prompt 库：
  - 通过 `Prompts` 渲染分组 Prompt 列表
  - 点击 Prompt 后触发回调，将文本写入输入框
  - 输入框已有内容时使用 Modal 确认覆盖
- 引用来源面板：
  - 从 `answers[].citations[]` 聚合为 `SourcesItem[]`
  - 面板使用 Drawer（右侧）+ Tabs（全部/按模型）
  - 点击条目优先使用 `url` 跳转；若无 url 则不触发跳转
- 输入组件改造：
  - `QuestionInput` 增加可选 `value/onChange`（受控模式）
  - 在 ArenaPage 维护 `draftQuestion`，用于 Prompt 填入与会话切换时重置

## 安全与性能
- **安全:** 不落盘保存 Prompt 文本；引用链接仅在用户点击时打开
- **性能:** 引用列表按需生成；UI 主要为展示层变更

## 测试与部署
- **测试:** 以手工回归为主
  - 点击 Prompt → 输入框填入；非空覆盖需确认
  - 生成含引用的回答 → 打开引用来源面板 → Tab 切换正确 → 点击来源可跳转
- **部署:** 无新增部署要求


# lib

## 目的
沉淀可复用的基础能力：请求封装、存储封装、SSE/流式工具、通用工具函数。

## 模块概述
- **职责:** axios 封装（`get/post/put/del`）、localStorage 工具、流式辅助、通用 utils
- **状态:** 🚧开发中
- **最后更新:** 2025-12-24

## 规范

### 需求: 请求与认证统一
**模块:** lib
请求层应统一处理 baseURL、超时、错误格式与认证 token 附带，避免在业务代码中重复实现。

#### 场景: 认证 token 缺失
当 `localStorage` 无 token 时，请求仍应可发起（若后端要求认证则按错误处理逻辑返回）。
- 不因 token 缺失导致前端崩溃
- UI 可收到可处理的错误结果

### 需求: Arena 辅助工具沉淀
**模块:** lib
为 Arena 示例提供可复用的纯前端工具：Prompt 模板与引用来源聚合。

#### 场景: Prompt 模板复用
Prompt 库以纯前端常量方式提供，供 UI 面板渲染与填入输入框。
- 模板可分组管理
- 不依赖后端

#### 场景: 引用来源聚合
将回答中的 citations 聚合为可展示的来源列表，供引用面板复用。
- 支持按 providerId 过滤
- 支持来源链接跳转（如存在）

## 依赖
- types

## 变更历史
- [202512250023_dashboard_template_prompts_sources](../../history/2025-12/202512250023_dashboard_template_prompts_sources/) - 新增 `prompts` 与 `citationSources` 工具

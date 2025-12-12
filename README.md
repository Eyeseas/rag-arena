# Dashboard Framework

基于 React 19 + TypeScript + Vite 的现代化仪表盘框架项目。

## 技术栈

### 核心框架
| 包名 | 版本 | 说明 |
|------|------|------|
| react | ^19.2.0 | React 19 核心库 |
| react-dom | ^19.2.0 | React DOM 渲染 |
| typescript | ~5.9.3 | TypeScript 语言支持 |
| vite | ^7.2.4 | 下一代前端构建工具 |

### UI 组件库
| 包名 | 版本 | 说明 |
|------|------|------|
| antd | ^6.1.0 | Ant Design 企业级 UI 组件库 |
| @ant-design/x | ^2.1.1 | Ant Design X 扩展组件 |
| tailwindcss | ^3.4.19 | 原子化 CSS 框架 |
| styled-components | ^6.1.19 | CSS-in-JS 方案 |

### 样式工具
| 包名 | 版本 | 说明 |
|------|------|------|
| clsx | ^2.1.1 | 条件类名拼接 |
| tailwind-merge | ^3.4.0 | Tailwind 类名合并 |
| class-variance-authority | ^0.7.1 | 变体样式管理 (CVA) |

### 图标库
| 包名 | 版本 | 说明 |
|------|------|------|
| @ant-design/icons | ^6.1.0 | Ant Design 图标 |
| lucide-react | ^0.560.0 | Lucide 图标库 |
| react-icons | ^5.5.0 | 多图标集合库 |
| @iconify/react | ^6.0.2 | 通用图标框架 |

### 数据可视化
| 包名 | 版本 | 说明 |
|------|------|------|
| @ant-design/charts | ^2.6.6 | Ant Design 图表库 |
| echarts | ^6.0.0 | Apache ECharts 图表库 |
| echarts-for-react | ^3.0.5 | ECharts React 封装 |

### 路由管理
| 包名 | 版本 | 说明 |
|------|------|------|
| @tanstack/react-router | ^1.141.1 | 类型安全的现代路由方案 |

### 状态管理
| 包名 | 版本 | 说明 |
|------|------|------|
| zustand | ^5.0.9 | 轻量级状态管理 |
| zustand-x | ^6.2.1 | Zustand 扩展工具 |
| immer | ^11.0.1 | 不可变数据操作 |
| immer-reducer | ^0.7.13 | Immer Reducer 模式 |
| use-immer | ^0.11.0 | Immer React Hooks |

### 数据请求
| 包名 | 版本 | 说明 |
|------|------|------|
| @tanstack/react-query | ^5.90.12 | 服务端状态管理 |
| axios | ^1.13.2 | HTTP 请求库 |

### 表格处理
| 包名 | 版本 | 说明 |
|------|------|------|
| @tanstack/react-table | ^8.21.3 | Headless 表格库 |

### 表单处理
| 包名 | 版本 | 说明 |
|------|------|------|
| react-hook-form | ^7.68.0 | 高性能表单库 |
| @hookform/resolvers | ^5.2.2 | 表单验证器适配 |
| zod | ^4.1.13 | TypeScript Schema 验证 |

### 日期处理
| 包名 | 版本 | 说明 |
|------|------|------|
| dayjs | ^1.11.19 | 轻量级日期库 |
| date-fns | ^4.1.0 | 函数式日期工具 |
| date-fns-tz | ^3.2.0 | date-fns 时区支持 |
| luxon | ^3.7.2 | 现代日期时间库 |

### 拖拽功能
| 包名 | 版本 | 说明 |
|------|------|------|
| @dnd-kit/core | ^6.3.1 | 现代拖拽核心库 |
| @dnd-kit/sortable | ^10.0.0 | 排序拖拽支持 |
| @dnd-kit/modifiers | ^9.0.0 | 拖拽修饰器 |

### 虚拟滚动
| 包名 | 版本 | 说明 |
|------|------|------|
| @tanstack/react-virtual | ^3.13.13 | 虚拟列表渲染 |

### 动画效果
| 包名 | 版本 | 说明 |
|------|------|------|
| motion | ^12.23.26 | Framer Motion 动画库 |

### 富文本编辑
| 包名 | 版本 | 说明 |
|------|------|------|
| @tiptap/react | ^3.13.0 | Tiptap 富文本编辑器 |
| @tiptap/starter-kit | ^3.13.0 | Tiptap 基础扩展包 |
| @tiptap/pm | ^3.13.0 | ProseMirror 核心 |
| slate | ^0.120.0 | Slate 富文本框架 |
| slate-react | ^0.120.0 | Slate React 绑定 |

### Hooks 工具库
| 包名 | 版本 | 说明 |
|------|------|------|
| ahooks | ^3.9.6 | 阿里 React Hooks 库 |
| react-use | ^17.6.0 | 常用 Hooks 集合 |
| usehooks-ts | ^3.1.1 | TypeScript Hooks 集合 |
| @uidotdev/usehooks | ^2.4.1 | 实用 Hooks 工具集 |

### 工具库
| 包名 | 版本 | 说明 |
|------|------|------|
| lodash | ^4.17.21 | JavaScript 工具函数库 |
| @types/lodash | ^4.17.21 | Lodash 类型定义 |

## 可能需要补充的包

### 国际化 (i18n)
- `react-i18next` + `i18next` - React 国际化方案

### 文件上传
- `react-dropzone` - 拖拽上传组件

### 测试工具
- `vitest` - Vite 原生测试框架
- `@testing-library/react` - React 测试工具
- `msw` - API Mock 工具
- `@vitest/coverage-v8` - 测试覆盖率

### 代码质量
- `prettier` - 代码格式化
- `husky` - Git Hooks 工具
- `lint-staged` - 暂存文件检查
- `commitlint` - 提交信息规范

### 错误监控
- `@sentry/react` - Sentry 错误追踪

### PWA 支持
- `vite-plugin-pwa` - PWA 插件

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 项目结构

```
├── public/          # 静态资源
├── src/
│   ├── assets/      # 项目资源文件
│   ├── App.tsx      # 应用入口组件
│   ├── App.css      # 应用样式
│   ├── main.tsx     # 应用挂载入口
│   └── index.css    # 全局样式
├── index.html       # HTML 模板
├── vite.config.ts   # Vite 配置
├── tailwind.config.js # Tailwind 配置
└── tsconfig.json    # TypeScript 配置
```

## License

Private

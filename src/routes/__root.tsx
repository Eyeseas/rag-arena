// Root Layout - 优雅的全屏布局

import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { QueryClient } from '@tanstack/react-query'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          fontFamily:
            '"Plus Jakarta Sans", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Card: {
            headerBg: 'transparent',
          },
          Button: {
            algorithm: true,
          },
        },
      }}
    >
      <div className="min-h-screen relative overflow-hidden">
        {/* 背景层 - 精致的网格 + 渐变 */}
        <div className="fixed inset-0 -z-10">
          {/* 主渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30" />
          
          {/* 网格图案 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          
          {/* 装饰性光晕 */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-indigo-200/30 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-violet-200/20 via-transparent to-transparent blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-sky-100/20 via-transparent to-transparent blur-3xl" />
        </div>

        {/* 主内容区 */}
        <main className="relative h-full min-h-screen px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>

        {/* 开发工具 */}
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    </ConfigProvider>
  )
}

// Root Layout - 优雅的全屏布局

import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { QueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { isLoading, isRedirecting } = useAuth()

  if (isLoading || isRedirecting) {
    return (
      <ConfigProvider locale={zhCN}>
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" tip={isRedirecting ? '正在跳转登录...' : '验证中...'} />
        </div>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#14b8a6',
          borderRadius: 6,
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/40 to-emerald-50/30" />
          
          {/* 网格图案 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(20, 184, 166, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(20, 184, 166, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          
          {/* 装饰性光晕 */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-teal-200/30 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-emerald-200/20 via-transparent to-transparent blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-100/20 via-transparent to-transparent blur-3xl" />
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

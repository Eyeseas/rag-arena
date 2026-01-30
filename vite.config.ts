import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 获取 API 模式和代理目标
  const apiMode = env.VITE_API_MODE || 'dev'
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://192.168.157.104:8901'
  
  // 只有在 dev 模式下才启用 proxy
  const shouldEnableProxy = apiMode === 'dev' && proxyTarget

  // 生产 sourcemap 开关：默认关闭；需要线上排障时可设置为 hidden
  const sourcemap =
    env.VITE_SOURCEMAP === 'true'
      ? (env.VITE_SOURCEMAP_MODE === 'hidden' ? 'hidden' : true)
      : false
  
  return {
    plugins: [
      // TanStack Router plugin 必须在 React plugin 之前
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Vite 7 默认已是 baseline-widely-available；显式设置便于团队统一认知
      target: 'baseline-widely-available',
      // 大项目关闭 gzip/brotli 体积报告可明显加速构建
      reportCompressedSize: false,
      // 默认关闭；需要线上排障/错误追踪再打开（建议 hidden）
      sourcemap,
      // 依赖较多时默认 500KB 容易噪声；适度上调仅用于告警阈值
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return

            // React 必须保持同一份拷贝，避免多 React 实例问题
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor'
            }

            if (id.includes('/antd/') || id.includes('/@ant-design/')) {
              return 'antd-vendor'
            }

            if (id.includes('/@tanstack/')) {
              return 'tanstack-vendor'
            }

            if (
              id.includes('/react-markdown/') ||
              id.includes('/remark-gfm/') ||
              id.includes('/rehype-highlight/')
            ) {
              return 'markdown-vendor'
            }

            if (
              id.includes('/@tiptap/') ||
              id.includes('/slate/') ||
              id.includes('/slate-react/')
            ) {
              return 'editor-vendor'
            }

            if (
              id.includes('/echarts/') ||
              id.includes('/echarts-for-react/') ||
              id.includes('/@ant-design/charts/')
            ) {
              return 'charts-vendor'
            }

            if (
              id.includes('/@dnd-kit/') ||
              id.includes('/motion/') ||
              id.includes('/styled-components/')
            ) {
              return 'ui-utils-vendor'
            }

            // 其余第三方统一走 vendor，方便缓存
            return 'vendor'
          },
        },
      },
    },
    server: {
      proxy: shouldEnableProxy
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
            '/sso': {
              target: "http://localhost:3000",
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/sso/, ''),
            },
          }
        : undefined,
    },
  }
})

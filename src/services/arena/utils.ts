/**
 * Arena 服务工具函数
 */

/**
 * 判断是否使用 mock 数据
 * 根据环境变量 VITE_USE_MOCK 或 VITE_API_MODE 来判断
 */
export function shouldUseMock(): boolean {
  const useMock = import.meta.env.VITE_USE_MOCK
  const apiMode = import.meta.env.VITE_API_MODE || 'dev'

  // 如果明确设置了 VITE_USE_MOCK，优先使用该值
  if (useMock !== undefined) {
    return useMock === '1' || useMock === 'true'
  }

  // 否则根据 API 模式判断
  return apiMode === 'mock'
}

/**
 * 模型代码到 ProviderId 的映射
 */
export const maskCodeToProviderId: Record<string, string> = {
  ALPHA: 'A',
  BRAVO: 'B',
  CHARLIE: 'C',
  DELTA: 'D',
}

/**
 * 定义模型顺序：A、B、C、D
 */
export const orderedMaskCodes = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA']

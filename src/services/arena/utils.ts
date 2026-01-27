/**
 * Arena 服务工具函数
 */

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

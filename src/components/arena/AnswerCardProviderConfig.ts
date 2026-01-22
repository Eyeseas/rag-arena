export interface ProviderVisualConfig {
  color: string
  gradient: string
  bgGradient: string
  lightBg: string
}

// AnswerCard 中的供应商标识颜色/渐变映射。
const providerConfig: Record<string, ProviderVisualConfig> = {
  A: {
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    lightBg: 'bg-blue-50',
  },
  B: {
    color: 'green',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    lightBg: 'bg-emerald-50',
  },
  C: {
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 to-amber-50',
    lightBg: 'bg-orange-50',
  },
  D: {
    color: 'rose',
    gradient: 'from-rose-500 to-orange-500',
    bgGradient: 'from-rose-50 to-orange-50',
    lightBg: 'bg-rose-50',
  },
}

const defaultConfig: ProviderVisualConfig = {
  color: 'default',
  gradient: 'from-slate-500 to-gray-500',
  bgGradient: 'from-slate-50 to-gray-50',
  lightBg: 'bg-slate-50',
}

export function getProviderVisualConfig(providerId: string): ProviderVisualConfig {
  return providerConfig[providerId] || defaultConfig
}

/**
 * Arena 引用详情服务
 */

import type { CitationDetail } from '@/types/arena'
import { get } from '@/lib/request'

export async function getCitationDetail(refId: string, priId: string): Promise<CitationDetail> {
  try {
    const response = await get<{ code: number; msg: string; data: CitationDetail }>('/api/others/ref/detail', {
      params: { refId, priId },
    })
    return response.data
  } catch (error) {
    console.error('[ArenaApi] getCitationDetail failed:', error)
    throw error
  }
}

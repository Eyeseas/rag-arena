/**
 * Arena 引用详情服务
 */

import type { CitationDetail } from '@/types/arena'
import { get } from '@/lib/request'

/**
 * 获取引用详情
 *
 * @param refId 引用ID
 * @returns 引用详情
 *
 * @example
 * ```ts
 * const detail = await getCitationDetail('ref_1')
 * console.log(detail.content) // 转写内容
 * ```
 *
 * @remarks
 * 真实接口对接时，需要调用:
 * GET /api/v1/reference/detail/{ref_id}
 */
export async function getCitationDetail(refId: string): Promise<CitationDetail> {
  try {
    const response = await get<CitationDetail>(`/api/v1/reference/detail/${refId}`)
    return response
  } catch (error) {
    console.error('[ArenaApi] getCitationDetail failed:', error)
    throw error
  }
}

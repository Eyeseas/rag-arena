/**
 * Arena 引用详情服务
 */

import type { CitationDetail } from '@/types/arena'
import { shouldUseMock } from './utils'
import { MOCK_DELAY, delay } from '@/data/mock'
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
  // 如果使用 mock 模式，返回 mock 数据
  if (shouldUseMock()) {
    await delay(MOCK_DELAY.question)

    // Mock 数据 - 多轮对话内容
    const conversationContent = [
      { text: '您好，我想咨询一下关于产品的问题', time: 0, role: 'caller', callnumber: '13800138000' },
      { text: '好的，请问您想了解哪个方面的信息？', time: 5, role: 'called', callednumber: '4001234567' },
      { text: '我想了解一下价格和功能特点', time: 12, role: 'caller', callnumber: '13800138000' },
      { text: '我们的产品价格是2999元，主要功能包括智能识别、语音交互和数据分析', time: 18, role: 'called', callednumber: '4001234567' },
      { text: '那有没有优惠活动呢？', time: 35, role: 'caller', callnumber: '13800138000' },
      { text: '目前我们有新用户优惠，可以享受8折优惠，也就是2399元', time: 42, role: 'called', callednumber: '4001234567' },
      { text: '好的，我考虑一下，谢谢', time: 58, role: 'caller', callnumber: '13800138000' },
      { text: '不客气，如有其他问题随时联系我们', time: 65, role: 'called', callednumber: '4001234567' },
    ]

    // Mock 数据
    return {
      ref_id: refId,
      content: JSON.stringify(conversationContent),
      trans: JSON.stringify([
        { text: 'Hello, I would like to inquire about product information', time: 0 },
        { text: 'Sure, which aspect would you like to know about?', time: 5 },
        { text: 'I want to know about pricing and features', time: 12 },
        { text: 'Our product price is 2999 yuan, main features include intelligent recognition, voice interaction and data analysis', time: 18 },
        { text: 'Are there any promotional activities?', time: 35 },
        { text: 'We currently have a new user discount, you can enjoy 20% off, which is 2399 yuan', time: 42 },
        { text: 'Okay, I will consider it, thank you', time: 58 },
        { text: 'You are welcome, feel free to contact us if you have any other questions', time: 65 },
      ]),
      time_point: 42,
      key_elements: {
        persons: ['张三', '李四', '客服小王'],
        oragnizations: ['公司A', '销售部门', '客服中心'],
        events: ['产品咨询', '价格讨论', '优惠活动'],
        others: ['产品X', '新用户优惠', '智能识别功能'],
      },
      file: 'http://example.com/audio/ref_1.mp3',
      begin_time: 0,
      end_time: 70,
    }
  }

  // 真实接口调用
  try {
    const response = await get<CitationDetail>(`/api/v1/reference/detail/${refId}`)
    return response
  } catch (error) {
    console.error('[ArenaApi] getCitationDetail failed:', error)
    throw error
  }
}

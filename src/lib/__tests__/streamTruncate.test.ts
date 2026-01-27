import { describe, it, expect } from 'vitest'
import { truncateStreamContent, isStreamTruncated } from '../streamTruncate'

describe('streamTruncate - 流式内容截断工具', () => {
  describe('truncateStreamContent', () => {
    it('应该保留不超过限制的纯文本内容', () => {
      const content = '这是一段测试文本'
      const result = truncateStreamContent(content, 100)
      expect(result).toBe(content)
    })

    it('应该截断超过限制的纯文本内容', () => {
      const content = '这'.repeat(1500) // 1500个汉字
      const result = truncateStreamContent(content, 1000)
      const chineseCount = (result.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(1000)
    })

    it('应该完整保留 <think> 标签内容', () => {
      const content = '<think>这是思考内容' + '思'.repeat(500) + '</think>这是正常文本'
      const result = truncateStreamContent(content, 10)
      expect(result).toContain('<think>')
      expect(result).toContain('</think>')
      expect(result).toContain('这是思考内容')
    })

    it('应该排除 <think> 标签内容后计算汉字数', () => {
      const thinkContent = '思'.repeat(500)
      const textContent = '文'.repeat(100)
      const content = `<think>${thinkContent}</think>${textContent}`
      const result = truncateStreamContent(content, 50)

      // think 标签应该完整保留
      expect(result).toContain('<think>')
      expect(result).toContain('</think>')

      // 文本内容应该被截断到50个汉字
      const textPart = result.split('</think>')[1] || ''
      const textChineseCount = (textPart.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(textChineseCount).toBeLessThanOrEqual(50)
    })

    it('应该处理多个 <think> 标签', () => {
      const content = '<think>思考1</think>文本1<think>思考2</think>文本2'
      const result = truncateStreamContent(content, 5)

      // 所有完整的 think 标签都应该保留
      expect(result).toContain('<think>思考1</think>')
      expect(result).toContain('<think>思考2</think>')

      // 文本内容应该被截断
      expect(result).toContain('文本1')
    })

    it('应该处理不完整的 <think> 标签', () => {
      const content = '正常文本<think>未闭合的思考内容'
      const result = truncateStreamContent(content, 5)

      // 应该保留不完整的 think 标签
      expect(result).toContain('<think>')
      expect(result).toContain('正常文本')
    })

    it('应该处理混合中英文内容', () => {
      const content = '中文English中文English' + '中'.repeat(100)
      const result = truncateStreamContent(content, 10)

      // 只统计汉字数量
      const chineseCount = (result.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(10)
    })

    it('应该处理空字符串', () => {
      const result = truncateStreamContent('', 100)
      expect(result).toBe('')
    })

    it('应该处理只包含 <think> 标签的内容', () => {
      const content = '<think>' + '思'.repeat(2000) + '</think>'
      const result = truncateStreamContent(content, 100)
      expect(result).toBe(content)
    })

    it('应该在达到限制后保留不完整的 <think> 标签', () => {
      const content = '文'.repeat(1000) + '<think>未完成的思考'
      const result = truncateStreamContent(content, 1000)

      // 应该截断到1000个汉字
      const beforeThink = result.split('<think>')[0]
      const chineseCount = (beforeThink.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(1000)

      // 应该保留不完整的 think 标签
      expect(result).toContain('<think>')
    })

    it('应该使用默认限制 1000 个汉字', () => {
      const content = '中'.repeat(1500)
      const result = truncateStreamContent(content)
      const chineseCount = (result.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(1000)
    })

    it('应该处理嵌套场景 - think 标签后跟大量文本', () => {
      const content = '<think>深度思考内容</think>' + '正'.repeat(1200)
      const result = truncateStreamContent(content, 1000)

      // think 标签完整保留
      expect(result).toContain('<think>深度思考内容</think>')

      // 文本被截断到1000个汉字
      const textPart = result.split('</think>')[1] || ''
      const chineseCount = (textPart.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(1000)
    })
  })

  describe('isStreamTruncated', () => {
    it('应该检测未达到限制的内容', () => {
      const content = '这是一段短文本'
      expect(isStreamTruncated(content, 100)).toBe(false)
    })

    it('应该检测已达到限制的内容', () => {
      const content = '中'.repeat(1000)
      expect(isStreamTruncated(content, 1000)).toBe(true)
    })

    it('应该检测超过限制的内容', () => {
      const content = '中'.repeat(1500)
      expect(isStreamTruncated(content, 1000)).toBe(true)
    })

    it('应该排除完整 <think> 标签内容后检测', () => {
      const content = '<think>' + '思'.repeat(500) + '</think>' + '文'.repeat(50)
      expect(isStreamTruncated(content, 100)).toBe(false)
      expect(isStreamTruncated(content, 40)).toBe(true)
    })

    it('应该处理不完整的 <think> 标签', () => {
      const content = '文'.repeat(100) + '<think>未闭合的思考'
      expect(isStreamTruncated(content, 100)).toBe(true)
      expect(isStreamTruncated(content, 50)).toBe(true)
    })

    it('应该使用默认限制 1000 个汉字', () => {
      const content = '中'.repeat(999)
      expect(isStreamTruncated(content)).toBe(false)

      const content2 = '中'.repeat(1000)
      expect(isStreamTruncated(content2)).toBe(true)
    })

    it('应该处理多个完整 <think> 标签', () => {
      const content = '<think>思考1</think>文本<think>思考2</think>' + '文'.repeat(50)
      expect(isStreamTruncated(content, 100)).toBe(false)
      expect(isStreamTruncated(content, 40)).toBe(true)
    })

    it('应该处理空字符串', () => {
      expect(isStreamTruncated('', 100)).toBe(false)
    })

    it('应该处理只包含 <think> 标签的内容', () => {
      const content = '<think>' + '思'.repeat(2000) + '</think>'
      expect(isStreamTruncated(content, 100)).toBe(false)
    })

    it('应该正确处理边界情况 - 恰好达到限制', () => {
      const content = '中'.repeat(1000)
      expect(isStreamTruncated(content, 1000)).toBe(true)
      expect(isStreamTruncated(content, 1001)).toBe(false)
    })
  })

  describe('集成场景测试', () => {
    it('应该模拟流式追加场景 - 逐步追加内容', () => {
      let content = ''
      const maxChars = 100

      // 第一次追加
      content = truncateStreamContent(content + '这是第一段内容。', maxChars)
      expect(isStreamTruncated(content, maxChars)).toBe(false)

      // 第二次追加
      content = truncateStreamContent(content + '这是第二段内容。', maxChars)
      expect(isStreamTruncated(content, maxChars)).toBe(false)

      // 追加大量内容
      content = truncateStreamContent(content + '内'.repeat(200), maxChars)
      expect(isStreamTruncated(content, maxChars)).toBe(true)

      // 再次追加应该不会增加内容
      const beforeLength = content.length
      content = truncateStreamContent(content + '额外内容', maxChars)
      expect(content.length).toBe(beforeLength)
    })

    it('应该模拟带 think 标签的流式追加', () => {
      let content = ''
      const maxChars = 50

      // 追加 think 标签
      content = truncateStreamContent(content + '<think>正在思考问题...</think>', maxChars)
      expect(content).toContain('<think>')
      expect(isStreamTruncated(content, maxChars)).toBe(false)

      // 追加正常文本
      content = truncateStreamContent(content + '这是回答内容。', maxChars)
      expect(isStreamTruncated(content, maxChars)).toBe(false)

      // 追加大量文本
      content = truncateStreamContent(content + '答'.repeat(100), maxChars)
      expect(isStreamTruncated(content, maxChars)).toBe(true)

      // think 标签应该完整保留
      expect(content).toContain('<think>正在思考问题...</think>')
    })

    it('应该处理实际 AI 回答场景', () => {
      const aiResponse = `<think>
我需要分析这个问题的几个方面：
1. 技术可行性
2. 性能影响
3. 用户体验
经过思考，我认为应该采用方案A。
</think>

根据您的问题，我建议采用以下方案：

首先，我们需要考虑系统的整体架构。` + '在实际应用中，'.repeat(200)

      const result = truncateStreamContent(aiResponse, 100)

      // think 标签应该完整保留
      expect(result).toContain('<think>')
      expect(result).toContain('</think>')
      expect(result).toContain('我需要分析这个问题的几个方面')

      // 文本内容应该被截断
      const textPart = result.split('</think>')[1] || ''
      const chineseCount = (textPart.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(100)
    })
  })

  describe('性能和边界测试', () => {
    it('应该高效处理超长内容', () => {
      const content = '中'.repeat(10000)
      const startTime = Date.now()
      const result = truncateStreamContent(content, 1000)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
      const chineseCount = (result.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(1000)
    })

    it('应该处理特殊字符和 Unicode', () => {
      const content = '中文🎉Emoji😊混合内容' + '测'.repeat(100)
      const result = truncateStreamContent(content, 50)

      // 只统计汉字
      const chineseCount = (result.match(/[\u4e00-\u9fa5]/g) || []).length
      expect(chineseCount).toBeLessThanOrEqual(50)
    })

    it('应该处理连续的 <think> 标签', () => {
      const content = '<think>思考1</think><think>思考2</think><think>思考3</think>文本内容'
      const result = truncateStreamContent(content, 10)

      expect(result).toContain('<think>思考1</think>')
      expect(result).toContain('<think>思考2</think>')
      expect(result).toContain('<think>思考3</think>')
      expect(result).toContain('文本内容')
    })

    it('应该处理 <think> 标签中包含特殊字符', () => {
      const content = '<think>思考内容包含<>特殊字符</think>正常文本'
      const result = truncateStreamContent(content, 10)

      expect(result).toContain('<think>')
      expect(result).toContain('</think>')
      expect(result).toContain('正常文本')
    })
  })
})

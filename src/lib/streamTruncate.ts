/**
 * 流式内容截断工具 - 排除 <think> 标签内容后限制汉字数
 */

const THINK_OPEN = '<think>'
const THINK_CLOSE = '</think>'
const MAX_CHINESE_CHARS_DEFAULT = 2048
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/

type Part = { type: 'think' | 'text'; content: string }

function parseIntoParts(content: string): Part[] {
  const parts: Part[] = []
  let remaining = content

  while (remaining.length > 0) {
    const thinkStart = remaining.indexOf(THINK_OPEN)

    if (thinkStart === -1) {
      parts.push({ type: 'text', content: remaining })
      break
    }

    if (thinkStart > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, thinkStart) })
    }

    const thinkEnd = remaining.indexOf(THINK_CLOSE, thinkStart)
    if (thinkEnd === -1) {
      parts.push({ type: 'think', content: remaining.slice(thinkStart) })
      break
    }

    parts.push({ type: 'think', content: remaining.slice(thinkStart, thinkEnd + THINK_CLOSE.length) })
    remaining = remaining.slice(thinkEnd + THINK_CLOSE.length)
  }

  return parts
}

function countChineseChars(text: string): number {
  let count = 0
  for (const char of text) {
    if (CHINESE_CHAR_REGEX.test(char)) count++
  }
  return count
}

function truncateTextByChineseChars(text: string, maxChineseChars: number): { truncated: string; chineseUsed: number } {
  let chineseCount = 0
  let cutIndex = 0

  for (let i = 0; i < text.length; i++) {
    if (CHINESE_CHAR_REGEX.test(text[i])) {
      chineseCount++
      cutIndex = i + 1
      if (chineseCount >= maxChineseChars) {
        break
      }
    }
  }

  return {
    truncated: text.slice(0, cutIndex),
    chineseUsed: chineseCount,
  }
}

/**
 * 截断流式内容，排除 think 标签后限制为指定汉字数
 */
export function truncateStreamContent(content: string, maxChineseChars: number = MAX_CHINESE_CHARS_DEFAULT): string {
  const parts = parseIntoParts(content)
  const totalChinese = parts
    .filter((p) => p.type === 'text')
    .reduce((sum, p) => sum + countChineseChars(p.content), 0)

  if (totalChinese <= maxChineseChars) {
    return content
  }

  let result = ''
  let chineseUsed = 0
  let reachedLimit = false

  for (const part of parts) {
    if (reachedLimit) {
      if (part.type === 'think' && !part.content.includes(THINK_CLOSE)) {
        result += part.content
      }
      break
    }

    if (part.type === 'think') {
      result += part.content
    } else {
      const available = maxChineseChars - chineseUsed
      const partChinese = countChineseChars(part.content)

      if (partChinese <= available) {
        result += part.content
        chineseUsed += partChinese
      } else {
        const { truncated, chineseUsed: used } = truncateTextByChineseChars(part.content, available)
        result += truncated
        chineseUsed += used
        reachedLimit = true
      }
    }
  }

  return result
}

/**
 * 检查内容是否已达到截断限制
 */
export function isStreamTruncated(content: string, maxChineseChars: number = MAX_CHINESE_CHARS_DEFAULT): boolean {
  const withoutCompleteThink = content.replace(/<think>[\s\S]*?<\/think>/g, '')
  const lastThinkOpen = withoutCompleteThink.lastIndexOf(THINK_OPEN)
  const nonThinkContent =
    lastThinkOpen !== -1 ? withoutCompleteThink.slice(0, lastThinkOpen) : withoutCompleteThink

  return countChineseChars(nonThinkContent) >= maxChineseChars
}

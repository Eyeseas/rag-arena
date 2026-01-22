import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid')
    expect(result).toBe('base valid')
  })

  it('should merge conflicting tailwind classes (last wins)', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should merge padding classes correctly', () => {
    const result = cn('p-4', 'px-2')
    expect(result).toContain('px-2')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'])
    expect(result).toBe('class1 class2')
  })

  it('should handle object notation', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'visible': true,
    })
    expect(result).toBe('active visible')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('should handle complex responsive classes', () => {
    const result = cn(
      'w-full',
      'md:w-1/2',
      'lg:w-1/3',
      'hover:bg-gray-100'
    )
    expect(result).toBe('w-full md:w-1/2 lg:w-1/3 hover:bg-gray-100')
  })
})

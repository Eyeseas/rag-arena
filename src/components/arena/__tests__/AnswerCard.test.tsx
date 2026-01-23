import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render, createMockAnswer } from '@/test/test-utils'
import { AnswerCard } from '@/components/arena/AnswerCard'

vi.mock('@/hooks/useAnswerFollowUpChat', () => ({
  useAnswerFollowUpChat: () => ({
    chatMessages: [],
    chatInput: '',
    setChatInput: vi.fn(),
    chatLoading: false,
    hasAskedFollowUp: false,
    handleSendMessage: vi.fn(),
    handleKeyDown: vi.fn(),
  }),
}))

describe('AnswerCard', () => {
  const mockOnVote = vi.fn()
  const mockOnVoteHover = vi.fn()

  const defaultProps = {
    answer: createMockAnswer({ id: 'a1', providerId: 'A', content: '测试回答内容' }),
    isVoted: false,
    disabled: false,
    loading: false,
    onVote: mockOnVote,
    isBlurred: false,
    onVoteHover: mockOnVoteHover,
  }

  beforeEach(() => {
    mockOnVote.mockClear()
    mockOnVoteHover.mockClear()
  })

  it('should render answer content', () => {
    render(<AnswerCard {...defaultProps} />)
    expect(screen.getByText('模型 A')).toBeInTheDocument()
  })

  it('should show loading state when content is empty', () => {
    render(
      <AnswerCard
        {...defaultProps}
        answer={createMockAnswer({ id: 'a1', providerId: 'A', content: '' })}
      />
    )
    expect(screen.getByText('正在生成回答...')).toBeInTheDocument()
  })

  it('should show error alert when answer has error', () => {
    render(
      <AnswerCard
        {...defaultProps}
        answer={createMockAnswer({ id: 'a1', providerId: 'A', content: '', error: '网络错误' })}
      />
    )
    expect(screen.getByText('网络错误')).toBeInTheDocument()
  })

  it('should show voted tag when isVoted is true', () => {
    render(<AnswerCard {...defaultProps} isVoted={true} />)
    expect(screen.getByText('最佳回答')).toBeInTheDocument()
  })

  it('should show citation count when citations exist', () => {
    render(
      <AnswerCard
        {...defaultProps}
        answer={createMockAnswer({
          id: 'a1',
          providerId: 'A',
          content: '测试内容',
          citations: [
            { id: 'c1', summary: '引用1' },
            { id: 'c2', summary: '引用2' },
          ],
        })}
      />
    )
    expect(screen.getByText('2 个引用')).toBeInTheDocument()
  })

  it('should apply blur effect when isBlurred is true', () => {
    const { container } = render(<AnswerCard {...defaultProps} isBlurred={true} />)
    const card = container.querySelector('.ant-card')
    expect(card?.className).toContain('blur')
  })

  it('should have expand button for fullscreen view', () => {
    render(<AnswerCard {...defaultProps} />)

    const expandButtons = screen.getAllByRole('button')
    const expandButton = expandButtons.find(btn => btn.querySelector('.anticon-expand'))
    expect(expandButton).toBeTruthy()
  })
})

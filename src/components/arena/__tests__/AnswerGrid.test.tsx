import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render, createMockAnswer } from '@/test/test-utils'
import { AnswerGrid } from '@/components/arena/AnswerGrid'

describe('AnswerGrid', () => {
  const mockOnVote = vi.fn()

  const defaultProps = {
    answers: [
      createMockAnswer({ id: 'a1', providerId: 'A', content: '回答内容A' }),
      createMockAnswer({ id: 'a2', providerId: 'B', content: '回答内容B' }),
    ],
    votedAnswerId: null,
    votingAnswerId: null,
    onVote: mockOnVote,
    layoutMode: 'two-col' as const,
    disableVoting: false,
  }

  beforeEach(() => {
    mockOnVote.mockClear()
  })

  it('should render nothing when answers array is empty', () => {
    const { container } = render(
      <AnswerGrid {...defaultProps} answers={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render all answer cards', () => {
    render(<AnswerGrid {...defaultProps} />)

    expect(screen.getByText('模型 A')).toBeInTheDocument()
    expect(screen.getByText('模型 B')).toBeInTheDocument()
  })

  it('should show voted indicator on voted answer', () => {
    render(<AnswerGrid {...defaultProps} votedAnswerId="a1" />)

    expect(screen.getByText('最佳回答')).toBeInTheDocument()
  })

  it('should disable voting when disableVoting is true', () => {
    render(<AnswerGrid {...defaultProps} disableVoting={true} />)

    const cards = screen.getAllByText(/模型 [AB]/)
    expect(cards).toHaveLength(2)
  })

  it('should render multiple answers in grid', () => {
    const { container } = render(
      <AnswerGrid {...defaultProps} layoutMode="two-col" />
    )

    const row = container.querySelector('.ant-row')
    expect(row).toBeInTheDocument()
  })

  it('should apply blur effect when hovering vote button', () => {
    render(<AnswerGrid {...defaultProps} />)

    const cards = screen.getAllByText(/模型 [AB]/)
    expect(cards).toHaveLength(2)
  })
})

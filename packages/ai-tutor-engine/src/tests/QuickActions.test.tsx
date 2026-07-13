import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuickActions } from '../components/QuickActions'
import type { QuickAction } from '../types'

describe('QuickActions', () => {
  const actions: QuickAction[] = [
    { type: 'teach-me', label: 'Teach me', icon: '📚' },
    { type: 'quiz-me', label: 'Quiz me', icon: '🧠' },
  ]

  it('renders all quick action buttons', () => {
    render(<QuickActions actions={actions} onAction={() => {}} />)
    expect(screen.getByText('Teach me')).toBeInTheDocument()
    expect(screen.getByText('Quiz me')).toBeInTheDocument()
  })

  it('calls onAction when a button is clicked', () => {
    const onAction = vi.fn()
    render(<QuickActions actions={actions} onAction={onAction} />)
    fireEvent.click(screen.getByText('Teach me'))
    expect(onAction).toHaveBeenCalledWith('teach-me')
  })

  it('renders nothing when actions array is empty', () => {
    const { container } = render(<QuickActions actions={[]} onAction={() => {}} />)
    expect(container.textContent).toBe('')
  })
})

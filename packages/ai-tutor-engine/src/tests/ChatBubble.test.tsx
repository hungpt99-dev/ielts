import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubble } from '../components/ChatBubble'
import type { ChatMessage } from '../types'

describe('ChatBubble', () => {
  const assistantMsg: ChatMessage = {
    id: '1',
    role: 'assistant',
    content: 'Hello! How can I help you?',
    createdAt: new Date().toISOString(),
  }

  const userMsg: ChatMessage = {
    id: '2',
    role: 'user',
    content: 'Teach me vocabulary',
    createdAt: new Date().toISOString(),
  }

  it('renders assistant message content', () => {
    render(<ChatBubble message={assistantMsg} />)
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
  })

  it('renders user message content', () => {
    render(<ChatBubble message={userMsg} />)
    expect(screen.getByText('Teach me vocabulary')).toBeInTheDocument()
  })

  it('shows robot avatar for assistant', () => {
    const { container } = render(<ChatBubble message={assistantMsg} />)
    expect(container.textContent).toContain('🤖')
  })

  it('shows user avatar for user', () => {
    const { container } = render(<ChatBubble message={userMsg} />)
    expect(container.textContent).toContain('👤')
  })

  it('displays formatted timestamp', () => {
    render(<ChatBubble message={assistantMsg} />)
    expect(screen.getByText(/ago|Just now|AM|PM/)).toBeInTheDocument()
  })
})

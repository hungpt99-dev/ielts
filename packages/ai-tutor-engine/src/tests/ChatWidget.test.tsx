import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatWidget } from '../components/ChatWidget'

beforeEach(() => {
  localStorage.clear()
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ChatWidget', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ChatWidget isOpen={false} onClose={() => {}} />,
    )
    expect(container.textContent).toBe('')
  })

  it('renders chat popup when isOpen is true', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    expect(screen.getByLabelText('AI Tutor chat')).toBeInTheDocument()
  })

  it('shows default title in header', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('AI Tutor Assistant')).toBeInTheDocument()
  })

  it('shows custom title when provided', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} title="IELTS Coach" />)
    expect(screen.getByText('IELTS Coach')).toBeInTheDocument()
  })

  it('shows MissingKeyBanner when no AI key and onOpenSettings provided', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} hasAiKey={false} onOpenSettings={() => {}} />)
    expect(screen.getByText('AI Key Not Configured')).toBeInTheDocument()
  })

  it('does not show MissingKeyBanner when AI key is present', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} hasAiKey={true} />)
    expect(screen.queryByText('AI Key Not Configured')).not.toBeInTheDocument()
  })

  it('renders welcome state when no messages exist', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    expect(screen.getByText("Hi, I'm your AI Tutor!")).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ChatWidget isOpen={true} onClose={onClose} />)
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('adds user message on send', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('calls external onSendMessage when provided', async () => {
    const onSendMessage = vi.fn().mockResolvedValue('AI response')
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        onSendMessage={onSendMessage}
      />,
    )
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByLabelText('Send message')

    fireEvent.change(input, { target: { value: 'Teach me' } })
    fireEvent.click(sendButton)

    expect(onSendMessage).toHaveBeenCalledWith('Teach me')
  })

  it('shows typing indicator while waiting for response', async () => {
    const onSendMessage = vi.fn().mockImplementation(() => new Promise(() => {}))
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        onSendMessage={onSendMessage}
      />,
    )
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    expect(screen.getByLabelText('AI Tutor is typing')).toBeInTheDocument()
  })

  it('disables input while typing', async () => {
    const onSendMessage = vi.fn().mockImplementation(() => new Promise(() => {}))
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        onSendMessage={onSendMessage}
      />,
    )
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    expect(input).toBeDisabled()
  })

  it('clears messages on clear chat', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByLabelText('Send message'))
    expect(screen.getByText('Hello')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Clear chat'))
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Teach me this')).toBeInTheDocument()
    expect(screen.getByText('Quiz me')).toBeInTheDocument()
    expect(screen.getByText('Practice now')).toBeInTheDocument()
  })

  it('triggers quick action via external callback when provided', () => {
    const onQuickAction = vi.fn()
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        onQuickAction={onQuickAction}
      />,
    )
    fireEvent.click(screen.getByText('Teach me this'))
    expect(onQuickAction).toHaveBeenCalledWith('teach-me')
  })

  it('sends message on Enter key', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    const input = screen.getByLabelText('Chat message input')
    fireEvent.change(input, { target: { value: 'Enter test' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Enter test')).toBeInTheDocument()
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(<ChatWidget isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders with custom placeholder', () => {
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        placeholder="Ask me anything..."
      />,
    )
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument()
  })

  it('renders context suggestions when provided', () => {
    const suggestions = [{
      title: 'Review vocabulary',
      message: 'You have words to review',
      actionLabel: 'Start review',
    }]
    render(
      <ChatWidget
        isOpen={true}
        onClose={() => {}}
        contextSuggestions={suggestions}
      />,
    )
    expect(screen.getByText('Review vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Start review')).toBeInTheDocument()
  })

  it('shows notification center when bell is clicked', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByLabelText('Notification center'))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('toggles between notifications and chat view', () => {
    render(<ChatWidget isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByLabelText('Notification center'))
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    const closeNotifications = screen.getByLabelText('Close notifications')
    fireEvent.click(closeNotifications)
    expect(screen.getByText('Teach me this')).toBeInTheDocument()
  })

  it('applies className prop to the popup container', () => {
    render(
      <ChatWidget isOpen={true} onClose={() => {}} className="custom-class" />,
    )
    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).toHaveClass('custom-class')
  })
})

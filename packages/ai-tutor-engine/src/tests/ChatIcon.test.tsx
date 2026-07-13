import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatIcon } from '../components/ChatIcon'

describe('ChatIcon', () => {
  it('renders with correct aria label when closed', () => {
    render(<ChatIcon isOpen={false} unreadCount={0} onToggle={() => {}} />)
    expect(screen.getByLabelText('Open AI Tutor chat')).toBeInTheDocument()
  })

  it('renders with correct aria label when open', () => {
    render(<ChatIcon isOpen={true} unreadCount={0} onToggle={() => {}} />)
    expect(screen.getByLabelText('Close AI Tutor chat')).toBeInTheDocument()
  })

  it('shows unread badge when count > 0', () => {
    render(<ChatIcon isOpen={false} unreadCount={3} onToggle={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByLabelText('3 unread messages')).toBeInTheDocument()
  })

  it('caps unread badge at 99+', () => {
    render(<ChatIcon isOpen={false} unreadCount={150} onToggle={() => {}} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<ChatIcon isOpen={false} unreadCount={0} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on Enter key', () => {
    const onToggle = vi.fn()
    render(<ChatIcon isOpen={false} unreadCount={0} onToggle={onToggle} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows online status indicator by default', () => {
    render(<ChatIcon isOpen={false} unreadCount={0} onToggle={() => {}} />)
    expect(screen.getByLabelText('AI Tutor is online')).toBeInTheDocument()
  })

  it('shows away status when isOnline is false', () => {
    render(<ChatIcon isOpen={false} unreadCount={0} onToggle={() => {}} isOnline={false} />)
    expect(screen.getByLabelText('AI Tutor is away')).toBeInTheDocument()
  })
})

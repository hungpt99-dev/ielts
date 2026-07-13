import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatPopup from '../../components/ChatPopup'

beforeEach(() => {
  localStorage.clear()
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ChatPopup', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ChatPopup isOpen={false} onClose={() => {}} />,
    )
    expect(container.textContent).toBe('')
  })

  it('renders chat popup when isOpen is true', () => {
    render(<ChatPopup isOpen={true} onClose={() => {}} />)
    expect(screen.getByLabelText('AI Tutor chat')).toBeInTheDocument()
  })

  it('shows default title in header when open', () => {
    render(<ChatPopup isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('AI Tutor Assistant')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ChatPopup isOpen={true} onClose={onClose} />)
    const closeButton = screen.getByLabelText('Close chat')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('reads AI key from localStorage when hasAiKey prop is not provided', () => {
    localStorage.setItem('ielts-settings', JSON.stringify({ aiApiKey: 'sk-test-key' }))
    render(<ChatPopup isOpen={true} onClose={() => {}} />)
    expect(screen.queryByText('AI Key Not Configured')).not.toBeInTheDocument()
  })

  it('shows MissingKeyBanner when localStorage has no AI key', () => {
    localStorage.setItem('ielts-settings', JSON.stringify({}))
    render(<ChatPopup isOpen={true} onClose={() => {}} onOpenSettings={() => {}} />)
    expect(screen.getByText('AI Key Not Configured')).toBeInTheDocument()
  })

  it('uses hasAiKey prop over localStorage', () => {
    localStorage.setItem('ielts-settings', JSON.stringify({ aiApiKey: 'sk-test-key' }))
    render(<ChatPopup isOpen={true} onClose={() => {}} hasAiKey={false} onOpenSettings={() => {}} />)
    expect(screen.getByText('AI Key Not Configured')).toBeInTheDocument()
  })

  it('calls onClose via default onOpenSettings when settings is triggered', () => {
    const onClose = vi.fn()
    const originalHash = window.location.hash
    window.location.hash = ''
    render(<ChatPopup isOpen={true} onClose={onClose} hasAiKey={false} />)
    const settingsButton = screen.getByText('Open Settings')
    fireEvent.click(settingsButton)
    expect(onClose).toHaveBeenCalledTimes(1)
    window.location.hash = originalHash
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(<ChatPopup isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

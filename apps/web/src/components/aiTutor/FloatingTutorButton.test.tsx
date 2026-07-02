import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FloatingTutorButton from './FloatingTutorButton'

describe('FloatingTutorButton', () => {
  it('renders chat icon SVG', () => {
    render(<FloatingTutorButton />)
    const button = screen.getByRole('button', { name: /open ai tutor assistant/i })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('dispatches toggle-ai-tutor-chat event on click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(<FloatingTutorButton />)
    const button = screen.getByRole('button', { name: /open ai tutor assistant/i })
    fireEvent.click(button)
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'toggle-ai-tutor-chat' })
    )
    dispatchSpy.mockRestore()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExtensionSection from '../ExtensionSection'

describe('ExtensionSection', () => {
  it('renders the section heading', () => {
    render(<ExtensionSection />)
    expect(screen.getByText(/Learn from the/)).toBeInTheDocument()
    expect(screen.getByText(/real internet/)).toBeInTheDocument()
  })

  it('renders the Install Chrome Extension CTA with correct link', () => {
    render(<ExtensionSection />)
    const cta = screen.getByText('Install Chrome Extension')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/ielts-journey'
    )
    expect(cta.closest('a')).toHaveAttribute('target', '_blank')
    expect(cta.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders a semantic section', () => {
    render(<ExtensionSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<ExtensionSection />)
    expect(screen.getByText(/Learn from the/).closest('section')).toHaveAttribute('id', 'extension')
  })
})

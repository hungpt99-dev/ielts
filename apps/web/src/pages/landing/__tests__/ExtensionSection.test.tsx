import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExtensionSection from '../ExtensionSection'

describe('ExtensionSection', () => {
  it('renders the section heading', () => {
    render(<ExtensionSection />)
    expect(screen.getByText('Learn while you browse')).toBeInTheDocument()
  })

  it('renders descriptive text about the extension', () => {
    render(<ExtensionSection />)
    expect(
      screen.getByText(/The Chrome extension works while you read/)
    ).toBeInTheDocument()
  })

  it('renders the Install Extension CTA with correct link', () => {
    render(<ExtensionSection />)
    const cta = screen.getByText('Install Extension')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/ielts-journey'
    )
    expect(cta.closest('a')).toHaveAttribute('target', '_blank')
    expect(cta.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows Chrome Web Store availability text', () => {
    render(<ExtensionSection />)
    expect(
      screen.getByText('Available on Chrome Web Store')
    ).toBeInTheDocument()
  })

  it('renders a semantic section', () => {
    render(<ExtensionSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<ExtensionSection />)
    expect(screen.getByText('Learn while you browse').closest('section')).toHaveAttribute('id', 'extension')
  })
})

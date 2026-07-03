import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HeroSection from '../HeroSection'

describe('HeroSection', () => {
  it('renders the product name', () => {
    render(<HeroSection />)
    expect(screen.getByText('IELTS Journey')).toBeInTheDocument()
  })

  it('renders the headline', () => {
    render(<HeroSection />)
    expect(
      screen.getByText('Free IELTS learning from the real internet')
    ).toBeInTheDocument()
  })

  it('renders the subheadline', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/Read articles, news, and web content/)
    ).toBeInTheDocument()
  })

  it('renders the primary CTA link pointing to app URL', () => {
    render(<HeroSection />)
    const cta = screen.getByText('Start Learning Free')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders the secondary CTA link pointing to extension URL', () => {
    render(<HeroSection />)
    const cta = screen.getByText('Install Chrome Extension')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/ielts-journey'
    )
    expect(cta.closest('a')).toHaveAttribute('target', '_blank')
    expect(cta.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders trust text about privacy', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/No account required. No backend/)
    ).toBeInTheDocument()
  })

  it('renders a semantic section element', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'IELTS Journey'
    )
  })
})

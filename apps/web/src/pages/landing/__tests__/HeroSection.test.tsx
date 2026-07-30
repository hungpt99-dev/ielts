import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HeroSection from '../HeroSection'

describe('HeroSection', () => {
  it('renders the tagline', () => {
    render(<HeroSection />)
    expect(screen.getByText('Your Personal IELTS Tutor')).toBeInTheDocument()
  })

  it('renders the headline', () => {
    render(<HeroSection />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeInTheDocument()
    expect(h1.textContent).toContain('Your daily')
    expect(h1.textContent).toContain('study plan')
    expect(h1.textContent).toContain('built by AI')
  })

  it('renders the subheadline', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/IELTS Journey creates a personalized daily study plan/)
    ).toBeInTheDocument()
  })

  it('renders the primary CTA link', () => {
    render(<HeroSection />)
    const cta = screen.getByText('Start Your Journey')
    expect(cta).toBeInTheDocument()
  })

  it('renders trust badges', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/100% Free/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Private & Local/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/No Account Needed/)
    ).toBeInTheDocument()
  })

  it('renders a semantic section element', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

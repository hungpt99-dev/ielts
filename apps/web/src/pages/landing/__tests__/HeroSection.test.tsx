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
    expect(
      screen.getByText(/Your daily study plan,/)
    ).toBeInTheDocument()
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

  it('renders trust text about privacy', () => {
    render(<HeroSection />)
    expect(
      screen.getByText(/No account required/)
    ).toBeInTheDocument()
  })

  it('renders a semantic section element', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

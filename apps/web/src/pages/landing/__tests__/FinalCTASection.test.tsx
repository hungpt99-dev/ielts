import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FinalCTASection from '../FinalCTASection'

describe('FinalCTASection', () => {
  it('renders the section heading', () => {
    render(<FinalCTASection />)
    expect(
      screen.getByText(/Ready to start your/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/IELTS journey/)
    ).toBeInTheDocument()
  })

  it('renders Start Learning Free CTA', () => {
    render(<FinalCTASection />)
    const cta = screen.getByText('Start Learning Free')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/ielts-journey'
    )
  })

  it('renders trust badges', () => {
    render(<FinalCTASection />)
    expect(screen.getByText('100% Free')).toBeInTheDocument()
    expect(screen.getByText('Privacy First')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<FinalCTASection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})

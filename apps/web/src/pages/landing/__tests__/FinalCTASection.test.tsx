import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FinalCTASection from '../FinalCTASection'

describe('FinalCTASection', () => {
  it('renders the section heading', () => {
    render(<FinalCTASection />)
    expect(
      screen.getByText('Start your IELTS learning journey today')
    ).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<FinalCTASection />)
    expect(
      screen.getByText('Free, private, and built for real learners.')
    ).toBeInTheDocument()
  })

  it('renders Start Learning Free CTA', () => {
    render(<FinalCTASection />)
    const cta = screen.getByText('Start Learning Free')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders Install Chrome Extension CTA with correct attributes', () => {
    render(<FinalCTASection />)
    const cta = screen.getByText('Install Chrome Extension')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/ielts-journey'
    )
    expect(cta.closest('a')).toHaveAttribute('target', '_blank')
    expect(cta.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders Support the Project CTA linking to donation section', () => {
    render(<FinalCTASection />)
    const cta = screen.getByText('Support the Project')
    expect(cta).toBeInTheDocument()
    expect(cta.closest('a')).toHaveAttribute('href', '#donation')
  })

  it('renders a semantic section with heading level 2', () => {
    render(<FinalCTASection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})

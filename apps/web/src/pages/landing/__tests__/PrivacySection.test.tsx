import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PrivacySection from '../PrivacySection'

describe('PrivacySection', () => {
  it('renders the section heading', () => {
    render(<PrivacySection />)
    expect(
      screen.getByText('Free, private, and transparent')
    ).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<PrivacySection />)
    expect(
      screen.getByText(/No catches. No hidden data collection/)
    ).toBeInTheDocument()
  })

  it('renders all seven privacy points', () => {
    render(<PrivacySection />)
    expect(screen.getByText('100% free')).toBeInTheDocument()
    expect(screen.getByText('No account needed')).toBeInTheDocument()
    expect(screen.getByText('No backend required')).toBeInTheDocument()
    expect(screen.getByText('Your data stays local')).toBeInTheDocument()
    expect(screen.getByText('AI features are optional')).toBeInTheDocument()
    expect(screen.getByText('Your own API key')).toBeInTheDocument()
    expect(screen.getByText('Transparent AI usage')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<PrivacySection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<PrivacySection />)
    expect(screen.getByText('Free, private, and transparent').closest('section')).toHaveAttribute('id', 'privacy')
  })
})

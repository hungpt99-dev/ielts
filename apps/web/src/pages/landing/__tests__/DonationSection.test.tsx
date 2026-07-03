import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config', () => ({
  DONATION: {
    buyMeACoffee: '',
    githubSponsors: '',
    paypal: '',
    bankInfo: '',
  },
}))

import DonationSection from '../DonationSection'

describe('DonationSection (no links configured)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the section heading', () => {
    render(<DonationSection />)
    expect(screen.getByText('Support the project')).toBeInTheDocument()
  })

  it('renders the descriptive message', () => {
    render(<DonationSection />)
    expect(
      screen.getByText(/IELTS Journey is built as a free project for learners/)
    ).toBeInTheDocument()
  })

  it('shows fallback text when no donation methods are configured', () => {
    render(<DonationSection />)
    expect(
      screen.getByText(/Donation links coming soon/)
    ).toBeInTheDocument()
  })

  it('shows always-free message', () => {
    render(<DonationSection />)
    expect(
      screen.getByText('No pressure. The app is and will always be free.')
    ).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<DonationSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<DonationSection />)
    expect(screen.getByText('Support the project').closest('section')).toHaveAttribute('id', 'donation')
  })
})

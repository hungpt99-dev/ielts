import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config', () => ({
  DONATION: {
    buyMeACoffee: 'https://buymeacoffee.com/test',
    githubSponsors: 'https://github.com/sponsors/test',
    paypal: 'https://paypal.me/test',
    bankInfo: 'Bank: ABC, Account: 123456',
  },
}))

import DonationSection from '../DonationSection'

describe('DonationSection with all links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Buy me a coffee link', () => {
    render(<DonationSection />)
    const bmc = screen.getByText('Buy me a coffee')
    expect(bmc).toBeInTheDocument()
    expect(bmc.closest('a')).toHaveAttribute('href', 'https://buymeacoffee.com/test')
  })

  it('renders GitHub Sponsors link', () => {
    render(<DonationSection />)
    const gh = screen.getByText('GitHub Sponsors')
    expect(gh).toBeInTheDocument()
    expect(gh.closest('a')).toHaveAttribute(
      'href',
      'https://github.com/sponsors/test'
    )
  })

  it('renders PayPal link', () => {
    render(<DonationSection />)
    const pp = screen.getByText('PayPal')
    expect(pp).toBeInTheDocument()
    expect(pp.closest('a')).toHaveAttribute('href', 'https://paypal.me/test')
  })

  it('renders bank transfer info', () => {
    render(<DonationSection />)
    expect(screen.getByText('Bank: ABC, Account: 123456')).toBeInTheDocument()
  })

  it('hides fallback text when links are configured', () => {
    render(<DonationSection />)
    expect(
      screen.queryByText(/Donation links coming soon/)
    ).not.toBeInTheDocument()
  })
})

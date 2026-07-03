import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LandingPage from '../../LandingPage'

vi.mock('../config', () => ({
  CREATOR: {
    name: 'Phạm Thanh Hưng',
    englishName: 'Harry',
    role: 'Software Engineer Full-stack',
    background: 'Test background',
    currentFocus: 'Test focus',
    openTo: 'Test openings',
    github: 'https://github.com/hungpt99-dev',
    email: '',
    cv: '',
    linkedin: '',
  },
  DONATION: {
    buyMeACoffee: '',
    githubSponsors: '',
    paypal: '',
    bankInfo: '',
  },
  EXTENSION_URL: 'https://chromewebstore.google.com/detail/ielts-journey',
  APP_URL: '/',
}))

describe('LandingPage', () => {
  it('renders the HeroSection with product name', () => {
    render(<LandingPage />)
    expect(screen.getByText('IELTS Journey')).toBeInTheDocument()
  })

  it('renders the ProblemSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText("Learning IELTS shouldn't feel like a struggle")
    ).toBeInTheDocument()
  })

  it('renders the SolutionSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Turn the real internet into your IELTS classroom')
    ).toBeInTheDocument()
  })

  it('renders the FeatureGrid heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Everything you need to master IELTS')
    ).toBeInTheDocument()
  })

  it('renders the ExtensionSection heading', () => {
    render(<LandingPage />)
    expect(screen.getByText('Learn while you browse')).toBeInTheDocument()
  })

  it('renders the PrivacySection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Free, private, and transparent')
    ).toBeInTheDocument()
  })

  it('renders the HowItWorksSection heading', () => {
    render(<LandingPage />)
    expect(screen.getByText('How it works')).toBeInTheDocument()
  })

  it('renders the CreatorSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Built by one developer')
    ).toBeInTheDocument()
  })

  it('renders the DonationSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Support the project')
    ).toBeInTheDocument()
  })

  it('renders the FAQSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Frequently asked questions')
    ).toBeInTheDocument()
  })

  it('renders the FinalCTASection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText('Start your IELTS learning journey today')
    ).toBeInTheDocument()
  })

  it('renders a Start Learning Free CTA link', () => {
    render(<LandingPage />)
    const links = screen.getAllByText('Start Learning Free')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('renders an Install Chrome Extension link', () => {
    render(<LandingPage />)
    const links = screen.getAllByText('Install Chrome Extension')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('sets the document title', () => {
    render(<LandingPage />)
    expect(document.title).toBe(
      'IELTS Journey - Free IELTS Learning from the Real Internet'
    )
  })
})

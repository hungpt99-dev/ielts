import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LandingPage from '../../LandingPage'

vi.mock('../config', () => ({
  EXTENSION_URL: 'https://chromewebstore.google.com/detail/ielts-journey',
}))

describe('LandingPage', () => {
  it('renders the HeroSection with product name', () => {
    render(<LandingPage />)
    const headings = screen.getAllByText('IELTS Journey')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the ProblemSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText(/Studying for IELTS alone/)
    ).toBeInTheDocument()
  })

  it('renders the SolutionSection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText(/IELTS Journey gives you/)
    ).toBeInTheDocument()
  })

  it('renders the FeatureGrid heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText(/All features/)
    ).toBeInTheDocument()
  })

  it('renders the ExtensionSection heading', () => {
    render(<LandingPage />)
    expect(screen.getByText(/Learn from the/)).toBeInTheDocument()
  })

  it('renders the HowItWorksSection heading', () => {
    render(<LandingPage />)
    expect(screen.getByText(/Start learning in/)).toBeInTheDocument()
  })

  it('renders the FinalCTASection heading', () => {
    render(<LandingPage />)
    expect(
      screen.getByText(/Ready to start/)
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
})

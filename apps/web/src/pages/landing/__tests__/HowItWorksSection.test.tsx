import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HowItWorksSection from '../HowItWorksSection'

describe('HowItWorksSection', () => {
  it('renders the section heading', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('How it works')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<HowItWorksSection />)
    expect(
      screen.getByText(/Four simple steps to turn your daily reading into IELTS practice/)
    ).toBeInTheDocument()
  })

  it('renders all four steps', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Read any article online')).toBeInTheDocument()
    expect(
      screen.getByText('Highlight and save vocabulary')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Generate IELTS exercises')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Review progress in your dashboard')
    ).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<HowItWorksSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('How it works').closest('section')).toHaveAttribute('id', 'how-it-works')
  })
})

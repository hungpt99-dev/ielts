import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SolutionSection from '../SolutionSection'

describe('SolutionSection', () => {
  it('renders the section heading', () => {
    render(<SolutionSection />)
    expect(
      screen.getByText('Turn the real internet into your IELTS classroom')
    ).toBeInTheDocument()
  })

  it('renders all six solution cards', () => {
    render(<SolutionSection />)
    expect(screen.getByText('Read anything online')).toBeInTheDocument()
    expect(
      screen.getByText('Extension works while you read')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Web app tracks your journey')
    ).toBeInTheDocument()
    expect(screen.getByText('AI-powered features')).toBeInTheDocument()
    expect(screen.getByText('Local-first privacy')).toBeInTheDocument()
    expect(screen.getByText('Personal study system')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<SolutionSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<SolutionSection />)
    expect(screen.getByText(/Turn the real internet/).closest('section')).toHaveAttribute('id', 'solution')
  })
})

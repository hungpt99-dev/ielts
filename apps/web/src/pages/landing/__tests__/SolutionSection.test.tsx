import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SolutionSection from '../SolutionSection'

describe('SolutionSection', () => {
  it('renders the section heading', () => {
    render(<SolutionSection />)
    expect(
      screen.getByText("IELTS Journey gives you what's missing.")
    ).toBeInTheDocument()
  })

  it('renders the three solution cards', () => {
    render(<SolutionSection />)
    expect(screen.getByText('AI Study Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Daily Learning Missions')).toBeInTheDocument()
    expect(screen.getByText('Visible Progress')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<SolutionSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<SolutionSection />)
    expect(screen.getByText(/IELTS Journey gives you/).closest('section')).toHaveAttribute('id', 'solution')
  })
})

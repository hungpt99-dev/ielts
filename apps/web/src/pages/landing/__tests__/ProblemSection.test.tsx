import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProblemSection from '../ProblemSection'

describe('ProblemSection', () => {
  it('renders the section heading', () => {
    render(<ProblemSection />)
    expect(
      screen.getByText('Studying for IELTS alone is hard.')
    ).toBeInTheDocument()
  })

  it('renders the four problem cards', () => {
    render(<ProblemSection />)
    expect(screen.getByText('Too many resources')).toBeInTheDocument()
    expect(screen.getByText('No structure')).toBeInTheDocument()
    expect(screen.getByText('No feedback')).toBeInTheDocument()
    expect(screen.getByText('No progress visibility')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<ProblemSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute for navigation', () => {
    render(<ProblemSection />)
    expect(screen.getByText(/Studying for IELTS alone/).closest('section')).toHaveAttribute('id', 'problems')
  })
})

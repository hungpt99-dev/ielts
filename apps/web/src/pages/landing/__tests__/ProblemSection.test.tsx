import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProblemSection from '../ProblemSection'

describe('ProblemSection', () => {
  it('renders the section heading', () => {
    render(<ProblemSection />)
    expect(
      screen.getByText('The struggle is real')
    ).toBeInTheDocument()
  })

  it('renders all seven problems as list items', () => {
    render(<ProblemSection />)
    expect(screen.getByText('They do not know where to start.')).toBeInTheDocument()
    expect(screen.getByText('They do not know the correct learning path.')).toBeInTheDocument()
    expect(screen.getByText('They waste time searching across too many websites.')).toBeInTheDocument()
    expect(screen.getByText('They study randomly without a clear plan.')).toBeInTheDocument()
    expect(screen.getByText('They do not know what to focus on each day.')).toBeInTheDocument()
    expect(screen.getByText('They feel overwhelmed by too many resources.')).toBeInTheDocument()
    expect(screen.getByText('They lose motivation because progress is not clear.')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<ProblemSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute for navigation', () => {
    render(<ProblemSection />)
    expect(screen.getByText(/The struggle is real/).closest('section')).toHaveAttribute('id', 'problems')
  })
})

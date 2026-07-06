import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HowItWorksSection from '../HowItWorksSection'

describe('HowItWorksSection', () => {
  it('renders the section heading', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Start learning in 4 simple steps.')).toBeInTheDocument()
  })

  it('renders all four steps', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Set Your Goal')).toBeInTheDocument()
    expect(screen.getByText('AI Builds Your Plan')).toBeInTheDocument()
    expect(screen.getByText('Study Daily')).toBeInTheDocument()
    expect(screen.getByText('Track & Improve')).toBeInTheDocument()
  })

  it('renders step badges', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Step 1')).toBeInTheDocument()
    expect(screen.getByText('Step 2')).toBeInTheDocument()
    expect(screen.getByText('Step 3')).toBeInTheDocument()
    expect(screen.getByText('Step 4')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<HowItWorksSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Start learning in 4 simple steps.').closest('section')).toHaveAttribute('id', 'how-it-works')
  })
})

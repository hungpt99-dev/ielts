import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeatureGrid from '../FeatureGrid'

describe('FeatureGrid', () => {
  it('renders the section heading', () => {
    render(<FeatureGrid />)
    expect(
      screen.getByText('Everything you need to master IELTS')
    ).toBeInTheDocument()
  })

  it('renders the free tagline', () => {
    render(<FeatureGrid />)
    expect(
      screen.getByText('All features are free. No hidden limits.')
    ).toBeInTheDocument()
  })

  it('renders all feature items', () => {
    render(<FeatureGrid />)
    expect(screen.getByText('IELTS word highlighter')).toBeInTheDocument()
    expect(
      screen.getByText('Click to see meaning and examples')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Save vocabulary from any webpage')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Save articles to study later')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Generate IELTS Reading questions')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Speaking Part 1, 2, 3 questions')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Extract Writing Task 2 ideas')
    ).toBeInTheDocument()
    expect(screen.getByText('Daily study plan')).toBeInTheDocument()
    expect(screen.getByText('Progress dashboard')).toBeInTheDocument()
    expect(
      screen.getByText('Local-first data storage')
    ).toBeInTheDocument()
    expect(screen.getByText('Import and export data')).toBeInTheDocument()
    expect(
      screen.getByText('AI tutor with your own API key')
    ).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<FeatureGrid />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute for navigation', () => {
    render(<FeatureGrid />)
    expect(screen.getByText(/Everything you need/).closest('section')).toHaveAttribute('id', 'features')
  })
})

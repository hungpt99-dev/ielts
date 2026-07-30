import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FeatureGrid from '../FeatureGrid'

describe('FeatureGrid', () => {
  it('renders the section heading', () => {
    render(<FeatureGrid />)
    expect(
      screen.getByText(/All features/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/100% free/)
    ).toBeInTheDocument()
  })

  it('renders the free tagline', () => {
    render(<FeatureGrid />)
    expect(
      screen.getByText(/Everything you need to master IELTS/)
    ).toBeInTheDocument()
  })

  it('renders all feature categories', () => {
    render(<FeatureGrid />)
    expect(screen.getByText('IELTS word highlighter')).toBeInTheDocument()
    expect(screen.getByText('Daily study plan')).toBeInTheDocument()
    expect(screen.getByText('Progress dashboard')).toBeInTheDocument()
    expect(screen.getByText('AI Tutor')).toBeInTheDocument()
    expect(screen.getByText('Local-first storage')).toBeInTheDocument()
    expect(screen.getByText('Import & Export')).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<FeatureGrid />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute for navigation', () => {
    render(<FeatureGrid />)
    expect(screen.getByText(/All features/).closest('section')).toHaveAttribute('id', 'features')
  })
})

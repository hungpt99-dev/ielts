import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config', () => ({
  CREATOR: {
    name: 'Phạm Thanh Hưng',
    englishName: 'Harry',
    role: 'Software Engineer Full-stack',
    background: 'Test background',
    currentFocus: 'Test focus',
    openTo: 'Test openings',
    github: 'https://github.com/hungpt99-dev',
    email: 'test@example.com',
    cv: 'https://example.com/cv.pdf',
    linkedin: 'https://linkedin.com/in/test',
  },
}))

import CreatorSection from '../CreatorSection'

describe('CreatorSection with all links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Contact Me when email is configured', () => {
    render(<CreatorSection />)
    const contact = screen.getByText('Contact Me')
    expect(contact).toBeInTheDocument()
    expect(contact.closest('a')).toHaveAttribute('href', 'mailto:test@example.com')
  })

  it('renders Download CV when cv is configured', () => {
    render(<CreatorSection />)
    const cv = screen.getByText('Download CV')
    expect(cv).toBeInTheDocument()
    expect(cv.closest('a')).toHaveAttribute('href', 'https://example.com/cv.pdf')
    expect(cv.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('renders LinkedIn when linkedin is configured', () => {
    render(<CreatorSection />)
    const linkedin = screen.getByText('LinkedIn')
    expect(linkedin).toBeInTheDocument()
    expect(linkedin.closest('a')).toHaveAttribute('href', 'https://linkedin.com/in/test')
    expect(linkedin.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('hides fallback text when links are configured', () => {
    render(<CreatorSection />)
    expect(
      screen.queryByText(/Contact links coming soon/)
    ).not.toBeInTheDocument()
  })
})

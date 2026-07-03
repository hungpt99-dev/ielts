import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as config from '../config'

vi.mock('../config', () => ({
  CREATOR: {
    name: 'Phạm Thanh Hưng',
    englishName: 'Harry',
    role: 'Software Engineer Full-stack',
    background:
      'Java/Spring Boot backend developer with experience building production systems, browser extensions, local-first applications, and AI-powered tools.',
    currentFocus:
      'Building useful AI tools, browser extensions, and learning products.',
    openTo:
      'Software Engineer, Backend Engineer, Full-stack Engineer, Java/Spring Boot Engineer, AI tool development, browser extension development, remote work, and freelance projects.',
    github: 'https://github.com/hungpt99-dev',
    email: '',
    cv: '',
    linkedin: '',
  },
}))

import CreatorSection from '../CreatorSection'

describe('CreatorSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the section heading', () => {
    render(<CreatorSection />)
    expect(
      screen.getByText('Built by one developer')
    ).toBeInTheDocument()
  })

  it('renders creator name and role', () => {
    render(<CreatorSection />)
    expect(screen.getByText('Phạm Thanh Hưng')).toBeInTheDocument()
    expect(
      screen.getByText(/Harry · Software Engineer Full-stack/)
    ).toBeInTheDocument()
  })

  it('renders creator background', () => {
    render(<CreatorSection />)
    expect(
      screen.getByText(/Java\/Spring Boot backend developer/)
    ).toBeInTheDocument()
  })

  it('renders current focus', () => {
    render(<CreatorSection />)
    expect(
      screen.getByText(/Building useful AI tools/)
    ).toBeInTheDocument()
  })

  it('renders open to text', () => {
    render(<CreatorSection />)
    expect(screen.getByText(/Software Engineer, Backend Engineer/)).toBeInTheDocument()
  })

  it('renders GitHub link', () => {
    render(<CreatorSection />)
    const githubLink = screen.getByText('View GitHub')
    expect(githubLink).toBeInTheDocument()
    expect(githubLink.closest('a')).toHaveAttribute(
      'href',
      'https://github.com/hungpt99-dev'
    )
  })

  it('does not render Contact Me when email is empty', () => {
    render(<CreatorSection />)
    expect(screen.queryByText('Contact Me')).not.toBeInTheDocument()
  })

  it('does not render Download CV when cv is empty', () => {
    render(<CreatorSection />)
    expect(screen.queryByText('Download CV')).not.toBeInTheDocument()
  })

  it('does not render LinkedIn when linkedin is empty', () => {
    render(<CreatorSection />)
    expect(screen.queryByText('LinkedIn')).not.toBeInTheDocument()
  })

  it('shows fallback text when all optional links are missing', () => {
    render(<CreatorSection />)
    expect(
      screen.getByText(/Contact links coming soon/)
    ).toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<CreatorSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<CreatorSection />)
    expect(screen.getByText('Built by one developer').closest('section')).toHaveAttribute('id', 'creator')
  })
})

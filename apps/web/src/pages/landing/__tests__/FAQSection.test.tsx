import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import FAQSection from '../FAQSection'

describe('FAQSection', () => {
  it('renders the section heading', () => {
    render(<FAQSection />)
    expect(
      screen.getByText('Frequently asked questions')
    ).toBeInTheDocument()
  })

  it('renders all six FAQ questions', () => {
    render(<FAQSection />)
    expect(screen.getByText('Is IELTS Journey free?')).toBeInTheDocument()
    expect(
      screen.getByText('Do I need to search for IELTS materials myself?')
    ).toBeInTheDocument()
    expect(screen.getByText('Can beginners use it?')).toBeInTheDocument()
    expect(
      screen.getByText('Does it support personalized learning?')
    ).toBeInTheDocument()
    expect(screen.getByText('Does it need a backend?')).toBeInTheDocument()
    expect(screen.getByText('Is there an AI Tutor?')).toBeInTheDocument()
  })

  it('renders all FAQ buttons with aria-expanded attribute', () => {
    render(<FAQSection />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(6)
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded')
    })
  })

  it('starts with all answers hidden', () => {
    render(<FAQSection />)
    expect(
      screen.queryByText(/The basic version can be free/)
    ).not.toBeInTheDocument()
  })

  it('toggles answer visibility on click', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)

    const firstButton = screen.getByText('Is IELTS Journey free?')
    await user.click(firstButton)

    expect(
      screen.getByText(/The basic version can be free/)
    ).toBeInTheDocument()

    await user.click(firstButton)

    expect(
      screen.queryByText(/The basic version can be free/)
    ).not.toBeInTheDocument()
  })

  it('renders a semantic section with heading level 2', () => {
    render(<FAQSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('has an id attribute', () => {
    render(<FAQSection />)
    expect(
      screen.getByText('Frequently asked questions').closest('section')
    ).toHaveAttribute('id', 'faq')
  })

  it('uses semantic dl, dt, dd elements', () => {
    render(<FAQSection />)
    expect(document.querySelector('dl')).toBeInTheDocument()
    expect(document.querySelectorAll('dt')).toHaveLength(6)
    expect(document.querySelectorAll('dd')).toHaveLength(0)
  })

  it('renders dd element when answer is toggled open', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)

    const firstButton = screen.getByText('Is IELTS Journey free?')
    await user.click(firstButton)

    expect(document.querySelectorAll('dd')).toHaveLength(1)
  })
})

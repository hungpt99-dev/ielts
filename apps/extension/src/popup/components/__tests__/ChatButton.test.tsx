import { describe, it, expect, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import ChatButton from '../ChatButton'

function setup() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  return { container, root }
}

function cleanup(root: Root, container: HTMLDivElement) {
  act(() => root.unmount())
  document.body.removeChild(container)
}

function getButton(): HTMLButtonElement | null {
  return document.querySelector('button[aria-label="Open chat"], button[aria-label="Close chat"]')
}

function getDialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]')
}

describe('ChatButton', () => {
  it('toggles popup open and closed on button clicks', () => {
    const { root, container } = setup()

    act(() => { root.render(<ChatButton />) })

    expect(getDialog()).toBeNull()
    expect(getButton()?.getAttribute('aria-label')).toBe('Open chat')

    act(() => { getButton()?.click() })
    expect(getDialog()).not.toBeNull()
    expect(getButton()?.getAttribute('aria-label')).toBe('Close chat')

    act(() => { getButton()?.click() })
    expect(getDialog()).toBeNull()
    expect(getButton()?.getAttribute('aria-label')).toBe('Open chat')

    act(() => { getButton()?.click() })
    expect(getDialog()).not.toBeNull()
    expect(getButton()?.getAttribute('aria-label')).toBe('Close chat')

    cleanup(root, container)
  })

  it('calls onToggle when popup state changes', () => {
    const onToggle = vi.fn()
    const { root, container } = setup()

    act(() => { root.render(<ChatButton onToggle={onToggle} />) })

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith(false)

    act(() => { getButton()?.click() })
    expect(onToggle).toHaveBeenCalledTimes(2)
    expect(onToggle).toHaveBeenCalledWith(true)

    act(() => { getButton()?.click() })
    expect(onToggle).toHaveBeenCalledTimes(3)
    expect(onToggle).toHaveBeenCalledWith(false)

    cleanup(root, container)
  })

  it('starts closed by default', () => {
    const { root, container } = setup()
    act(() => { root.render(<ChatButton />) })
    expect(getDialog()).toBeNull()
    expect(getButton()?.getAttribute('aria-label')).toBe('Open chat')
    cleanup(root, container)
  })

  it('can be toggled multiple times', () => {
    const onToggle = vi.fn()
    const { root, container } = setup()

    act(() => { root.render(<ChatButton onToggle={onToggle} />) })

    for (let i = 0; i < 5; i++) {
      act(() => { getButton()?.click() })
    }

    expect(onToggle).toHaveBeenCalledTimes(6)

    const expectedCalls = [false, true, false, true, false, true]
    for (let i = 0; i < expectedCalls.length; i++) {
      expect(onToggle).toHaveBeenNthCalledWith(i + 1, expectedCalls[i])
    }

    cleanup(root, container)
  })

  it('renders without onToggle prop', () => {
    const { root, container } = setup()
    act(() => { root.render(<ChatButton />) })
    expect(getButton()).not.toBeNull()
    cleanup(root, container)
  })
})

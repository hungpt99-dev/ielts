import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import DashboardCard from '../DashboardCard'

function setup(label: string, value: number, icon: string, accent?: boolean) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => { root.render(<DashboardCard label={label} value={value} icon={icon} accent={accent} />) })
  return { container, root }
}

function cleanup(root: ReturnType<typeof createRoot>, container: HTMLDivElement) {
  act(() => root.unmount())
  document.body.removeChild(container)
}

describe('DashboardCard', () => {
  it('renders label and value', () => {
    const { root, container } = setup('Words', 42, '📖')
    expect(container.textContent).toContain('Words')
    expect(container.textContent).toContain('42')
    expect(container.textContent).toContain('📖')
    cleanup(root, container)
  })

  it('renders with accent styling', () => {
    const { root, container } = setup('Streak', 7, '🔥', true)
    const card = container.querySelector('div')
    expect(container.textContent).toContain('Streak')
    expect(container.textContent).toContain('7')
    cleanup(root, container)
  })

  it('renders zero value correctly', () => {
    const { root, container } = setup('None', 0, '⚪')
    expect(container.textContent).toContain('0')
    cleanup(root, container)
  })

  it('renders large values without overflow', () => {
    const { root, container } = setup('Count', 99999, '📊')
    expect(container.textContent).toContain('99999')
    cleanup(root, container)
  })
})

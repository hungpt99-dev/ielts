import { useCallback, useEffect, useRef } from 'react'
import type { PanelTab } from '../../App'
import { useScrollable } from '../hooks/useScrollable'

export interface TabDefinition {
  id: PanelTab
  label: string
}

export interface TabBarProps {
  tabs: TabDefinition[]
  activeTab: PanelTab
  onChange: (tab: PanelTab) => void
}

export function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  const { containerRef, canScrollLeft, canScrollRight, scrollBy, scrollTabIntoView } = useScrollable<HTMLDivElement>()
  const activeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeButtonRef.current) {
      activeButtonRef.current.focus()
      scrollTabIntoView(activeButtonRef.current)
    }
  }, [activeTab, scrollTabIntoView])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = (index + 1) % tabs.length
        onChange(tabs[next].id)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = (index - 1 + tabs.length) % tabs.length
        onChange(tabs[prev].id)
      } else if (e.key === 'Home') {
        e.preventDefault()
        onChange(tabs[0].id)
      } else if (e.key === 'End') {
        e.preventDefault()
        onChange(tabs[tabs.length - 1].id)
      }
    },
    [tabs, onChange],
  )

  return (
    <div
      style={{
        position: 'relative',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {canScrollLeft && (
        <button
          onClick={() => scrollBy('left')}
          aria-label="Scroll tabs left"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            border: 'none',
            background: 'linear-gradient(to right, var(--color-background), transparent)',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 0 0 4px',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'opacity var(--transition-fast)',
          }}
        >
          ‹
        </button>
      )}
      <div
        ref={containerRef}
        role="tablist"
        aria-orientation="horizontal"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent',
        }}
      >
        <div style={{ display: 'flex', gap: 0, width: 'max-content', minWidth: '100%' }}>
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                ref={isActive ? activeButtonRef : undefined}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0,
                  marginBottom: '-1px',
                  transition: 'color var(--transition-fast), border-color var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      {canScrollRight && (
        <button
          onClick={() => scrollBy('right')}
          aria-label="Scroll tabs right"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            border: 'none',
            background: 'linear-gradient(to left, var(--color-background), transparent)',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 4px 0 0',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'opacity var(--transition-fast)',
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}

import { type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

const variantStyles = {
  default: {
    container: {
      display: 'flex',
      gap: '0',
      borderBottom: '1px solid var(--color-border-light)',
      width: '100%',
    } as const,
    tab: (active: boolean) => ({
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--text-sm)',
      fontWeight: active ? 'var(--weight-semibold)' as const : 'var(--weight-medium)' as const,
      color: active ? 'var(--color-primary)' as const : 'var(--color-text-secondary)' as const,
      background: 'none',
      border: 'none',
      borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'all var(--transition-fast)',
      whiteSpace: 'nowrap',
      marginBottom: '-1px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-2xs)',
    }),
  },
  pills: {
    container: {
      display: 'flex',
      gap: 'var(--spacing-2xs)',
      width: '100%',
    } as const,
    tab: (active: boolean) => ({
      padding: 'var(--spacing-xs) var(--spacing-md)',
      fontSize: 'var(--text-sm)',
      fontWeight: active ? 'var(--weight-semibold)' as const : 'var(--weight-medium)' as const,
      color: active ? 'var(--color-primary)' as const : 'var(--color-text-secondary)' as const,
      background: active ? 'var(--color-primary-light)' as const : 'var(--color-surface-alt)' as const,
      border: '1px solid transparent',
      borderRadius: 'var(--radius-full)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'all var(--transition-fast)',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-2xs)',
    }),
  },
  underline: {
    container: {
      display: 'flex',
      gap: '0',
      borderBottom: '2px solid var(--color-border-light)',
      width: '100%',
    } as const,
    tab: (active: boolean) => ({
      padding: 'var(--spacing-sm) var(--spacing-lg)',
      fontSize: 'var(--text-sm)',
      fontWeight: active ? 'var(--weight-semibold)' as const : 'var(--weight-medium)' as const,
      color: active ? 'var(--color-primary)' as const : 'var(--color-text-secondary)' as const,
      background: 'none',
      border: 'none',
      borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'all var(--transition-fast)',
      whiteSpace: 'nowrap',
      marginBottom: '-2px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-2xs)',
    }),
  },
}

const sizeStyle: Record<string, Record<string, string>> = {
  sm: { padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--text-xs)' },
  md: {},
}

type TabVariantConfig = {
  container: Record<string, string>
  tab: (active: boolean) => Record<string, string>
}

const variantStyle: Record<string, TabVariantConfig> = variantStyles

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
}: TabsProps) {
  const v = variantStyle[variant]

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      style={{
        ...v.container,
        ...(fullWidth ? { display: 'flex' } : {}),
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const tabStyle = v.tab(isActive)

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            style={{
              ...tabStyle,
              ...sizeStyle[size],
              ...(fullWidth ? { flex: 1, justifyContent: 'center' } : {}),
              ...(tab.disabled ? { opacity: '0.4', cursor: 'not-allowed' } : {}),
            }}
          >
            {tab.icon && (
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  minWidth: '18px',
                  height: '18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: isActive ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 'var(--weight-bold)',
      borderRadius: 'var(--radius-2xl)',
                  lineHeight: 1,
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

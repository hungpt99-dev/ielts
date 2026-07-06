import { type HTMLAttributes, type ReactNode } from 'react'

export interface ExtensionActionMenuItem {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

export interface ExtensionActionMenuProps extends HTMLAttributes<HTMLDivElement> {
  items: ExtensionActionMenuItem[]
  position?: { x: number; y: number }
  onClose: () => void
  origin?: 'popup' | 'content'
}

export function ExtensionActionMenu({
  items,
  position,
  onClose,
  origin = 'popup',
  style,
  ...props
}: ExtensionActionMenuProps) {
  const menuStyle: Record<string, string> =
    origin === 'content'
      ? {
          position: 'fixed',
          zIndex: 'var(--z-extension-menu)',
          minWidth: '200px',
          ...(position ? { left: `${position.x}px`, top: `${position.y}px` } : {}),
        }
      : {
          width: '100%',
        }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3xs)',
        padding: 'var(--spacing-xs)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn var(--transition-fast)',
        boxSizing: 'border-box',
        ...menuStyle,
        ...(style as Record<string, string>),
      }}
      role="menu"
      {...props}
    >
      {position && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
          }}
          onClick={onClose}
        />
      )}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          title={item.label}
          onClick={(e) => {
            e.stopPropagation()
            if (!item.disabled) {
              item.onClick()
              onClose()
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-sm)',
            background: 'none',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? '0.4' : '1',
            color: item.danger ? 'var(--color-danger)' : 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'left',
            transition: 'background var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.style.background = 'var(--color-surface-alt)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
          }}
        >
          {item.icon && (
            <span
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                fontSize: 'var(--text-base)',
                width: 'var(--spacing-lg)',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  )
}

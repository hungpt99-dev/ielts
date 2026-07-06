import { type HTMLAttributes, type ReactNode } from 'react'

export interface ExtensionPopupCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  compact?: boolean
  children?: ReactNode
}

export function ExtensionPopupCard({
  icon,
  title,
  subtitle,
  action,
  compact = false,
  children,
  style,
  ...props
}: ExtensionPopupCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
        padding: compact ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        boxSizing: 'border-box',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {(icon || title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--color-primary)',
                fontSize: compact ? 'var(--text-base)' : 'var(--text-lg)',
              }}
            >
              {icon}
            </span>
          )}
          {(title || subtitle) && (
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && (
                <span
                  style={{
                    fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 'var(--leading-tight)',
                  }}
                >
                  {title}
                </span>
              )}
              {subtitle && (
                <p
                  style={{
                    margin: 'var(--spacing-3xs) 0 0',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 'var(--leading-normal)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

import { type HTMLAttributes, type ReactNode } from 'react'

export interface SettingsSectionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  children?: ReactNode
}

export function SettingsSectionCard({
  title,
  description,
  icon,
  action,
  children,
  style,
  ...props
}: SettingsSectionCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-lg)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        width: '100%',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-2xl)',
                height: 'var(--spacing-2xl)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-lg)',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {title}
            </h3>
            {description && (
              <p
                style={{
                  margin: 'var(--spacing-3xs) 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children && (
        <div
          style={{
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border-light)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

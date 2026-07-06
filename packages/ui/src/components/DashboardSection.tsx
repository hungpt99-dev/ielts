import { type HTMLAttributes, type ReactNode } from 'react'

export interface DashboardSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  children?: ReactNode
}

export function DashboardSection({
  title,
  description,
  action,
  icon,
  children,
  style,
  ...props
}: DashboardSectionProps) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
          }}
        >
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-xl)',
                height: 'var(--spacing-xl)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-lg)',
              }}
            >
              {icon}
            </span>
          )}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                style={{
                  margin: 'var(--spacing-3xs) 0 0',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </section>
  )
}

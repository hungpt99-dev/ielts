import type { ReactNode, HTMLAttributes } from 'react'

interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export default function PageSection({
  children,
  title,
  description,
  actions,
  className = '',
  ...props
}: PageSectionProps) {
  return (
    <section className={`mb-6 ${className}`} {...props}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            {title && (
              <h2
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

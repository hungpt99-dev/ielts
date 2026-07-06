import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconChevronRight } from '@ielts/ui'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
  iconBackground?: string
  iconColor?: string
}

export default function PageHeader({
  icon,
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  className = '',
  iconBackground,
  iconColor,
}: PageHeaderProps) {
  return (
    <div className={`w-full pt-4 sm:pt-6 mb-6 sm:mb-8 overflow-hidden ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }} aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <IconChevronRight size={12} aria-hidden="true" />}
              {item.href ? (
                <Link to={item.href} className="transition-colors hover:opacity-80">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 max-w-full">
          {icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: iconBackground || 'var(--color-primary-light)',
                color: iconColor || 'var(--color-primary)',
              }}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-xl font-bold leading-tight sm:text-2xl break-words"
                style={{ color: 'var(--color-text)' }}
              >
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p
                className="mt-1 text-sm leading-relaxed break-words"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

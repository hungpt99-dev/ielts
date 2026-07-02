import type { ReactNode } from 'react'
import Card, { CardContent } from './Card'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12">
          {icon ? (
            <div className="mb-4" style={{ color: 'var(--color-muted)' }}>
              {icon}
            </div>
          ) : (
            <svg
              className="mb-4 h-12 w-12"
              style={{ color: 'var(--color-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          )}
          <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
            {title}
          </p>
          {description && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              {description}
            </p>
          )}
          {action && (
            <Button className="mt-4" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

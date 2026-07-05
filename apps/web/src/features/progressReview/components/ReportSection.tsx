import type { ReactNode } from 'react'
import Card, { CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface ReportSectionProps {
  title: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  accentColor?: string
  children: ReactNode
}

export default function ReportSection({
  title,
  icon,
  action,
  accentColor,
  children,
}: ReportSectionProps) {
  return (
    <Card
      role="region"
      aria-label={title}
      className={accentColor ? 'border-l-4' : ''}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon && (
            <span className="shrink-0" aria-hidden="true" style={{ color: 'var(--color-muted)' }}>
              {icon}
            </span>
          )}
          <CardTitle>{title}</CardTitle>
        </div>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardHeader>
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {children}
      </div>
    </Card>
  )
}

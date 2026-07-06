import type { ReactNode } from 'react'
import { Button } from '../../../../../packages/ui/src/components/Button'
import { IconEmpty, IconExtension, IconLock, IconBookText, IconArticle, IconClock, IconCheckCircle } from '@ielts/ui'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
}

const DEFAULT_ICON = (
  <IconEmpty size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
)

const CONTEXTUAL_MESSAGES: Record<string, { icon: ReactNode; title: string; description: string; actionLabel?: string }> = {
  'no-selection': {
    icon: (
      <IconExtension size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'Select text on any webpage',
    description: 'Highlight text to explain, simplify, or save it to your IELTS notebook.',
  },
  'not-logged-in': {
    icon: (
      <IconLock size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'Sign in to sync your data',
    description: 'Connect your account to save vocabulary, track progress across devices, and unlock AI Tutor features.',
    actionLabel: 'Sign In',
  },
  'no-saved-words': {
    icon: (
      <IconBookText size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'No saved words yet',
    description: 'Save words from webpages to build your IELTS vocabulary notebook.',
    actionLabel: 'Learn How',
  },
  'no-articles': {
    icon: (
      <IconArticle size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'No saved articles',
    description: 'Save interesting articles from any webpage to read and study later.',
    actionLabel: 'Save an Article',
  },
  'no-activity': {
    icon: (
      <IconClock size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'No activity yet',
    description: 'Start learning by saving text from any webpage!',
    actionLabel: 'Start Learning',
  },
  'no-pending-reviews': {
    icon: (
      <IconCheckCircle size={36} style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
    ),
    title: 'All caught up!',
    description: 'No vocabulary due for review. Great job keeping up with your studies!',
  },
}

export function getExtensionEmptyState(key: string): { icon: ReactNode; title: string; description: string } {
  return CONTEXTUAL_MESSAGES[key] || {
    icon: DEFAULT_ICON,
    title: 'Nothing here yet',
    description: 'Start using IELTS Journey to populate this section.',
  }
}

export default function EmptyState({ icon, title, description, action, secondaryAction, compact }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 'var(--spacing-md) var(--spacing-sm)' : 'var(--spacing-2xl) var(--spacing-md)',
        gap: 'var(--spacing-xs)',
        textAlign: 'center',
        flex: 1,
        minHeight: compact ? 'auto' : '200px',
        width: '100%',
      }}
    >
      {icon ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-2xs)' }}>
          {icon}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-2xs)' }}>
          {DEFAULT_ICON}
        </div>
      )}
      <p
        style={{
          margin: 0,
          fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-relaxed)',
            maxWidth: '400px',
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 'var(--spacing-xs)' }}>
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
      {secondaryAction && (
        <div style={{ marginTop: 'var(--spacing-2xs)' }}>
          <Button variant="ghost" size="xs" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        </div>
      )}
    </div>
  )
}

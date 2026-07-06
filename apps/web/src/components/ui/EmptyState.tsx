import type { ReactNode } from 'react'
import Card, { CardContent } from './Card'
import Button from './Button'
import { IconVocabularyBook, IconTodayPlan, IconProgress, IconRefresh, IconSearch, IconVocabulary, IconAITutor, IconExtension, IconAlertCircle, IconEmpty } from '@ielts/ui'

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

const STATE_ICONS: Record<string, ReactNode> = {
  vocabulary: <IconVocabularyBook size={48} />,
  plan: <IconTodayPlan size={48} />,
  progress: <IconProgress size={48} />,
  review: <IconRefresh size={48} />,
  search: <IconSearch size={48} />,
  book: <IconVocabulary size={48} />,
  tutor: <IconAITutor size={48} />,
  extension: <IconExtension size={48} />,
  error: <IconAlertCircle size={48} />,
  default: <IconEmpty size={48} />,
}

function getStateIcon(variant: string): ReactNode {
  return STATE_ICONS[variant] || STATE_ICONS.default
}

const variantGradients: Record<string, string> = {
  vocabulary: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
  plan: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
  progress: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
  review: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
  search: 'from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20',
  book: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20',
  tutor: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
  extension: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20',
  error: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
  default: 'from-slate-50 to-gray-50 dark:from-slate-950/10 dark:to-gray-950/10',
}

const STATUS_MESSAGES: Record<string, { title: string; description: string; actionLabel?: string }> = {
  'no-vocabulary': {
    title: 'Your vocabulary notebook is empty',
    description: 'Save words from articles, lessons, or the browser extension to start building your IELTS word bank.',
    actionLabel: 'Save New Word',
  },
  'no-study-plan': {
    title: 'No study plan yet',
    description: 'Generate a personalized roadmap from today to your exam day.',
    actionLabel: 'Create Plan',
  },
  'no-progress': {
    title: 'No progress data yet',
    description: 'Complete a few lessons first, then AI Tutor can review your progress and recommend what to improve.',
    actionLabel: 'Start Learning',
  },
  'no-mistakes': {
    title: 'No mistakes recorded',
    description: 'Great start! As you practice, mistakes will be saved here for review.',
  },
  'no-articles': {
    title: 'No saved articles',
    description: 'Save articles from the browser extension to read and study later.',
    actionLabel: 'Install Extension',
  },
  'no-text': {
    title: 'No saved text',
    description: 'Select text on any webpage and save it here for later review.',
    actionLabel: 'Learn More',
  },
  'no-tasks': {
    title: 'No tasks for today',
    description: 'Plan your study session or generate a daily plan to get started.',
    actionLabel: 'Create Plan',
  },
  'no-ai-chat': {
    title: 'No conversations yet',
    description: 'Start a chat with AI Tutor to get personalized help with your IELTS preparation.',
    actionLabel: 'Start Chat',
  },
  'no-review-history': {
    title: 'No review history',
    description: 'Complete vocabulary reviews to track your learning progress over time.',
    actionLabel: 'Review Now',
  },
  'no-weak-skills': {
    title: 'No weak skills detected',
    description: 'Continue practicing all skills evenly. AI Tutor will identify areas needing improvement as you learn.',
  },
  'no-extension-connected': {
    title: 'Browser extension not connected',
    description: 'Install the IELTS Journey extension to save vocabulary and text from any webpage.',
    actionLabel: 'Install Extension',
  },
  'all-caught-up': {
    title: 'All caught up!',
    description: 'Great work! You have completed everything. Time to relax or explore something new.',
  },
}

export function getEmptyStateMessage(key: string): { title: string; description: string; actionLabel?: string } {
  return STATUS_MESSAGES[key] || { title: 'Nothing here yet', description: 'Start using IELTS Journey to populate this section.' }
}

export default function EmptyState({ icon, title, description, action, secondaryAction, compact }: EmptyStateProps) {
  const displayIcon = icon ?? STATE_ICONS.default

  return (
    <Card>
      <CardContent>
        <div className={`flex flex-col items-center justify-center ${compact ? 'py-8' : 'py-12 sm:py-16'}`}>
          <div className="mb-4" style={{ color: 'var(--color-muted)' }}>
            {displayIcon}
          </div>
          <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </p>
      {description && (
        <p className={`mt-2 w-full text-center leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
          {action && (
            <Button className="mt-5" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button className="mt-2" variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyStateInline({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10" style={{ borderColor: 'var(--color-border)' }}>
      {icon && (
        <div className="mb-3" style={{ color: 'var(--color-muted)' }}>
          {icon}
        </div>
      )}
      <p className="text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      {description && (
        <p className="mt-1 w-full text-center text-xs" style={{ color: 'var(--color-muted)' }}>
          {description}
        </p>
      )}
      {action && (
        <Button className="mt-4" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function EmptyStateCard({
  variant = 'default',
  icon,
  title,
  description,
  action,
  compact,
}: EmptyStateProps & { variant?: string }) {
  const displayIcon = icon ?? getStateIcon(variant)

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br p-6 sm:p-8 ${variantGradients[variant] || variantGradients.default}`}
      style={{ border: `1px solid var(--color-border)` }}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}>
        {displayIcon}
      </div>
      <p className={`text-center font-semibold ${compact ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--color-text)' }}>
        {title}
      </p>
      {description && (
        <p className={`mt-2 w-full text-center leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {action && (
        <Button className="mt-5" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function EmptyStateIllustrated({
  variant = 'default',
  title,
  description,
  action,
  secondaryAction,
  compact,
}: EmptyStateProps & { variant?: string }) {
  const displayIcon = getStateIcon(variant)

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br p-6 sm:p-8 ${variantGradients[variant] || variantGradients.default}`}
      style={{ border: `1px solid var(--color-border)` }}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}>
        {displayIcon}
      </div>
      <p className={`text-center font-semibold ${compact ? 'text-sm' : 'text-lg'}`} style={{ color: 'var(--color-text)' }}>
        {title}
      </p>
      {description && (
        <p className={`mt-2 w-full text-center leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-3">
        {action && (
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

type ErrorStateVariant = 'card' | 'inline' | 'fullscreen'

interface ErrorStateProps {
  message?: string
  error?: unknown
  onRetry?: () => void
  retryLabel?: string
  variant?: ErrorStateVariant
  title?: string
  compact?: boolean
}

export function ErrorState({
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'card',
  title,
  compact,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : message || 'Something went wrong'
  const displayTitle = title || 'Something went wrong'

  if (variant === 'inline') {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        style={{
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
        }}
        role="alert"
      >
        <IconAlertCircle size={16} />
        <span className="flex-1 text-xs">{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-medium underline"
            style={{ color: 'var(--color-danger)' }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-danger-light)' }}>
            <IconAlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {displayTitle}
          </h3>
          <p className={`mt-2 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
            {errorMessage}
          </p>
          {onRetry && (
            <Button className="mt-5" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
      </div>
    </div>
  )
}

  return (
    <div className="flex min-h-[200px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
          <IconAlertCircle size={24} />
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          {displayTitle}
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {errorMessage}
        </p>
        {onRetry && (
          <Button className="mt-4" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

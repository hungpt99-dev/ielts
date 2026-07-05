import { useCallback } from 'react'
import type { ProactiveMessage } from '../../../services/ProactiveMessageEngine'

const CATEGORY_LABELS: Record<string, string> = {
  'vocabulary-review': 'Vocabulary',
  'mistake-review': 'Mistake',
  'study-plan': 'Study Plan',
  'speaking-practice': 'Speaking',
  'writing-practice': 'Writing',
  'reading-practice': 'Reading',
  'listening-practice': 'Listening',
  'exam-countdown': 'Exam',
  'motivation': 'Motivation',
  'saved-content': 'Saved Content',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--color-muted)',
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  'vocabulary-review': { bg: 'var(--color-primary-light)', fg: 'var(--color-primary)' },
  'mistake-review': { bg: 'var(--color-danger-light)', fg: 'var(--color-danger)' },
  'study-plan': { bg: '#dbeafe', fg: '#2563eb' },
  'exam-countdown': { bg: '#fef3c7', fg: '#d97706' },
  motivation: { bg: '#d1fae5', fg: '#059669' },
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

interface ProactiveMessageCardProps {
  message: ProactiveMessage
  onMarkRead?: (id: string) => void
  onDismiss?: (id: string) => void
  onSnooze?: (id: string) => void
  onAction?: (message: ProactiveMessage) => void
  compact?: boolean
}

export default function ProactiveMessageCard({
  message,
  onMarkRead,
  onDismiss,
  onSnooze,
  onAction,
  compact = false,
}: ProactiveMessageCardProps) {
  const handleAction = useCallback(() => {
    onAction?.(message)
  }, [onAction, message])

  const handleMarkRead = useCallback(() => {
    onMarkRead?.(message.id)
  }, [onMarkRead, message.id])

  const handleDismiss = useCallback(() => {
    onDismiss?.(message.id)
  }, [onDismiss, message.id])

  const handleSnooze = useCallback(() => {
    onSnooze?.(message.id)
  }, [onSnooze, message.id])

  const catColor = CATEGORY_COLORS[message.category] || { bg: 'var(--color-surface-alt)', fg: 'var(--color-text-secondary)' }
  const priorityColor = PRIORITY_COLORS[message.priority] || 'var(--color-muted)'

  return (
    <div
      className="flex gap-3 border-b px-4 py-3 transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: message.isRead ? 'transparent' : 'var(--color-primary-light)',
      }}
      role="listitem"
      aria-label={`${message.title} — ${message.category}`}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: message.isRead ? 'transparent' : priorityColor,
          }}
          aria-label={message.isRead ? 'Read' : 'Unread'}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
            style={{
              backgroundColor: catColor.bg,
              color: catColor.fg,
            }}
          >
            {CATEGORY_LABELS[message.category] || message.category}
          </span>
          {message.priority === 'high' && (
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
              style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
              }}
            >
              High
            </span>
          )}
          <span className="ml-auto text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {formatTime(message.createdAt)}
          </span>
        </div>

        <p className="mb-0.5 text-sm font-medium leading-tight" style={{ color: 'var(--color-text)' }}>
          {message.title}
        </p>

        {!compact && (
          <p className="mb-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {message.message}
          </p>
        )}

        {!compact && (
          <div className="flex flex-wrap items-center gap-1.5">
            {message.action && (
              <button
                onClick={handleAction}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary, #ffffff)',
                }}
                type="button"
              >
                {message.action.label}
              </button>
            )}

            {!message.isRead && onMarkRead && (
              <button
                onClick={handleMarkRead}
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                }}
                type="button"
              >
                Mark read
              </button>
            )}

            {onSnooze && (
              <button
                onClick={handleSnooze}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
                style={{ color: 'var(--color-muted)' }}
                type="button"
                title="Snooze 1 hour"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Snooze
              </button>
            )}

            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
                style={{ color: 'var(--color-muted)' }}
                type="button"
                title="Dismiss"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { CATEGORY_LABELS, formatTime }

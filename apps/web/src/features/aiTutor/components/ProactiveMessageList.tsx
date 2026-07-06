import { useState, useMemo, useCallback } from 'react'
import ProactiveMessageCard, { CATEGORY_LABELS, formatTime } from './ProactiveMessageCard'
import type { ProactiveMessage, ProactiveMessageCategory } from '../../../services/ProactiveMessageEngine'

const ALL_CATEGORIES: ProactiveMessageCategory[] = [
  'vocabulary-review',
  'mistake-review',
  'study-plan',
  'speaking-practice',
  'writing-practice',
  'reading-practice',
  'listening-practice',
  'exam-countdown',
  'motivation',
  'saved-content',
]

function getActiveCategories(messages: ProactiveMessage[]): ProactiveMessageCategory[] {
  const cats = new Set(messages.map(m => m.category))
  return ALL_CATEGORIES.filter(c => cats.has(c))
}

function sortMessages(messages: ProactiveMessage[]): ProactiveMessage[] {
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return [...messages].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2
    const pb = priorityOrder[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

interface ProactiveMessageListProps {
  messages: ProactiveMessage[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDismiss?: (id: string) => void
  onSnooze?: (id: string) => void
  onAction?: (message: ProactiveMessage) => void
  maxHeight?: string
  compact?: boolean
}

export default function ProactiveMessageList({
  messages,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onSnooze,
  onAction,
  maxHeight,
  compact = false,
}: ProactiveMessageListProps) {
  const [activeFilter, setActiveFilter] = useState<ProactiveMessageCategory | 'all'>('all')

  const categories = useMemo(() => getActiveCategories(messages), [messages])

  const unreadCount = useMemo(
    () => messages.filter(m => !m.isRead && !m.isDismissed && !m.isSnoozed).length,
    [messages],
  )

  const unreadCountFor = useCallback(
    (cat: ProactiveMessageCategory | 'all') => {
      if (cat === 'all') return unreadCount
      return messages.filter(m => m.category === cat && !m.isRead && !m.isDismissed && !m.isSnoozed).length
    },
    [messages, unreadCount],
  )

  const filteredMessages = useMemo(() => {
    const filtered = activeFilter === 'all' ? messages : messages.filter(m => m.category === activeFilter)
    return sortMessages(filtered)
  }, [messages, activeFilter])

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ color: 'var(--color-text)' }}>
      {/* Filter tabs */}
      <div
        className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => setActiveFilter('all')}
          className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: activeFilter === 'all' ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
            color: activeFilter === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
          type="button"
        >
          All
          {unreadCountFor('all') > 0 && (
            <span
              className="flex min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-tight"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'var(--color-on-danger, #fff)',
              }}
            >
              {unreadCountFor('all')}
            </span>
          )}
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: activeFilter === cat ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
              color: activeFilter === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
            type="button"
          >
            {CATEGORY_LABELS[cat] || cat}
            {unreadCountFor(cat) > 0 && (
              <span
                className="flex min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-tight"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-on-danger, #fff)',
                }}
              >
                {unreadCountFor(cat)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto"
        style={maxHeight ? { maxHeight } : undefined}
        role="list"
        aria-label="Proactive tutor messages"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: 'var(--color-surface-alt)' }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {activeFilter === 'all' ? 'No messages yet' : 'No messages in this category'}
            </p>
            <p className="max-w-xs text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {activeFilter === 'all'
                ? 'Proactive tutor messages will appear here when the AI Tutor has suggestions for you.'
                : 'Try a different category or check back later.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredMessages.map(msg => (
              <ProactiveMessageCard
                key={msg.id}
                message={msg}
                onMarkRead={onMarkRead}
                onDismiss={onDismiss}
                onSnooze={onSnooze}
                onAction={onAction}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {unreadCount > 0 && onMarkAllRead && (
        <div
          className="flex shrink-0 items-center justify-between border-t px-4 py-2.5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onMarkAllRead}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              color: 'var(--color-text-secondary)',
            }}
            type="button"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}

export { CATEGORY_LABELS, formatTime }

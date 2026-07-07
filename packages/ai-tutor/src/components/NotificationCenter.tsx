import { useState, useMemo, useCallback } from 'react'
import type { ProactiveMessage, ProactiveMessageCategory } from '../types'
import { PROACTIVE_CATEGORY_LABELS, PROACTIVE_PRIORITY_LABELS, formatMessageTime } from '../hooks/useProactiveMessages'
import { IconBell, IconClose, IconClock, IconDelete } from '../../../ui/src/icons/IconMap'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  messages: ProactiveMessage[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDismiss: (id: string) => void
  onSnooze: (id: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onAction: (msg: ProactiveMessage) => void
}

export function NotificationCenter({
  isOpen,
  onClose,
  messages,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onSnooze,
  onDelete,
  onClearAll,
  onAction,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<ProactiveMessageCategory | 'all'>('all')

  const categories = useMemo(() => {
    const cats = new Set(messages.map(m => m.category))
    return Array.from(cats)
  }, [messages])

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages
    return messages.filter(m => m.category === activeFilter)
  }, [messages, activeFilter])

  const unreadCountFor = useCallback(
    (cat: ProactiveMessageCategory | 'all') => {
      if (cat === 'all') return unreadCount
      return messages.filter(m => m.category === cat && !m.isRead && !m.isDismissed).length
    },
    [messages, unreadCount],
  )

  if (!isOpen) return null

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ color: 'var(--color-text)' }}>
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <IconBell size={20} />
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span
              className="flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-tight"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'var(--color-on-danger, #fff)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Close notifications"
        >
          <IconClose size={16} />
        </button>
      </div>

      {/* Category Filters */}
      <div
        className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <FilterTab
          label="All"
          isActive={activeFilter === 'all'}
          unread={unreadCountFor('all')}
          onClick={() => setActiveFilter('all')}
        />
        {categories.map((cat) => (
          <FilterTab
            key={cat}
            label={PROACTIVE_CATEGORY_LABELS[cat]}
            isActive={activeFilter === cat}
            unread={unreadCountFor(cat)}
            onClick={() => setActiveFilter(cat)}
          />
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <EmptyState activeFilter={activeFilter} />
        ) : (
          <div className="flex flex-col">
            {filteredMessages.map((msg) => (
              <MessageRow
                key={msg.id}
                message={msg}
                onMarkRead={onMarkRead}
                onSnooze={onSnooze}
                onDismiss={onDismiss}
                onDelete={onDelete}
                onAction={onAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex shrink-0 items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-alt)',
                color: 'var(--color-text-secondary)',
              }}
              type="button"
            >
              Mark all read
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearAll}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-danger)' }}
            type="button"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

function FilterTab({
  label,
  isActive,
  unread,
  onClick,
}: {
  label: string
  isActive: boolean
  unread: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
      style={{
        backgroundColor: isActive
          ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
          : 'var(--color-surface-alt)',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      }}
      type="button"
    >
      {label}
      {unread > 0 && (
        <span
          className="flex min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-tight"
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-on-danger, #fff)',
          }}
        >
          {unread}
        </span>
      )}
    </button>
  )
}

function EmptyState({ activeFilter }: { activeFilter: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{ backgroundColor: 'var(--color-surface-alt)' }}
      >
        <IconBell size={24} style={{ color: 'var(--color-muted)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {activeFilter === 'all' ? 'No notifications yet' : 'No notifications in this category'}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {activeFilter === 'all'
          ? 'Proactive tutor messages will appear here when the AI Tutor has suggestions for you.'
          : 'Try a different category or check back later.'}
      </p>
    </div>
  )
}

function MessageRow({
  message: msg,
  onMarkRead,
  onSnooze,
  onDismiss,
  onDelete,
  onAction,
}: {
  message: ProactiveMessage
  onMarkRead: (id: string) => void
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
  onDelete: (id: string) => void
  onAction: (msg: ProactiveMessage) => void
}) {
  return (
    <div
      className="flex gap-3 border-b px-4 py-3 transition-colors hover:opacity-90"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: msg.isRead
          ? 'transparent'
          : 'color-mix(in srgb, var(--color-primary) 3%, transparent)',
      }}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: msg.isRead ? 'transparent' : 'var(--color-primary)',
          }}
          aria-label={msg.isRead ? 'Read' : 'Unread'}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            {PROACTIVE_CATEGORY_LABELS[msg.category]}
          </span>
          {msg.priority === 'high' && (
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                color: 'var(--color-danger)',
              }}
            >
              {PROACTIVE_PRIORITY_LABELS[msg.priority]}
            </span>
          )}
          <span className="ml-auto text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {formatMessageTime(msg.createdAt)}
          </span>
        </div>

        <p className="mb-0.5 text-sm font-medium leading-tight" style={{ color: 'var(--color-text)' }}>
          {msg.title}
        </p>
        <p className="mb-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {msg.message}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {msg.action && (
            <button
              onClick={() => onAction(msg)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
              }}
              type="button"
            >
              {msg.action.label}
            </button>
          )}

          {!msg.isRead && (
            <button
              onClick={() => onMarkRead(msg.id)}
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

          <button
            onClick={() => onSnooze(msg.id)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--color-muted)' }}
            type="button"
            title="Snooze 1 hour"
          >
            <IconClock size={12} />
            Snooze
          </button>

          <button
            onClick={() => onDismiss(msg.id)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--color-muted)' }}
            type="button"
            title="Dismiss"
          >
            <IconClose size={12} />
            Dismiss
          </button>

          <button
            onClick={() => onDelete(msg.id)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
            style={{ color: 'var(--color-danger)' }}
            type="button"
            title="Delete"
          >
            <IconDelete size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

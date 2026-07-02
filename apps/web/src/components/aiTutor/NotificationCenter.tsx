import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { proactiveMessageEngine } from '../../services/ProactiveMessageEngine'
import type { ProactiveMessage, ProactiveMessageCategory } from '../../services/ProactiveMessageEngine'

const CATEGORY_LABELS: Record<ProactiveMessageCategory | 'all', string> = {
  all: 'All',
  'vocabulary-review': 'Vocabulary',
  'mistake-review': 'Mistake',
  'study-plan': 'Study Plan',
  'speaking-practice': 'Speaking',
  'writing-practice': 'Writing',
  'exam-countdown': 'Exam',
  'motivation': 'Motivation',
  'saved-content': 'Saved Content',
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  unreadCount: number
  onUnreadCountChange?: (count: number) => void
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

export default function NotificationCenter({ isOpen, onClose, unreadCount, onUnreadCountChange }: NotificationCenterProps) {
  const [allMessages, setAllMessages] = useState<ProactiveMessage[]>([])
  const [activeFilter, setActiveFilter] = useState<ProactiveMessageCategory | 'all'>('all')
  const navigate = useNavigate()

  function refreshMessages() {
    setAllMessages(proactiveMessageEngine.getAllMessages())
    onUnreadCountChange?.(proactiveMessageEngine.getUnreadCount())
  }

  useEffect(() => {
    if (!isOpen) return
    refreshMessages()

    const unsubscribe = proactiveMessageEngine.onMessage(() => {
      refreshMessages()
    })

    return () => unsubscribe()
  }, [isOpen, onUnreadCountChange])

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all' || !activeFilter) return allMessages
    return allMessages.filter(m => m.category === activeFilter)
  }, [allMessages, activeFilter])

  const categories = useMemo(() => {
    const cats = new Set(allMessages.map(m => m.category))
    return Array.from(cats)
  }, [allMessages])

  const handleMarkRead = useCallback((id: string) => {
    proactiveMessageEngine.markAsRead(id)
    refreshMessages()
  }, [onUnreadCountChange])

  const handleMarkAllRead = useCallback(() => {
    proactiveMessageEngine.markAllAsRead()
    refreshMessages()
  }, [onUnreadCountChange])

  const handleDismiss = useCallback((id: string) => {
    proactiveMessageEngine.dismissMessage(id)
    refreshMessages()
  }, [onUnreadCountChange])

  const handleSnooze = useCallback((id: string) => {
    proactiveMessageEngine.snoozeMessage(id)
    refreshMessages()
  }, [onUnreadCountChange])

  const handleDelete = useCallback((id: string) => {
    proactiveMessageEngine.deleteMessage(id)
    refreshMessages()
  }, [onUnreadCountChange])

  const handleClearAll = useCallback(() => {
    proactiveMessageEngine.clearAllMessages()
    refreshMessages()
  }, [onUnreadCountChange])

  const handleAction = useCallback((msg: ProactiveMessage) => {
    proactiveMessageEngine.markAsRead(msg.id)
    if (msg.action?.type === 'navigate' && msg.action.payload?.path) {
      navigate(msg.action.payload.path as string)
      onClose()
    } else if (msg.action?.type === 'action' && msg.action.payload?.action) {
      onClose()
    }
  }, [navigate, onClose])

  const unreadCountFor = (cat: ProactiveMessageCategory | 'all') => {
    if (cat === 'all') return unreadCount
    return allMessages.filter(m => m.category === cat && !m.isRead && !m.isDismissed).length
  }

  if (!isOpen) return null

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ color: 'var(--color-text)' }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {(['all', ...categories] as (ProactiveMessageCategory | 'all')[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: activeFilter === cat ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'var(--color-surface-alt)',
              color: activeFilter === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
            type="button"
          >
            {CATEGORY_LABELS[cat]}
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

      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: 'var(--color-surface-alt)' }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--color-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {activeFilter === 'all' ? 'No notifications yet' : 'No notifications in this category'}
            </p>
            <p className="max-w-xs text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {activeFilter === 'all'
                ? 'Proactive tutor messages will appear here when the AI Tutor has suggestions for you.'
                : 'Try a different category or check back later.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-3 border-b px-4 py-3 transition-colors hover:opacity-90"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: msg.isRead ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 3%, transparent)',
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
                      {CATEGORY_LABELS[msg.category]}
                    </span>
                    {msg.priority === 'high' && (
                      <span
                        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                          color: 'var(--color-danger)',
                        }}
                      >
                        {PRIORITY_LABELS[msg.priority]}
                      </span>
                    )}
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      {formatTime(msg.createdAt)}
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
                        onClick={() => handleAction(msg)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                        }}
                        type="button"
                      >
                        {msg.action.label}
                      </button>
                    )}

                    {!msg.isRead && (
                      <button
                        onClick={() => handleMarkRead(msg.id)}
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
                      onClick={() => handleSnooze(msg.id)}
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

                    <button
                      onClick={() => handleDismiss(msg.id)}
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

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
                      style={{ color: 'var(--color-danger)' }}
                      type="button"
                      title="Delete"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex shrink-0 items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
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

        {allMessages.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              color: 'var(--color-danger)',
            }}
            type="button"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

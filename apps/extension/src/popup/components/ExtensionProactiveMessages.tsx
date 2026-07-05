import { useState, useEffect, useCallback, useRef } from 'react'
import { ProactiveMessageService, ProactiveEventBus } from '@ielts/ai-tutor'
import type { ProactiveMessage, ProactiveMessageSettings } from '@ielts/ai-tutor'

const categoryIcons: Record<string, string> = {
  'vocabulary-review': '📖',
  'mistake-review': '⚠️',
  'study-plan': '📋',
  'speaking-practice': '🎤',
  'writing-practice': '✍️',
  'reading-practice': '📰',
  'listening-practice': '🎧',
  'exam-countdown': '🎯',
  motivation: '💪',
  'saved-content': '💾',
  'daily-tip': '💡',
  'progress-report': '📊',
  suggestion: '🤔',
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-warning)',
  medium: 'var(--color-primary)',
  low: 'var(--color-muted)',
}

const priorityBgColors: Record<string, string> = {
  high: 'var(--color-warning-light)',
  medium: 'var(--color-info-light)',
  low: 'transparent',
}

function getCategoryIcon(category: string): string {
  return categoryIcons[category] || '💬'
}

export default function ExtensionProactiveMessages() {
  const [messages, setMessages] = useState<ProactiveMessage[]>([])
  const [settings, setSettings] = useState<ProactiveMessageSettings | null>(null)
  const [expanded, setExpanded] = useState(true)
  const initialized = useRef(false)

  const loadData = useCallback(() => {
    const loadedSettings = ProactiveMessageService.loadSettings()
    setSettings(loadedSettings)
    if (!loadedSettings.enabled) {
      setMessages([])
      return
    }
    const allMessages = ProactiveMessageService.loadMessages()
    const pending = allMessages.filter(m => {
      if (m.isDismissed) return false
      if (m.isRead) return false
      if (m.isSnoozed && m.snoozedUntil && new Date(m.snoozedUntil).getTime() > Date.now()) return false
      return true
    }).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    })
    setMessages(pending)
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadData()

    const unsubNew = ProactiveEventBus.onNewMessage(() => {
      loadData()
    })

    return () => {
      unsubNew()
    }
  }, [loadData])

  const markAsRead = useCallback((id: string) => {
    ProactiveMessageService.saveMessages(
      ProactiveMessageService.loadMessages().map(m =>
        m.id === id ? { ...m, isRead: true } : m,
      ),
    )
    ProactiveEventBus.emitMessageRead(id)
    loadData()
  }, [loadData])

  const dismissMessage = useCallback((id: string) => {
    ProactiveMessageService.saveMessages(
      ProactiveMessageService.loadMessages().map(m =>
        m.id === id ? { ...m, isDismissed: true } : m,
      ),
    )
    ProactiveEventBus.emitMessageDismissed(id)
    loadData()
  }, [loadData])

  const snoozeMessage = useCallback((id: string) => {
    const until = new Date(Date.now() + 3600_000).toISOString()
    ProactiveMessageService.saveMessages(
      ProactiveMessageService.loadMessages().map(m =>
        m.id === id ? { ...m, isSnoozed: true, snoozedUntil: until } : m,
      ),
    )
    ProactiveEventBus.emitMessageSnoozed(id, until)
    loadData()
  }, [loadData])

  const handleAction = useCallback((message: ProactiveMessage) => {
    if (message.action?.type === 'open-view') {
      const target = message.action.payload?.view as string
      if (target === 'reviews') {
        chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })
      }
    }
    if (message.action?.type === 'open-url' && message.action.payload?.url) {
      chrome.tabs.create({ url: message.action.payload.url as string })
    }
    markAsRead(message.id)
  }, [markAsRead])

  if (!settings?.enabled) return null
  if (messages.length === 0) return null

  const unreadCount = messages.filter(m => !m.isRead).length

  return (
    <section
      style={{
        marginBottom: '12px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          background: 'var(--color-surface)',
          border: 'none',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          🤖 AI Tutor
          {unreadCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '999px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--color-muted)',
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '8px 12px 12px', background: 'var(--color-background)' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: 'var(--radius-md)',
                background: msg.priority === 'high'
                  ? 'var(--color-warning-light)'
                  : 'var(--color-surface)',
                border: `1px solid ${
                  msg.priority === 'high'
                    ? 'var(--color-warning)'
                    : 'var(--color-border)'
                }`,
                fontSize: '13px',
                lineHeight: '1.5',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>
                {getCategoryIcon(msg.category)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '2px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'var(--color-text)',
                    }}
                  >
                    {msg.title}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      background: priorityBgColors[msg.priority] || 'transparent',
                      color: priorityColors[msg.priority] || 'var(--color-muted)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {msg.priority}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {msg.message}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => markAsRead(msg.id)}
                    style={compactBtnStyle}
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => snoozeMessage(msg.id)}
                    style={compactBtnStyle}
                    title="Snooze 1 hour"
                    aria-label="Snooze 1 hour"
                  >
                    ⏰
                  </button>
                  <button
                    onClick={() => dismissMessage(msg.id)}
                    style={compactBtnStyle}
                    title="Dismiss"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                  {msg.action && (
                    <button
                      onClick={() => handleAction(msg)}
                      style={{
                        ...compactBtnStyle,
                        background: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 500,
                        fontSize: '11px',
                        padding: '2px 8px',
                      }}
                    >
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {messages.length > 1 && (
            <button
              onClick={() => {
                ProactiveMessageService.saveMessages(
                  ProactiveMessageService.loadMessages().map(m => ({ ...m, isRead: true })),
                )
                ProactiveEventBus.emitMessagesCleared()
                loadData()
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </section>
  )
}

const compactBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-muted)',
  cursor: 'pointer',
  fontSize: '11px',
  lineHeight: 1,
  padding: 0,
  transition: 'background 0.12s',
}

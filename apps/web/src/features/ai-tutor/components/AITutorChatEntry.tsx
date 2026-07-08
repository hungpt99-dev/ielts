import { memo } from 'react'
import { TutorAvatar } from '@ielts/ai-tutor'
import { IconUser, IconEdit, IconCopy, IconThumbsUp, IconThumbsDown } from '@ielts/ui'

export type MessageRole = 'user' | 'assistant'

interface AITutorChatEntryProps {
  role: MessageRole
  content: string
  timestamp?: string
  showActions?: boolean
  onSaveNote?: (content: string) => void
  onCopy?: (content: string) => void
  onRate?: (rating: 'up' | 'down') => void
}

function formatTime(ts?: string): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function AITutorChatEntry({
  role,
  content,
  timestamp,
  showActions = false,
  onSaveNote,
  onCopy,
  onRate,
}: AITutorChatEntryProps) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'chat-message-in 0.25s ease-out',
        width: '100%',
      }}
    >
      {!isUser && (
        <div style={{ flexShrink: 0, marginTop: 'var(--spacing-2xs)' }}>
          <TutorAvatar size={32} />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2xs)',
          maxWidth: '80%',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: isUser
              ? 'var(--radius-xl) var(--radius-xl) var(--radius-2xs) var(--radius-xl)'
              : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-2xs)',
            background: isUser
              ? 'var(--color-primary)'
              : 'var(--color-tutor-accent-light)',
            color: isUser
              ? 'var(--color-on-primary)'
              : 'var(--color-tutor-text)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxShadow: isUser
              ? 'var(--shadow-sm)'
              : 'var(--shadow-tutor)',
            border: isUser
              ? 'none'
              : '1px solid var(--color-tutor-border)',
          }}
        >
          {content}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            padding: '0 var(--spacing-2xs)',
          }}
        >
          {timestamp && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {formatTime(timestamp)}
            </span>
          )}

          {!isUser && showActions && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
              }}
            >
              {onSaveNote && (
                <button
                  onClick={() => onSaveNote(content)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-label="Save as note"
                  title="Save as note"
                >
                  <IconEdit size={12} />
                </button>
              )}
              {onCopy && (
                <button
                  onClick={() => onCopy(content)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-label="Copy message"
                  title="Copy"
                >
                  <IconCopy size={12} />
                </button>
              )}
              {onRate && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2xs)',
                    paddingLeft: 'var(--spacing-2xs)',
                    borderLeft: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => onRate('up')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                      transition: 'all var(--transition-fast)',
                    }}
                    aria-label="Rate as helpful"
                    title="Helpful"
                  >
                    <IconThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => onRate('down')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                      transition: 'all var(--transition-fast)',
                    }}
                    aria-label="Rate as not helpful"
                    title="Not helpful"
                  >
                    <IconThumbsDown size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--spacing-2xs)',
          }}
          aria-hidden="true"
        >
          <IconUser size={16} strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}

export default memo(AITutorChatEntry)

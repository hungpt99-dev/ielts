import { type HTMLAttributes, type ReactNode } from 'react'

export type AITutorMessageVariant = 'default' | 'correction'

export interface AITutorMessageCardProps extends HTMLAttributes<HTMLDivElement> {
  message: string
  role?: 'tutor' | 'user'
  avatar?: ReactNode
  actions?: ReactNode
  timestamp?: string
  proactive?: boolean
  typing?: boolean
  variant?: AITutorMessageVariant
}

function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      const inner = trimmed.slice(2, -2)
      return <strong key={i}>{inner}</strong>
    }
    const parts = line.split(/(\*[^*]+\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={j}>{part.slice(1, -1)}</em>
      }
      return <span key={j}>{part}</span>
    })
    return <span key={i}>{rendered}{i < lines.length - 1 && <br />}</span>
  })
}

function TypingDots() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '4px 0',
      }}
      aria-label="AI Tutor is typing"
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-tutor-accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-tutor-accent)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-tutor-accent)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }} />
    </span>
  )
}

export function AITutorMessageCard({
  message,
  role = 'tutor',
  avatar,
  actions,
  timestamp,
  proactive = false,
  typing = false,
  variant = 'default',
  style,
  ...props
}: AITutorMessageCardProps) {
  const isTutor = role === 'tutor'
  const isCorrection = variant === 'correction'

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        alignItems: 'flex-start',
        flexDirection: isTutor ? 'row' : 'row-reverse',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {avatar && (
        <div
          style={{
            flexShrink: 0,
            width: 'var(--spacing-xl)',
            height: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-full)',
            background: isTutor ? 'var(--color-tutor-accent-light)' : 'var(--color-surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isTutor ? 'var(--color-tutor-accent)' : 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            overflow: 'hidden',
          }}
        >
          {avatar}
        </div>
      )}
      <div
        style={{
          maxWidth: '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-2xs)',
          alignItems: isTutor ? 'flex-start' : 'flex-end',
        }}
      >
        <div
          style={{
            padding: isCorrection ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-sm) var(--spacing-md)',
            background: isCorrection
              ? 'var(--color-warning-light)'
              : isTutor
                ? proactive
                  ? 'var(--color-tutor-background)'
                  : 'var(--color-tutor-accent-light)'
                : 'var(--color-primary-light)',
            color: isCorrection
              ? 'var(--color-warning-dark)'
              : isTutor
                ? 'var(--color-tutor-text)'
                : 'var(--color-primary-dark)',
            border: isCorrection
              ? '1px solid var(--color-warning)'
              : isTutor
                ? '1px solid var(--color-tutor-border)'
                : '1px solid var(--color-primary-light)',
            borderRadius: isCorrection
              ? 'var(--radius-lg)'
              : isTutor
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-2xs)'
                : 'var(--radius-lg) var(--radius-lg) var(--radius-2xs) var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-relaxed)',
            fontFamily: 'var(--font-sans)',
            boxShadow: isTutor ? 'var(--shadow-tutor)' : 'var(--shadow-sm)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {typing ? <TypingDots /> : renderMarkdown(message)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
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
              {timestamp}
            </span>
          )}
          {actions && (
            <div style={{ display: 'flex', gap: 'var(--spacing-2xs)' }}>{actions}</div>
          )}
        </div>
      </div>
    </div>
  )
}

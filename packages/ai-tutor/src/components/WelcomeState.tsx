import { type ReactNode, useMemo } from 'react'
import { TutorAvatar } from './TutorAvatar'

interface WelcomeStateProps {
  greeting: string
  suggestion?: ReactNode
  compact?: boolean
  userName?: string
  suggestedPrompts?: Array<{ label: string; onClick: () => void }>
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeState({ greeting, suggestion, compact, userName, suggestedPrompts }: WelcomeStateProps) {
  const timeGreeting = useMemo(() => getTimeBasedGreeting(), [])

  if (compact) {
    return (
      <div
        className="flex flex-col items-center justify-center py-6 text-center"
        style={{ animation: 'chat-fade-in 0.4s ease-out' }}
      >
        <TutorAvatar size={56} pulse />
        <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-tutor-text)' }}>
          {userName ? `${timeGreeting}, ${userName}!` : 'Hi, I\'m your IELTS Tutor!'}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {greeting}
        </p>
        {suggestion && <div className="mt-3">{suggestion}</div>}
        {suggestedPrompts && suggestedPrompts.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={prompt.onClick}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-tutor-accent-light)',
                  color: 'var(--color-tutor-accent)',
                  border: '1px solid var(--color-tutor-border)',
                }}
                type="button"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center"
      style={{ animation: 'chat-fade-in 0.4s ease-out' }}
    >
      <TutorAvatar size={80} pulse />

      <div>
        <p className="text-lg font-semibold" style={{ color: 'var(--color-tutor-text)' }}>
          {userName ? `${timeGreeting}, ${userName}!` : 'Hi, I\'m your IELTS Tutor!'}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-tutor-text)' }}>
          I can help you with reading, writing, listening, speaking, grammar, vocabulary, study plans, and more.
        </p>
      </div>

      <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {greeting}
      </p>

      {suggestion}

      {suggestedPrompts && suggestedPrompts.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={prompt.onClick}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-tutor-accent-light)',
                color: 'var(--color-tutor-accent)',
                border: '1px solid var(--color-tutor-border)',
              }}
              type="button"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        — or ask me anything —
      </p>
    </div>
  )
}

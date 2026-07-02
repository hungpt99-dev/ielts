import type { ReactNode } from 'react'

interface WelcomeStateProps {
  greeting: string
  suggestion?: ReactNode
}

export function WelcomeState({ greeting, suggestion }: WelcomeStateProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center"
      style={{ animation: 'chat-fade-in 0.4s ease-out' }}
    >
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        🤖
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'tutor-avatar-pulse 3s ease-in-out infinite',
            border: '2px solid var(--color-primary)',
            opacity: 0.3,
          }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        Hi, I'm your AI Tutor!
      </p>
      <p
        className="max-w-xs text-xs leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {greeting}
      </p>
      {suggestion}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div
      className="flex w-fit max-w-[80%] items-end gap-2"
      style={{
        alignSelf: 'flex-start',
        animation: 'chat-message-in 0.25s ease-out',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
        aria-hidden="true"
      >
        🤖
      </div>
      <div
        className="flex items-center gap-1 rounded-2xl px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface-alt)' }}
        aria-label="AI Tutor is typing"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-muted)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '0ms',
          }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-muted)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '160ms',
          }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-muted)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '320ms',
          }}
        />
      </div>
    </div>
  )
}

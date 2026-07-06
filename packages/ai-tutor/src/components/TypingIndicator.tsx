import { TutorAvatar } from './TutorAvatar'

export function TypingIndicator() {
  return (
    <div
      className="flex w-fit max-w-[80%] items-end gap-2 sm:max-w-[70%]"
      style={{
        alignSelf: 'flex-start',
        animation: 'chat-message-in 0.25s ease-out',
      }}
    >
      <TutorAvatar size={32} typing />

      <div
        className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
        style={{
          backgroundColor: 'var(--color-tutor-background)',
          borderRadius: '18px 18px 18px 4px',
        }}
        aria-label="AI Tutor is typing"
        role="status"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-tutor-accent)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '0ms',
          }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-tutor-accent)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '160ms',
          }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-tutor-accent)',
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '320ms',
          }}
        />
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, type ReactNode } from 'react'

// ── Tutor Avatar ─────────────────────────────────────────────

interface TutorAvatarProps {
  size?: number
  showStatus?: boolean
  isOnline?: boolean
  pulse?: boolean
  className?: string
}

export function TutorAvatar({
  size = 40,
  showStatus = true,
  isOnline = true,
  pulse = false,
  className = '',
}: TutorAvatarProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--color-primary-light)',
        fontSize: size * 0.45,
      }}
      aria-hidden="true"
    >
      <span
        className="select-none leading-none"
        style={{
          filter: pulse ? 'brightness(1.2)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        🤖
      </span>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'tutor-avatar-pulse 2s ease-in-out infinite',
            border: '2px solid var(--color-primary)',
            opacity: 0.4,
          }}
        />
      )}
      {showStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            backgroundColor: isOnline ? 'var(--color-success)' : 'var(--color-muted)',
            borderColor: 'var(--color-surface)',
            transition: 'background-color 0.3s ease',
          }}
          aria-label={isOnline ? 'Online' : 'Away'}
        />
      )}
    </div>
  )
}

// ── Missing API Key Banner ─────────────────────────────────

interface MissingKeyBannerProps {
  onOpenSettings?: () => void
}

export function MissingKeyBanner({ onOpenSettings }: MissingKeyBannerProps) {
  return (
    <div
      className="mx-4 mb-3 mt-2 overflow-hidden rounded-xl border text-xs"
      style={{
        borderColor: 'var(--color-warning)',
        backgroundColor: 'var(--color-warning-light)',
      }}
    >
      <div className="p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm" aria-hidden="true">⚙️</span>
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
            AI Key Not Configured
          </p>
        </div>
        <p className="mb-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Add your AI API key in Settings to unlock AI-powered tutor responses. Until then, I'll use
          rule-based suggestions and responses.
        </p>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
            }}
            type="button"
          >
            Open Settings
          </button>
        )}
      </div>
    </div>
  )
}

// ── Typing Indicator (polished) ────────────────────────────

export function TypingIndicator() {
  return (
    <div
      className="flex w-fit max-w-[80%] items-end gap-2"
      style={{
        alignSelf: 'flex-start',
        animation: 'message-in 0.25s ease-out',
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

// ── Welcome / Empty State ───────────────────────────────────

interface WelcomeStateProps {
  greeting: string
  suggestion?: ReactNode
}

export function WelcomeState({ greeting, suggestion }: WelcomeStateProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center"
      style={{ animation: 'fade-in 0.4s ease-out' }}
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

// ── Message Bubble ──────────────────────────────────────────

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  formatTime: (dateStr: string) => string
}

export function MessageBubble({ role, content, timestamp, formatTime }: MessageBubbleProps) {
  return (
    <div
      className="flex w-full"
      style={{
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
        animation: 'message-in 0.25s ease-out',
      }}
    >
      {role === 'assistant' && (
        <div
          className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
          aria-hidden="true"
        >
          🤖
        </div>
      )}

      <div
        className="flex max-w-[80%] flex-col"
        style={{ alignItems: role === 'user' ? 'flex-end' : 'flex-start' }}
      >
        <div
          className="whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={
            role === 'user'
              ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  borderBottomRightRadius: '4px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }
              : {
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                  borderBottomLeftRadius: '4px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }
          }
        >
          {content}
        </div>
        <span
          className="mt-1 px-1 text-[10px]"
          style={{ color: 'var(--color-muted)' }}
        >
          {formatTime(timestamp)}
        </span>
      </div>

      {role === 'user' && (
        <div
          className="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
          aria-hidden="true"
        >
          👤
        </div>
      )}
    </div>
  )
}

// ── Exit Animation Hook ─────────────────────────────────────

interface UseExitAnimationOptions {
  isOpen: boolean
  duration?: number
}

interface UseExitAnimationResult {
  shouldRender: boolean
  isExiting: boolean
  animationStyle: React.CSSProperties
}

export function useExitAnimation({
  isOpen,
  duration = 250,
}: UseExitAnimationOptions): UseExitAnimationResult {
  const [isExiting, setIsExiting] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const prevOpen = useRef(isOpen)

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setIsExiting(false)
      setShouldRender(true)
    } else if (!isOpen && prevOpen.current) {
      setIsExiting(true)
      const timer = setTimeout(() => {
        setIsExiting(false)
        setShouldRender(false)
      }, duration)
      return () => clearTimeout(timer)
    }
    prevOpen.current = isOpen
  }, [isOpen, duration])

  const animationStyle: React.CSSProperties = isExiting
    ? {
        animation: `chat-popup-out ${duration}ms ease-in forwards`,
        pointerEvents: 'none' as const,
      }
    : {
        animation: `chat-popup-in ${duration}ms ease-out`,
      }

  return { shouldRender, isExiting, animationStyle }
}

// ── Proactive Message Preview ───────────────────────────────

interface ProactivePreviewProps {
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high'
  onDismiss: () => void
  onAction: () => void
  onSnooze?: () => void
  actionLabel?: string
}

export function ProactiveMessagePreview({
  title,
  message,
  priority = 'medium',
  onDismiss,
  onAction,
  onSnooze,
  actionLabel,
}: ProactivePreviewProps) {
  return (
    <div
      className="rounded-xl border p-3 text-xs transition-all hover:opacity-90"
      style={{
        borderColor: priority === 'high' ? 'var(--color-warning)' : 'var(--color-border)',
        backgroundColor:
          priority === 'high'
            ? 'var(--color-warning-light)'
            : 'var(--color-surface-alt)',
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium leading-tight" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
        <div className="flex shrink-0 gap-1">
          {onSnooze && (
            <button
              onClick={onSnooze}
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Snooze"
              title="Snooze 1 hour"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mb-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {message}
      </p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ── CSS injection ────────────────────────────────────────────

const uxKeyframes = `
@keyframes tutor-avatar-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.12); opacity: 0.15; }
}
@keyframes typing-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
@keyframes message-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes chat-popup-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes chat-popup-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.95) translateY(10px); }
}
`

export function ChatUXStyles() {
  return <style>{uxKeyframes}</style>
}

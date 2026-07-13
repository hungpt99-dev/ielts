import { useCallback, type ReactNode } from 'react'
import { IconAlertCircle, IconClose } from '../../../ui/src/icons/IconMap'

interface ErrorConfig {
  title: string
  defaultMessage: string
  action?: 'retry' | 'settings' | 'dismiss' | null
}

interface ErrorBannerProps {
  type: 'api-key' | 'network' | 'timeout' | 'content-blocked' | 'rate-limit' | 'generic'
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
  onOpenSettings?: () => void
}

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  'api-key': {
    title: 'API Key Required',
    defaultMessage: 'AI Tutor needs an API key to work. Add one in Settings to unlock AI-powered responses.',
    action: 'settings',
  },
  network: {
    title: 'Connection Lost',
    defaultMessage: 'Connection lost. Check your internet and try again.',
    action: 'retry',
  },
  timeout: {
    title: 'Request Timed Out',
    defaultMessage: 'That took too long. Let\'s try again.',
    action: 'retry',
  },
  'content-blocked': {
    title: 'Unable to Process',
    defaultMessage: 'I can\'t help with that request. Try asking something else.',
    action: 'dismiss',
  },
  'rate-limit': {
    title: 'Slow Down',
    defaultMessage: 'I\'m talking too fast! Give me a moment.',
    action: 'dismiss',
  },
  generic: {
    title: 'Something Went Wrong',
    defaultMessage: 'I had trouble with that. Could you try again?',
    action: 'retry',
  },
}

function renderAction(config: ErrorConfig, onRetry?: () => void, onOpenSettings?: () => void, onDismiss?: () => void): ReactNode {
  if (config.action === 'retry' && onRetry) {
    return (
      <button
        onClick={onRetry}
        className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-on-primary)' }}
        type="button"
      >
        Retry
      </button>
    )
  }
  if (config.action === 'settings' && onOpenSettings) {
    return (
      <button
        onClick={onOpenSettings}
        className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        type="button"
      >
        Go to Settings
      </button>
    )
  }
  if (config.action === 'dismiss' && onDismiss) {
    return (
      <button
        onClick={onDismiss}
        className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
        type="button"
      >
        Dismiss
      </button>
    )
  }
  return null
}

export function ErrorBanner({
  type,
  message,
  onRetry,
  onDismiss,
  onOpenSettings,
}: ErrorBannerProps) {
  const config = ERROR_CONFIGS[type] || ERROR_CONFIGS.generic

  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  return (
    <div
      className="mx-2 mb-2 animate-fade-in rounded-xl border p-3 text-xs"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--color-danger) 6%, transparent)',
      }}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <IconAlertCircle size={16} color="var(--color-danger)" className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="mb-0.5 font-semibold" style={{ color: 'var(--color-danger)' }}>
            {config.title}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {message || config.defaultMessage}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {renderAction(config, handleRetry, onOpenSettings, onDismiss)}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Dismiss error"
          >
            <IconClose size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

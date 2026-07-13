import { IconSettings } from '../../../ui/src/icons/IconMap'

interface MissingKeyBannerProps {
  onOpenSettings?: () => void
}

export function MissingKeyBanner({ onOpenSettings }: MissingKeyBannerProps) {
  return (
    <div
      className="mx-4 mb-3 mt-2 overflow-hidden rounded-xl border text-xs"
      style={{
        borderColor: 'var(--color-warning)',
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
      }}
    >
      <div className="p-3">
        <div className="mb-1 flex items-center gap-2">
          <IconSettings size={16} aria-hidden="true" />
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

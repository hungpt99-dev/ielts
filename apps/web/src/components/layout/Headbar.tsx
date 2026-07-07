import DarkModeToggle from '../ui/DarkModeToggle'
import { IconMenu } from '@ielts/ui'

interface HeadbarProps {
  onMenuToggle: () => void
}

export default function Headbar({ onMenuToggle }: HeadbarProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        padding: '0 16px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        gap: 'var(--spacing-sm)',
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header, 300)',
      }}
    >
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center lg:hidden"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          background: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          transition: 'background-color var(--transition-fast)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
        aria-label="Open sidebar"
      >
        <IconMenu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="" className="h-6 w-6 rounded-md" />
        <span className="hidden text-sm font-bold sm:inline" style={{ color: 'var(--color-text)' }}>IELTS Journey</span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
        <DarkModeToggle />
      </div>
    </header>
  )
}

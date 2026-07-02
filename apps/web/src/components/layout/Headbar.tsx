import DarkModeToggle from '../ui/DarkModeToggle'

interface HeadbarProps {
  onMenuToggle: () => void
}

export default function Headbar({ onMenuToggle }: HeadbarProps) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b px-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 lg:hidden"
        style={{ color: 'var(--color-muted)' }}
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <DarkModeToggle />
      </div>
    </header>
  )
}

import { useTheme } from '../../context/ThemeContext'
import { IconSun, IconMoon } from '@ielts/ui'

export default function DarkModeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
      style={{ width: '44px', height: '44px', WebkitTapHighlightColor: 'transparent' }}
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  )
}

import { useTheme } from '../../context/ThemeContext'
import { IconSun, IconMoon } from '@ielts/ui'

export default function DarkModeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  )
}

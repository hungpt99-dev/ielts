import { type ReactNode, useRef, useEffect } from 'react'
import { IconHelpCircle, IconSimplify, IconBookText, IconSave, IconMessageSquare } from '@ielts/ui'

interface ActionItem {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
}

interface SelectedTextActionMenuProps {
  selectedText?: string
  position?: { x: number; y: number }
  onClose: () => void
  onExplain?: (text: string) => void
  onSimplify?: (text: string) => void
  onSaveVocabulary?: (text: string) => void
  onSaveText?: (text: string) => void
  onAskAI?: (text: string) => void
  allow?: ('explain' | 'simplify' | 'saveVocabulary' | 'saveText' | 'askAI')[]
  extraActions?: ActionItem[]
}

const ACTION_COLORS: Record<string, { label: string; icon: ReactNode; bg: string; color: string }> = {
  explain: { label: 'Explain', icon: <IconHelpCircle size={16} />, bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  simplify: { label: 'Simplify', icon: <IconSimplify size={16} />, bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
  saveVocabulary: { label: 'Save Vocabulary', icon: <IconBookText size={16} />, bg: 'var(--color-skill-reading-light)', color: 'var(--color-skill-reading)' },
  saveText: { label: 'Save Selected Text', icon: <IconSave size={16} />, bg: 'var(--color-skill-listening-light)', color: 'var(--color-skill-listening)' },
  askAI: { label: 'Ask AI Tutor', icon: <IconMessageSquare size={16} />, bg: 'var(--color-tutor-accent-light)', color: 'var(--color-tutor-accent)' },
}

export default function SelectedTextActionMenu({
  selectedText = '',
  position,
  onClose,
  onExplain,
  onSimplify,
  onSaveVocabulary,
  onSaveText,
  onAskAI,
  allow,
  extraActions,
}: SelectedTextActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const allowed = allow ?? ['explain', 'simplify', 'saveVocabulary', 'saveText', 'askAI']

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handlers: Record<string, (text: string) => void> = {
    explain: (t) => onExplain?.(t),
    simplify: (t) => onSimplify?.(t),
    saveVocabulary: (t) => onSaveVocabulary?.(t),
    saveText: (t) => onSaveText?.(t),
    askAI: (t) => onAskAI?.(t),
  }

  const items: ActionItem[] = allowed
    .filter((id) => ACTION_COLORS[id] && handlers[id])
    .map((id) => ({
      id,
      label: ACTION_COLORS[id].label,
      icon: ACTION_COLORS[id].icon,
      onClick: () => {
        handlers[id](selectedText)
        onClose()
      },
    }))

  const allItems = [...items, ...(extraActions || [])]

  if (allItems.length === 0) return null

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        zIndex: 'var(--z-extension-menu)',
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        padding: 'var(--spacing-sm)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-xl)',
        animation: 'fadeIn var(--transition-fast)',
        boxSizing: 'border-box',
        ...(position ? { left: `${position.x}px`, top: `${position.y}px` } : {}),
      }}
    >
      {allItems.map((item) => {
        const colors = ACTION_COLORS[item.id]
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={item.onClick}
            title={colors?.label || item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-sm)',
              background: 'none',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors?.bg || 'var(--color-surface-alt)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            {item.icon && (
              <span
                style={{
                  display: 'inline-flex',
                  flexShrink: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'var(--spacing-lg)',
                  height: 'var(--spacing-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: colors?.bg || 'transparent',
                  color: colors?.color || 'var(--color-primary)',
                }}
              >
                {item.icon}
              </span>
            )}
            <span style={{ color: colors?.color || 'var(--color-text)' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

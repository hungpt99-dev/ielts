import { useCallback } from 'react'

interface PronounceButtonProps {
  word: string
  className?: string
  size?: 'sm' | 'md'
}

export default function PronounceButton({ word, className, size = 'sm' }: PronounceButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }, [word])

  const sizeStyles = size === 'sm'
    ? { width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', fontSize: 'var(--text-sm)' }
    : { width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', fontSize: 'var(--text-base)' }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Pronounce "${word}"`}
      aria-label={`Listen to pronunciation of ${word}`}
      className={className}
      style={{
        ...sizeStyles,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        color: 'var(--color-muted)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        flexShrink: 0,
        padding: 0,
        lineHeight: 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-alt)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
      </svg>
    </button>
  )
}

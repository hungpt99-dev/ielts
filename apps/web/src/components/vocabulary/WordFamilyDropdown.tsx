import { useState, useId } from 'react'
import WordFamilyDisplay from '../../features/vocabulary/components/WordFamilyDisplay'
import { IconChevronRight } from '@ielts/ui'

interface WordFamilyDropdownProps {
  wordFamily: string[]
  onGenerate?: () => Promise<void> | void
  generating?: boolean
}

export default function WordFamilyDropdown({ wordFamily, onGenerate, generating }: WordFamilyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()
  const contentId = `wf-content-${id}`
  const hasAnyData = wordFamily.length > 0

  if (!hasAnyData && !onGenerate) return null

  return (
    <div>
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-2xs) var(--spacing-sm)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          fontFamily: 'var(--font-sans)',
          background: 'none',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-alt)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        <span
          style={{
            display: 'inline-flex',
            transition: 'transform var(--transition-fast)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '10px',
          }}
        >
          <IconChevronRight size={12} />
        </span>
        <span>Word Family</span>
        {hasAnyData && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              fontSize: '10px',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-sans)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              lineHeight: 1,
            }}
          >
            {wordFamily.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id={contentId}
          style={{
            marginTop: 'var(--spacing-sm)',
            animation: 'fadeIn var(--transition-fast)',
          }}
        >
          <WordFamilyDisplay
            wordFamily={wordFamily}
            onGenerate={onGenerate}
            generating={generating}
          />
        </div>
      )}
    </div>
  )
}

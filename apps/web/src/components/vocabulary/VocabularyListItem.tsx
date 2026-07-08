import { useCallback, useState, memo, type ReactNode } from 'react'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../../models'
import PronounceButton from '../ui/PronounceButton'
import WordFamilyDisplay from '../../features/vocabulary/components/WordFamilyDisplay'
import { generateWordFamily } from '../../features/vocabulary/vocabularyService'
import { IconStar, IconCheckCircle, IconEdit, IconDelete, IconChevronRight } from '@ielts/ui'

export type { VocabularyEntry }

const statusAccent: Record<VocabStatus, string> = {
  new: 'var(--color-primary)',
  learning: 'var(--color-warning)',
  reviewing: 'var(--color-skill-reading)',
  mastered: 'var(--color-success)',
}

const difficultyVariant: Record<VocabDifficulty, { bg: string; color: string }> = {
  easy: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  medium: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  hard: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
}

export interface VocabularyListItemProps {
  entry: VocabularyEntry
  onDetail: (entry: VocabularyEntry) => void
  onEdit: (entry: VocabularyEntry) => void
  onDelete: (id: string) => void
  onToggleFavorite: (entry: VocabularyEntry) => void
  onStatusChange: (entry: VocabularyEntry, status: VocabStatus) => void
  bottomContent?: ReactNode
}

function VocabularyListItem({
  entry,
  onDetail,
  onEdit,
  onDelete,
  onToggleFavorite,
  onStatusChange,
  bottomContent,
}: VocabularyListItemProps) {
  const [generatingFamily, setGeneratingFamily] = useState(false)
  const [localWordFamily, setLocalWordFamily] = useState<string[] | null>(null)

  const displayWordFamily = localWordFamily ?? entry.wordFamily

  const handleGenerateFamily = useCallback(async () => {
    setGeneratingFamily(true)
    try {
      const result = await generateWordFamily(entry.word, entry.meaning)
      if (result.wordFamily.length > 0) {
        const { DatabaseService } = await import('../../services/storage/Database')
        const merged = [...new Set([...entry.wordFamily, ...result.wordFamily])]
        const updated: VocabularyEntry = {
          ...entry,
          wordFamily: merged,
          updatedAt: new Date().toISOString(),
        }
        await DatabaseService.put('vocabulary', updated)
        setLocalWordFamily(merged)
      }
    } finally {
      setGeneratingFamily(false)
    }
  }, [entry])

  const [showWordFamily, setShowWordFamily] = useState(false)
  const isFavorited = entry.tags.includes('favorite')
  const diffColors = difficultyVariant[entry.difficulty]

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-md)',
        transition: 'all var(--transition-fast)',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: statusAccent[entry.status],
          borderTopLeftRadius: 'var(--radius-xl)',
          borderBottomLeftRadius: 'var(--radius-xl)',
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <button
              onClick={() => onDetail(entry)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              aria-label={`View details for ${entry.word}`}
            >
              <span
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                {entry.word}
              </span>
            </button>
            <PronounceButton word={entry.word} />
            {entry.pronunciation && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                /{entry.pronunciation}/
              </span>
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontStyle: 'italic' }}>
              {entry.partOfSpeech}
            </span>
          </div>

          <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {entry.meaning}
          </p>
          {entry.meaningVi && (
            <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {entry.meaningVi}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: '2px var(--spacing-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                background: entry.status === 'new' ? 'var(--color-primary-light)' : entry.status === 'learning' ? 'var(--color-warning-light)' : entry.status === 'reviewing' ? 'var(--color-skill-reading-light)' : 'var(--color-success-light)',
                color: entry.status === 'new' ? 'var(--color-primary)' : entry.status === 'learning' ? 'var(--color-warning)' : entry.status === 'reviewing' ? 'var(--color-skill-reading)' : 'var(--color-success)',
                borderRadius: 'var(--radius-full)',
                lineHeight: 1.4,
                textTransform: 'capitalize',
              }}
            >
              {entry.status}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px var(--spacing-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                background: diffColors.bg,
                color: diffColors.color,
                borderRadius: 'var(--radius-full)',
                lineHeight: 1.4,
                textTransform: 'capitalize',
              }}
            >
              {entry.difficulty}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px var(--spacing-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-full)',
                lineHeight: 1.4,
              }}
            >
              {entry.topic}
            </span>
            {entry.tags.filter(t => t !== 'favorite').map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px var(--spacing-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  lineHeight: 1.4,
                  opacity: 0.8,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-2 self-start sm:self-auto sm:flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(entry)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              padding: 0,
              background: 'none',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: isFavorited ? 'var(--color-warning)' : 'var(--color-muted)',
              transition: 'all var(--transition-fast)',
            }}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <IconStar size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>

          {entry.status !== 'mastered' && (
            <button
              onClick={() => onStatusChange(entry, 'mastered')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                padding: 0,
                background: 'none',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--color-success)',
                transition: 'all var(--transition-fast)',
              }}
              aria-label="Mark as mastered"
              title="Mark as mastered"
            >
              <IconCheckCircle size={18} />
            </button>
          )}

          <button
            onClick={() => onEdit(entry)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              padding: 0,
              background: 'none',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
            aria-label={`Edit ${entry.word}`}
            title="Edit word"
          >
            <IconEdit size={18} />
          </button>

          <button
            onClick={() => onDelete(entry.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              padding: 0,
              background: 'none',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-danger)',
              transition: 'all var(--transition-fast)',
            }}
            aria-label={`Delete ${entry.word}`}
            title="Delete word"
          >
            <IconDelete size={18} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border-light)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <button
            onClick={() => setShowWordFamily(v => !v)}
            aria-expanded={showWordFamily}
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
                transform: showWordFamily ? 'rotate(90deg)' : 'rotate(0deg)',
                fontSize: '10px',
              }}
            >
              <IconChevronRight size={12} />
            </span>
            <span>Word Forms</span>
            {displayWordFamily.length > 0 && (
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
                {displayWordFamily.length}
              </span>
            )}
          </button>
          {displayWordFamily.length === 0 && !showWordFamily && (
            <button
              onClick={handleGenerateFamily}
              disabled={generatingFamily}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2xs)',
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                fontFamily: 'var(--font-sans)',
                background: generatingFamily ? 'transparent' : 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                cursor: generatingFamily ? 'not-allowed' : 'pointer',
                opacity: generatingFamily ? 0.6 : 1,
                transition: 'all var(--transition-fast)',
              }}
            >
              {generatingFamily ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {generatingFamily ? 'Generating...' : 'Generate'}
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {bottomContent}
          </div>
        </div>
        {showWordFamily && (
          <div style={{ marginTop: 'var(--spacing-sm)', minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            <WordFamilyDisplay
              wordFamily={displayWordFamily}
              onGenerate={handleGenerateFamily}
              generating={generatingFamily}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(VocabularyListItem)

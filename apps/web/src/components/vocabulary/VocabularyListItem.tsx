import { useCallback, useState, memo, type ReactNode } from 'react'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../../models'
import PronounceButton from '../ui/PronounceButton'
import WordFamilyDisplay from '../../features/vocabulary/components/WordFamilyDisplay'
import { enrichVocabulary } from '../../features/vocabulary/vocabularyService'
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
  const [enriching, setEnriching] = useState(false)
  const [localEnriched, setLocalEnriched] = useState<VocabularyEntry | null>(null)

  const displayEntry = localEnriched ?? entry
  const displayWordFamily = displayEntry.wordFamily

  const handleEnrich = useCallback(async () => {
    setEnriching(true)
    try {
      const { DatabaseService } = await import('../../services/storage/Database')
      const { data, error } = await enrichVocabulary(entry.word, displayEntry.topic)
      if (error || !data) return
      const mergedWordFamily = [...new Set([...entry.wordFamily, ...(data.wordFamily || [])])]
      const updated: VocabularyEntry = {
        ...entry,
        word: data.lemma || displayEntry.word,
        meaning: data.meaning || displayEntry.meaning,
        pronunciation: data.pronunciation || displayEntry.pronunciation,
        partOfSpeech: data.partOfSpeech || displayEntry.partOfSpeech,
        exampleSentence: data.exampleSentence || displayEntry.exampleSentence,
        collocations: [...new Set([...entry.collocations, ...(data.collocations || [])])],
        synonyms: [...new Set([...entry.synonyms, ...(data.synonyms || [])])],
        antonyms: [...new Set([...entry.antonyms, ...(data.antonyms || [])])],
        wordFamily: mergedWordFamily,
        cefrLevel: (data.cefrLevel || displayEntry.cefrLevel) as VocabularyEntry['cefrLevel'],
        ieltsRelevance: (data.ieltsRelevance || displayEntry.ieltsRelevance) as VocabularyEntry['ieltsRelevance'],
        updatedAt: new Date().toISOString(),
      }
      await DatabaseService.put('vocabulary', updated)
      setLocalEnriched(updated)
    } finally {
      setEnriching(false)
    }
  }, [entry])

  const [showWordFamily, setShowWordFamily] = useState(false)
  const isFavorited = displayEntry.tags.includes('favorite')
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
              aria-label={`View details for ${displayEntry.word}`}
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
                {displayEntry.word}
              </span>
            </button>
            <PronounceButton word={displayEntry.word} />
            {displayEntry.pronunciation && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                /{displayEntry.pronunciation}/
              </span>
            )}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontStyle: 'italic' }}>
              {displayEntry.partOfSpeech}
            </span>
          </div>

          <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {displayEntry.meaning}
          </p>
          {displayEntry.meaningVi && (
            <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {displayEntry.meaningVi}
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
                background: displayEntry.status === 'new' ? 'var(--color-primary-light)' : displayEntry.status === 'learning' ? 'var(--color-warning-light)' : displayEntry.status === 'reviewing' ? 'var(--color-skill-reading-light)' : 'var(--color-success-light)',
                color: displayEntry.status === 'new' ? 'var(--color-primary)' : displayEntry.status === 'learning' ? 'var(--color-warning)' : displayEntry.status === 'reviewing' ? 'var(--color-skill-reading)' : 'var(--color-success)',
                borderRadius: 'var(--radius-full)',
                lineHeight: 1.4,
                textTransform: 'capitalize',
              }}
            >
              {displayEntry.status}
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
              {displayEntry.difficulty}
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
              {displayEntry.topic}
            </span>
            {displayEntry.cefrLevel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px var(--spacing-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  fontFamily: 'var(--font-mono)',
                  background: displayEntry.cefrLevel >= 'B2' ? 'var(--color-success-light)' : displayEntry.cefrLevel >= 'B1' ? 'var(--color-warning-light)' : 'var(--color-primary-light)',
                  color: displayEntry.cefrLevel >= 'B2' ? 'var(--color-success)' : displayEntry.cefrLevel >= 'B1' ? 'var(--color-warning)' : 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  lineHeight: 1.4,
                }}
              >
                {displayEntry.cefrLevel}
              </span>
            )}
            {displayEntry.ieltsRelevance && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px var(--spacing-sm)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  fontFamily: 'var(--font-sans)',
                  background: displayEntry.ieltsRelevance === 'high' ? 'var(--color-success-light)' : displayEntry.ieltsRelevance === 'medium' ? 'var(--color-warning-light)' : 'var(--color-surface-alt)',
                  color: displayEntry.ieltsRelevance === 'high' ? 'var(--color-success)' : displayEntry.ieltsRelevance === 'medium' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-full)',
                  lineHeight: 1.4,
                }}
              >
                IELTS: {displayEntry.ieltsRelevance}
              </span>
            )}
            {displayEntry.tags.filter(t => t !== 'favorite').map(tag => (
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
            onClick={handleEnrich}
            disabled={enriching}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              padding: 0,
              background: enriching ? 'var(--color-primary-light)' : 'none',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              cursor: enriching ? 'not-allowed' : 'pointer',
              color: 'var(--color-primary)',
              opacity: enriching ? 0.6 : 1,
              transition: 'all var(--transition-fast)',
            }}
            aria-label="AI Enrich"
            title="AI Enrich — fill meaning, examples, word forms and more"
          >
            {enriching ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>
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

          {displayEntry.status !== 'mastered' && (
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
            aria-label={`Edit ${displayEntry.word}`}
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
            aria-label={`Delete ${displayEntry.word}`}
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
          <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            {bottomContent}
          </div>
        </div>
        {showWordFamily && (
          <div style={{ marginTop: 'var(--spacing-sm)', minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            <WordFamilyDisplay
              wordFamily={displayWordFamily}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(VocabularyListItem)

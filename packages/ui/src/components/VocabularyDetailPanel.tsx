import { type ReactNode } from 'react'
import type { DifficultyLevel, ReviewStatus } from './VocabularyWordCard'
import { IconClose, IconVolume, IconEdit, IconDelete } from '../icons/IconMap'

export interface VocabularyExample {
  sentence: string
  translation?: string
  source?: string
}

export interface VocabularyDetailPanelProps {
  word: string
  phonetic?: string
  partOfSpeech?: string
  definition: string
  meaning?: string
  examples?: VocabularyExample[]
  synonyms?: string[]
  antonyms?: string[]
  collocations?: string[]
  difficulty?: DifficultyLevel
  reviewStatus?: ReviewStatus
  notes?: string
  tags?: string[]
  imageUrl?: string
  onPlay?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMarkLearned?: () => void
  onDifficultyChange?: (difficulty: DifficultyLevel) => void
  onAddNote?: () => void
  onClose?: () => void
  action?: ReactNode
  children?: ReactNode
  loading?: boolean
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const difficultyColors: Record<DifficultyLevel, { bg: string; text: string; dot: string }> = {
  easy: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)', dot: 'var(--color-success)' },
  medium: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)', dot: 'var(--color-warning)' },
  hard: { bg: 'var(--color-danger-light)', text: 'var(--color-danger-dark)', dot: 'var(--color-danger)' },
}

const statusLabels: Record<ReviewStatus, string> = {
  new: 'New',
  learning: 'Learning',
  reviewing: 'Reviewing',
  mastered: 'Mastered',
}

const statusColors: Record<ReviewStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: 'var(--color-surface-alt)', text: 'var(--color-muted)', dot: 'var(--color-muted)' },
  learning: { bg: 'var(--color-primary-light)', text: 'var(--color-primary-dark)', dot: 'var(--color-primary)' },
  reviewing: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)', dot: 'var(--color-warning)' },
  mastered: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)', dot: 'var(--color-success)' },
}

export function VocabularyDetailPanel({
  word,
  phonetic,
  partOfSpeech,
  definition,
  meaning,
  examples,
  synonyms,
  antonyms,
  collocations,
  difficulty,
  reviewStatus = 'new',
  notes,
  tags,
  imageUrl,
  onPlay,
  onEdit,
  onDelete,
  onMarkLearned,
  onDifficultyChange,
  onAddNote,
  onClose,
  action,
  children,
  loading = false,
}: VocabularyDetailPanelProps) {
  const dc = difficulty ? difficultyColors[difficulty] : undefined
  const sc = statusColors[reviewStatus]

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-lg)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <div
          style={{
            height: '28px',
            width: '60%',
            background: 'var(--color-skeleton)',
            borderRadius: 'var(--radius-md)',
            animation: 'var(--animation-pulse)',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '40%',
            background: 'var(--color-skeleton)',
            borderRadius: 'var(--radius-md)',
            animation: 'var(--animation-pulse)',
          }}
        />
        <div
          style={{
            height: '80px',
            width: '100%',
            background: 'var(--color-skeleton)',
            borderRadius: 'var(--radius-lg)',
            animation: 'var(--animation-pulse)',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '80%',
            background: 'var(--color-skeleton)',
            borderRadius: 'var(--radius-md)',
            animation: 'var(--animation-pulse)',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '50%',
            background: 'var(--color-skeleton)',
            borderRadius: 'var(--radius-md)',
            animation: 'var(--animation-pulse)',
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        padding: 'var(--spacing-lg)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-md)',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            right: 'var(--spacing-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--spacing-xl)',
            height: 'var(--spacing-xl)',
            padding: 0,
            border: 'none',
            background: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            fontSize: 'var(--text-base)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-muted)' }}
        >
          <IconClose size={18} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)', paddingRight: onClose ? 'var(--spacing-xl)' : undefined }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {word}
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              marginTop: 'var(--spacing-2xs)',
              flexWrap: 'wrap',
            }}
          >
            {phonetic && (
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {phonetic}
              </span>
            )}
            {partOfSpeech && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic',
                }}
              >
                {partOfSpeech}
              </span>
            )}
            {onPlay && (
              <button
                type="button"
                aria-label={`Pronounce ${word}`}
                onClick={onPlay}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'var(--spacing-lg)',
                  height: 'var(--spacing-lg)',
                  padding: 0,
                  background: 'var(--color-primary-light)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--text-xs)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-on-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.color = 'var(--color-primary)' }}
              >
                <IconVolume size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing-2xs)', flexShrink: 0 }}>
          {dc && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: 'var(--spacing-3xs) var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                background: dc.bg,
                color: dc.text,
                fontWeight: 'var(--weight-medium)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-3xs)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: dc.dot, display: 'inline-block' }} />
              {difficultyLabels[difficulty!]}
            </span>
          )}
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: 'var(--spacing-3xs) var(--spacing-xs)',
              borderRadius: 'var(--radius-sm)',
              background: sc.bg,
              color: sc.text,
              fontWeight: 'var(--weight-medium)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-3xs)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: sc.dot, display: 'inline-block' }} />
            {statusLabels[reviewStatus]}
          </span>
        </div>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={word}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      )}

      <div
        style={{
          padding: 'var(--spacing-md)',
          background: 'var(--color-surface-alt)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            lineHeight: 'var(--leading-relaxed)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {definition}
        </p>
        {meaning && (
          <p
            style={{
              margin: 'var(--spacing-xs) 0 0',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            {meaning}
          </p>
        )}
      </div>

      {examples && examples.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Examples
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {examples.map((ex, i) => (
              <div
                key={i}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'var(--color-surface-alt)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '3px solid var(--color-primary)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)',
                    lineHeight: 'var(--leading-relaxed)',
                    fontStyle: 'italic',
                  }}
                >
                  "{ex.sentence}"
                </p>
                {ex.translation && (
                  <p
                    style={{
                      margin: 'var(--spacing-2xs) 0 0',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-normal)',
                    }}
                  >
                    {ex.translation}
                  </p>
                )}
                {ex.source && (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--spacing-2xs)',
                      display: 'inline-block',
                    }}
                  >
                    — {ex.source}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {synonyms && synonyms.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Synonyms
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
            {synonyms.map((syn, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  background: 'var(--color-info-light)',
                  color: 'var(--color-info-dark)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {syn}
              </span>
            ))}
          </div>
        </div>
      )}

      {antonyms && antonyms.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Antonyms
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
            {antonyms.map((ant, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  background: 'var(--color-danger-light)',
                  color: 'var(--color-danger-dark)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {ant}
              </span>
            ))}
          </div>
        </div>
      )}

      {collocations && collocations.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Collocations
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
            {collocations.map((col, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  background: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'var(--weight-medium)',
                  border: '1px solid var(--color-border-light)',
                }}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Tags
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2xs)' }}>
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary-dark)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {notes && (
        <div>
          <h4
            style={{
              margin: '0 0 var(--spacing-xs)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
            }}
          >
            Notes
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-lg)',
              borderLeft: '3px solid var(--color-highlight)',
            }}
          >
            {notes}
          </p>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--spacing-xs)',
          paddingTop: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border-light)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
          {onDifficultyChange && difficulty && (
            <div style={{ display: 'flex', gap: 'var(--spacing-3xs)' }}>
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
                const lc = difficultyColors[level]
                const isActive = level === difficulty
                return (
                  <button
                    key={level}
                    type="button"
                    aria-label={`Set difficulty to ${level}`}
                    onClick={() => onDifficultyChange(level)}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: 'var(--spacing-3xs) var(--spacing-xs)',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? lc.bg : 'none',
                      color: isActive ? lc.text : 'var(--color-muted)',
                      border: `1px solid ${isActive ? lc.dot : 'var(--color-border-light)'}`,
                      cursor: 'pointer',
                      fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) { e.currentTarget.style.background = lc.bg; e.currentTarget.style.color = lc.text; e.currentTarget.style.borderColor = lc.dot }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border-light)' }
                    }}
                  >
                    {difficultyLabels[level]}
                  </button>
                )
              })}
            </div>
          )}
          {onMarkLearned && reviewStatus !== 'mastered' && (
            <button
              type="button"
              onClick={onMarkLearned}
              style={{
                fontSize: 'var(--text-xs)',
                padding: 'var(--spacing-3xs) var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-success-light)',
                color: 'var(--color-success-dark)',
                border: '1px solid var(--color-success)',
                cursor: 'pointer',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Mark as learned
            </button>
          )}
          {onAddNote && (
            <button
              type="button"
              onClick={onAddNote}
              style={{
                fontSize: 'var(--text-xs)',
                padding: 'var(--spacing-3xs) var(--spacing-xs)',
                borderRadius: 'var(--radius-sm)',
                background: 'none',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-light)',
                cursor: 'pointer',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              + Add note
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          {onEdit && (
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-lg)',
                height: 'var(--spacing-lg)',
                padding: 0,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <IconEdit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete"
              onClick={onDelete}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-lg)',
                height: 'var(--spacing-lg)',
                padding: 0,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-danger)',
                fontSize: 'var(--text-xs)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <IconDelete size={14} />
            </button>
          )}
          {action}
        </div>
      </div>

      {children}
    </div>
  )
}

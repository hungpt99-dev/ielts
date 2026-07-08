import { useState, useEffect, useMemo, useCallback } from 'react'
import { loadVocabulary, type PopupVocabEntry, type PopupVocabStats } from '../services/popupDataService'
import { getAllVocabulary } from '../../storage/vocabularyStore'
import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { speakText } from '../services/textToSpeech'
import { IconVolume, IconWarning, IconVocabulary, IconBack, IconSearch } from '@ielts/ui'
import WordDetails from './WordDetails'

interface SavedWordsViewProps {
  onBack: () => void
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  new: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  learning: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' },
  reviewing: { bg: 'var(--color-skill-reading-light)', color: 'var(--color-skill-reading)' },
  mastered: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function SavedWordsView({ onBack }: SavedWordsViewProps) {
  const [entries, setEntries] = useState<PopupVocabEntry[]>([])
  const [stats, setStats] = useState<PopupVocabStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'alpha'>('newest')
  const [selectedEntry, setSelectedEntry] = useState<ExtensionVocabEntry | null>(null)

  useEffect(() => {
    loadVocabulary().then((result) => {
      setEntries(result.entries)
      setStats(result.stats)
      setLoading(false)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
      setLoading(false)
    })
  }, [])

  const handleWordClick = useCallback(async (popupEntry: PopupVocabEntry) => {
    try {
      const all = await getAllVocabulary()
      const full = all.find(e => e.id === popupEntry.id || e.word.toLowerCase() === popupEntry.word.toLowerCase())
      if (full) {
        setSelectedEntry(full)
      } else {
        const partial: ExtensionVocabEntry = {
          id: popupEntry.id,
          word: popupEntry.word,
          meaning: popupEntry.meaning,
          meaningVi: '',
          pronunciation: popupEntry.pronunciation,
          partOfSpeech: popupEntry.partOfSpeech,
          topic: popupEntry.topic,
          difficulty: (popupEntry.difficulty || '') as '' | 'easy' | 'medium' | 'hard',
          status: popupEntry.status as ExtensionVocabEntry['status'],
          exampleSentence: '',
          synonyms: [],
          antonyms: [],
          collocations: [],
          wordFamily: [],
          sourceSentence: '',
          pageTitle: '',
          pageUrl: '',
          personalNote: '',
          tags: [],
          addedToReview: false,
          reviewId: '',
          createdAt: popupEntry.createdAt,
          updatedAt: popupEntry.createdAt,
        }
        setSelectedEntry(partial)
      }
    } catch {
      setError('Could not load full word details')
    }
  }, [])

  const filtered = useMemo(() => {
    let result = entries
    if (filter !== 'all') {
      if (filter === 'learning') {
        result = result.filter(e => e.status === 'learning' || e.status === 'reviewing')
      } else {
        result = result.filter(e => e.status === filter)
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.word.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.topic.toLowerCase().includes(q)
      )
    }
    if (sortBy === 'alpha') {
      result = [...result].sort((a, b) => a.word.localeCompare(b.word))
    }
    return result
  }, [entries, filter, search, sortBy])

  if (selectedEntry) {
    return (
      <WordDetails entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-2xl) var(--spacing-md)',
        gap: 'var(--spacing-sm)',
        minHeight: '400px',
      }}>
        <div style={{
          width: 'var(--spacing-lg)',
          height: 'var(--spacing-lg)',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>Loading vocabulary...</span>
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2xs)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-lg)' }} aria-label="Back">
            <IconBack size={16} />
          </button>
          <IconVocabulary size={16} style={{ color: 'var(--color-skill-reading)' }} />
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Vocabulary</span>
        </div>
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-2xl) var(--spacing-md)', gap: 'var(--spacing-sm)', textAlign: 'center' }}>
          <div style={{ width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', borderRadius: 'var(--radius-full)', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconWarning size={24} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{error}</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2xs)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-lg)' }} aria-label="Back">
          <IconBack size={16} />
        </button>
        <IconVocabulary size={16} style={{ color: 'var(--color-skill-reading)' }} />
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Vocabulary</span>
        {stats && (
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', background: 'var(--color-surface-alt)', padding: 'var(--spacing-3xs) var(--spacing-xs)', borderRadius: 'var(--radius-full)' }}>
            {stats.total} words
          </span>
        )}
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { label: 'Total', count: stats.total, color: 'var(--color-text)' },
            { label: 'New', count: stats.newCount, color: 'var(--color-primary)' },
            { label: 'Learning', count: stats.learningCount, color: 'var(--color-warning)' },
            { label: 'Mastered', count: stats.masteredCount, color: 'var(--color-success)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 'var(--spacing-2xs)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', color: s.color }}>{s.count}</div>
              <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 'var(--spacing-xs) var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <IconSearch size={14} style={{ position: 'absolute', left: 'var(--spacing-sm)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            style={{
              width: '100%',
              padding: 'var(--spacing-xs) var(--spacing-sm) var(--spacing-xs) var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--spacing-xs)' }}>
          {(['all', 'new', 'learning', 'mastered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: 'var(--spacing-2xs) var(--spacing-xs)',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontSize: '11px',
                fontWeight: filter === f ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                cursor: 'pointer',
                background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: filter === f ? 'white' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: 'var(--spacing-2xs) var(--spacing-xs)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              fontSize: '11px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="newest">Newest</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-2xl) var(--spacing-md)', gap: 'var(--spacing-xs)', textAlign: 'center' }}>
            <IconVocabulary size={32} style={{ color: 'var(--color-muted)', opacity: 0.4 }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
              {search || filter !== 'all' ? 'No words match your search.' : 'No vocabulary saved yet.'}
            </span>
          </div>
        ) : (
          filtered.map(entry => (
            <div
              key={entry.id}
              onClick={() => handleWordClick(entry)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleWordClick(entry) } }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${entry.word}`}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderBottom: '1px solid var(--color-border-light)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-alt)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-xs)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      {entry.word}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); speakText(entry.word) }}
                      title={`Pronounce "${entry.word}"`}
                      aria-label={`Listen to pronunciation of ${entry.word}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'var(--spacing-lg)',
                        height: 'var(--spacing-lg)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        color: 'var(--color-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-alt)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
                    >
                      <IconVolume size={14} />
                    </button>
                    {entry.pronunciation && (
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                        /{entry.pronunciation}/
                      </span>
                    )}
                    {entry.partOfSpeech && (
                      <span style={{ fontSize: '10px', fontStyle: 'italic', color: 'var(--color-muted)' }}>
                        {entry.partOfSpeech}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-3xs) var(--spacing-xs)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '10px',
                  fontWeight: 'var(--weight-medium)',
                  background: STATUS_STYLE[entry.status]?.bg || 'var(--color-surface-alt)',
                  color: STATUS_STYLE[entry.status]?.color || 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                }}>
                  {entry.status}
                </span>
              </div>
              {entry.meaning && (
                <p style={{ margin: 'var(--spacing-2xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {entry.meaning}
                </p>
              )}
              <div style={{ display: 'flex', gap: '6px', marginTop: 'var(--spacing-2xs)', fontSize: '10px', color: 'var(--color-muted)' }}>
                {entry.topic && <span>#{entry.topic}</span>}
                {entry.difficulty && <span>{DIFFICULTY_LABELS[entry.difficulty] || entry.difficulty}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: 'var(--spacing-xs) var(--spacing-md)', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center' }}>
        {filtered.length} of {entries.length} words shown
      </div>
    </div>
  )
}

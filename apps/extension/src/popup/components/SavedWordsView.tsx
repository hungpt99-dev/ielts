import { useState, useEffect, useMemo, useCallback } from 'react'
import { loadVocabulary, findWord, type PopupVocabEntry, type PopupVocabStats } from '../services/popupDataService'

function speakWord(word: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }
}

interface SavedWordsViewProps {
  onBack: () => void
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  reviewing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  mastered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'alpha'>('newest')

  useEffect(() => {
    loadVocabulary().then((result) => {
      setEntries(result.entries)
      setStats(result.stats)
      setLoading(false)
    }).catch(() => setLoading(false))
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
        Loading vocabulary...
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', color: 'var(--color-text-secondary)' }} aria-label="Back">
          ←
        </button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>Vocabulary</span>
        {stats && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-muted)' }}>
            {stats.total} words
          </span>
        )}
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '12px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{stats.total}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>Total</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#3b82f6' }}>{stats.newCount}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>New</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#f59e0b' }}>{stats.learningCount}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>Learning</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#22c55e' }}>{stats.masteredCount}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '10px' }}>Mastered</div>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {(['all', 'new', 'learning', 'mastered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer',
                background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: filter === f ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '11px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            <option value="newest">Newest</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
            {search || filter !== 'all' ? 'No words match your search.' : 'No vocabulary saved yet.'}
          </div>
        ) : (
          filtered.map(entry => (
            <div
              key={entry.id}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                    {entry.word}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakWord(entry.word) }}
                    title={`Pronounce "${entry.word}"`}
                    aria-label={`Listen to pronunciation of ${entry.word}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      borderRadius: '4px',
                      background: 'transparent',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      flexShrink: 0,
                      verticalAlign: 'middle',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                    </svg>
                  </button>
                  {entry.pronunciation && (
                    <span style={{ marginLeft: '2px', fontSize: '11px', color: 'var(--color-muted)' }}>
                      /{entry.pronunciation}/
                    </span>
                  )}
                  {entry.partOfSpeech && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', fontStyle: 'italic', color: 'var(--color-muted)' }}>
                      {entry.partOfSpeech}
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[entry.status] || ''}`}>
                  {entry.status}
                </span>
              </div>
              {entry.meaning && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {entry.meaning}
                </p>
              )}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '10px', color: 'var(--color-muted)' }}>
                {entry.topic && <span>{entry.topic}</span>}
                {entry.difficulty && <span>{DIFFICULTY_LABELS[entry.difficulty] || entry.difficulty}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-muted)', textAlign: 'center' }}>
        {filtered.length} of {entries.length} words shown
      </div>
    </div>
  )
}

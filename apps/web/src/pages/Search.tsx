import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { DatabaseService } from '../services/storage/Database'
import type {
  VocabularyEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  GrammarNote,
  MistakeEntry,
  SearchResult,
  VocabDifficulty,
  VocabStatus,
  GrammarStatus,
  MistakeStatus,
} from '../models'
import Card, { CardContent, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ErrorState } from '../components/ui/EmptyState'
import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import { IconSearch } from '@ielts/ui'

const SEARCHABLE_TYPES = [
  { value: 'vocabulary' as const, label: 'Vocabulary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]' },
  { value: 'reading' as const, label: 'Reading', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'bg-[var(--color-skill-reading-light)] text-[var(--color-skill-reading-dark)]' },
  { value: 'listening' as const, label: 'Listening', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z', color: 'bg-[var(--color-skill-listening-light)] text-[var(--color-skill-listening-dark)]' },
  { value: 'writing' as const, label: 'Writing', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'bg-[var(--color-skill-writing-light)] text-[var(--color-skill-writing-dark)]' },
  { value: 'speaking' as const, label: 'Speaking', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'bg-[var(--color-skill-speaking-light)] text-[var(--color-skill-speaking-dark)]' },
  { value: 'grammar' as const, label: 'Grammar', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]' },
  { value: 'mistake' as const, label: 'Mistakes', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'bg-[var(--color-danger-light)] text-[var(--color-danger-dark)]' },
]

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
] as const

const VOCAB_DIFFICULTIES: { value: VocabDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const VOCAB_STATUSES: { value: VocabStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'learning', label: 'Learning' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'mastered', label: 'Mastered' },
]

const GRAMMAR_STATUSES: { value: GrammarStatus; label: string }[] = [
  { value: 'weak', label: 'Weak' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'mastered', label: 'Mastered' },
]

const MISTAKE_STATUSES: { value: MistakeStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
]

const SKILLS = [
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'grammar', label: 'Grammar' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function extractSnippet(text: string, query: string, maxLen = 120): string {
  if (!query || !text) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  const start = Math.max(0, idx - 40)
  const end = Math.min(text.length, idx + query.length + 60)
  let snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
  if (snippet.length > maxLen + 30) {
    snippet = snippet.slice(0, maxLen + 30) + '…'
  }
  return snippet
}

function typeToLink(type: string, id: string): string {
  switch (type) {
    case 'vocabulary': return `/vocabulary#${id}`
    case 'reading': return `/reading#${id}`
    case 'listening': return `/listening#${id}`
    case 'writing': return `/writing#${id}`
    case 'speaking': return `/speaking#${id}`
    case 'grammar': return `/grammar#${id}`
    case 'mistake': return `/mistakes#${id}`
    default: return '/'
  }
}

interface Filters {
  query: string
  types: Set<string>
  skills: Set<string>
  topics: Set<string>
  difficulties: Set<string>
  statuses: Set<string>
  dateFrom: string
  dateTo: string
}

function defaultFilters(): Filters {
  return {
    query: '',
    types: new Set(),
    skills: new Set(),
    topics: new Set(),
    difficulties: new Set(),
    statuses: new Set(),
    dateFrom: '',
    dateTo: '',
  }
}

export default function Search() {
  const [allResults, setAllResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        vocabulary,
        readingSessions,
        listeningSessions,
        writingSessions,
        speakingSessions,
        grammarNotes,
        mistakes,
      ] = await Promise.all([
        DatabaseService.getAll<VocabularyEntry>('vocabulary'),
        DatabaseService.getAll<ReadingSession>('readingSessions'),
        DatabaseService.getAll<ListeningSession>('listeningSessions'),
        DatabaseService.getAll<WritingSession>('writingSessions'),
        DatabaseService.getAll<SpeakingSession>('speakingSessions'),
        DatabaseService.getAll<GrammarNote>('grammarNotes'),
        DatabaseService.getAll<MistakeEntry>('mistakes'),
      ])

      const results: SearchResult[] = []

      for (const v of vocabulary) {
        results.push({
          id: v.id,
          type: 'vocabulary',
          title: v.word,
          snippet: `${v.meaning}${v.exampleSentence ? ` — ${v.exampleSentence}` : ''}`,
          skill: 'vocabulary',
          topic: v.topic,
          difficulty: v.difficulty,
          status: v.status,
          date: v.createdAt,
          url: typeToLink('vocabulary', v.id),
        })
      }

      for (const r of readingSessions) {
        results.push({
          id: r.id,
          type: 'reading',
          title: r.title,
          snippet: r.summary || r.passageText.slice(0, 120),
          skill: 'reading',
          topic: r.topic,
          date: r.createdAt,
          url: typeToLink('reading', r.id),
        })
      }

      for (const l of listeningSessions) {
        results.push({
          id: l.id,
          type: 'listening',
          title: l.title,
          snippet: l.transcriptNotes || l.difficultSentences.slice(0, 120),
          skill: 'listening',
          topic: l.topic,
          date: l.createdAt,
          url: typeToLink('listening', l.id),
        })
      }

      for (const w of writingSessions) {
        results.push({
          id: w.id,
          type: 'writing',
          title: w.question.slice(0, 80),
          snippet: w.essay.slice(0, 200),
          skill: 'writing',
          topic: w.topic,
          date: w.createdAt,
          url: typeToLink('writing', w.id),
        })
      }

      for (const s of speakingSessions) {
        results.push({
          id: s.id,
          type: 'speaking',
          title: s.question.slice(0, 80),
          snippet: s.answerNotes.slice(0, 200),
          skill: 'speaking',
          topic: s.topic,
          date: s.createdAt,
          url: typeToLink('speaking', s.id),
        })
      }

      for (const g of grammarNotes) {
        results.push({
          id: g.id,
          type: 'grammar',
          title: g.topic,
          snippet: g.explanation.slice(0, 200),
          skill: 'grammar',
          topic: g.relatedSkill,
          status: g.status,
          date: g.createdAt,
          url: typeToLink('grammar', g.id),
        })
      }

      for (const m of mistakes) {
        results.push({
          id: m.id,
          type: 'mistake',
          title: m.mistake.slice(0, 80),
          snippet: m.correction.slice(0, 200),
          skill: m.skill,
          topic: m.source,
          status: m.status,
          date: m.date,
          url: typeToLink('mistake', m.id),
        })
      }

      setAllResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    inputRef.current?.focus()
  }, [loadAll])

  const availableTopics = useMemo(() => {
    const topics = new Set<string>()
    for (const r of allResults) {
      if (r.topic) topics.add(r.topic)
    }
    for (const t of IELTS_TOPICS) topics.add(t)
    return [...topics].sort()
  }, [allResults])

  const filteredResults = useMemo(() => {
    let results = allResults

    if (filters.query) {
      const q = filters.query.toLowerCase()
      results = results.filter(r => {
        const searchText = [r.title, r.snippet, r.topic, r.skill].filter(Boolean).join(' ').toLowerCase()
        return searchText.includes(q)
      })
    }

    if (filters.types.size > 0) {
      results = results.filter(r => filters.types.has(r.type))
    }

    if (filters.skills.size > 0) {
      results = results.filter(r => r.skill && filters.skills.has(r.skill))
    }

    if (filters.topics.size > 0) {
      results = results.filter(r => r.topic && filters.topics.has(r.topic))
    }

    if (filters.difficulties.size > 0) {
      results = results.filter(r => {
        if (r.type !== 'vocabulary') return true
        return filters.difficulties.has((r as SearchResult).difficulty ?? '')
      })
    }

    if (filters.statuses.size > 0) {
      results = results.filter(r => {
        return r.status ? filters.statuses.has(r.status) : true
      })
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime()
      results = results.filter(r => new Date(r.date).getTime() >= from)
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 86400000
      results = results.filter(r => new Date(r.date).getTime() <= to)
    }

    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return results
  }, [allResults, filters])

  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResult[]>()
    for (const r of filteredResults) {
      const g = groups.get(r.type) ?? []
      g.push(r)
      groups.set(r.type, g)
    }
    return groups
  }, [filteredResults])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.types.size > 0) count++
    if (filters.skills.size > 0) count++
    if (filters.topics.size > 0) count++
    if (filters.difficulties.size > 0) count++
    if (filters.statuses.size > 0) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    return count
  }, [filters])

  function toggleFilter(set: Set<string>, value: string): Set<string> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function clearFilters() {
    setFilters(defaultFilters())
  }

  function getTypeBadge(type: string): { label: string; color: string } {
    const t = SEARCHABLE_TYPES.find(s => s.value === type)
    return t ? { label: t.label, color: t.color } : { label: type, color: '' }
  }

  if (error) {
    return (
      <ErrorState
        variant="card"
        title="Failed to load search data"
        message={error}
        onRetry={loadAll}
        retryLabel="Retry"
      />
    )
  }

  return (
    <PageContent>
      <PageHeader
        icon={<IconSearch size={20} />}
        title="Search"
        description="Search across vocabulary, reading, listening, writing, speaking, grammar, and mistakes"
      />

      <div className="relative">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={filters.query}
            onChange={e => setFilters(f => ({ ...f, query: e.target.value }))}
            placeholder="Search vocabulary, sessions, notes, mistakes..."
            aria-label="Search"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="search-filters"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
          <span className="ml-auto text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            {filters.query && ` for "${filters.query}"`}
          </span>
        </div>
      </div>

      {showFilters && (
        <Card id="search-filters" className="space-y-5">
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </legend>
                <div className="flex flex-wrap gap-2">
                  {SEARCHABLE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setFilters(f => ({ ...f, types: toggleFilter(f.types, t.value) }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        filters.types.has(t.value)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Skill
                </legend>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setFilters(f => ({ ...f, skills: toggleFilter(f.skills, s.value) }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        filters.skills.has(s.value)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Topic
                </legend>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {availableTopics.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilters(f => ({ ...f, topics: toggleFilter(f.topics, t) }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        filters.topics.has(t)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Difficulty filter (vocabulary only) */}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Difficulty
                </legend>
                <div className="flex flex-wrap gap-2">
                  {VOCAB_DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setFilters(f => ({ ...f, difficulties: toggleFilter(f.difficulties, d.value) }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        filters.difficulties.has(d.value)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...VOCAB_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ...GRAMMAR_STATUSES.map(s => ({ value: s.value, label: `${s.label} (grammar)` })),
                    ...MISTAKE_STATUSES.map(s => ({ value: s.value, label: `${s.label} (mistake)` })),
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setFilters(f => ({ ...f, statuses: toggleFilter(f.statuses, s.value) }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        filters.statuses.has(s.value)
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date Range
                </legend>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    aria-label="From date"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    aria-label="To date"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </fieldset>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div style={{ padding: 'var(--spacing-md) 0' }}>
          <LoadingSkeleton variant="card" count={4} gap="var(--spacing-md)" />
        </div>
      )}

      {!loading && filteredResults.length === 0 && (
        <div style={{ padding: 'var(--spacing-lg) 0' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'var(--spacing-2xl) var(--spacing-md)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--color-border)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-muted)',
              }}
            >
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-sans)',
                margin: 0,
              }}
            >
              {filters.query || activeFilterCount > 0 ? 'No results found' : 'Start searching'}
            </h3>
            <p
              style={{
                marginTop: 'var(--spacing-xs)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 'var(--leading-relaxed)',
                maxWidth: '360px',
              }}
            >
              {filters.query || activeFilterCount > 0
                ? 'Try adjusting your search query or filters.'
                : 'Type a word or phrase above to search across your IELTS data.'}
            </p>
            {(filters.query || activeFilterCount > 0) && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && filteredResults.length > 0 && (
        <div className="space-y-6">
          {SEARCHABLE_TYPES.map(typeInfo => {
            const items = groupedResults.get(typeInfo.value)
            if (!items || items.length === 0) return null
            return (
              <Card key={typeInfo.value}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {items.length} result{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800" role="list">
                    {items.map(item => {
                      const badge = getTypeBadge(item.type)
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <Link
                            to={item.url}
                            className="block rounded-lg px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                  {item.topic && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                      {item.topic}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                  {filters.query
                                    ? extractSnippet(item.snippet, filters.query)
                                    : item.snippet.slice(0, 150) + (item.snippet.length > 150 ? '…' : '')}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <time className="whitespace-nowrap text-xs text-slate-400" dateTime={item.date}>
                                  {formatDate(item.date)}
                                </time>
                              </div>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageContent>
  )
}

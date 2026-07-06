import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TopicProgress } from '../models'
import { DatabaseService } from '../services/storage/Database'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/layout/PageHeader'
import { IconProgress } from '@ielts/ui'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type SortKey = 'topic' | 'progress' | 'updated'

export default function TopicsProgress() {
  const [topics, setTopics] = useState<TopicProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('progress')
  const [sortDesc, setSortDesc] = useState(true)

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<TopicProgress>('topicsProgress')
      setTopics(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics progress')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  const stats = useMemo(() => {
    const total = topics.length
    const avgProgress = total > 0
      ? Math.round(topics.reduce((s, t) => s + t.progressPercent, 0) / total)
      : 0
    const mastered = topics.filter(t => t.progressPercent >= 80).length
    const needsReview = topics.filter(t => t.progressPercent < 40).length
    return { total, avgProgress, mastered, needsReview }
  }, [topics])

  const filteredTopics = useMemo(() => {
    let filtered = [...topics]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t => t.topic.toLowerCase().includes(q))
    }
    filtered.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'topic') cmp = a.topic.localeCompare(b.topic)
      else if (sortBy === 'progress') cmp = a.progressPercent - b.progressPercent
      else cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return sortDesc ? -cmp : cmp
    })
    return filtered
  }, [topics, search, sortBy, sortDesc])

  const getProgressColor = (pct: number): string => {
    if (pct >= 80) return 'bg-[var(--color-primary)]'
    if (pct >= 60) return 'bg-[var(--color-primary)]'
    if (pct >= 40) return 'bg-[var(--color-warning)]'
    return 'bg-[var(--color-danger)]'
  }

  const getProgressLabel = (pct: number): string => {
    if (pct >= 80) return 'Mastered'
    if (pct >= 60) return 'Good'
    if (pct >= 40) return 'Fair'
    return 'Needs Review'
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadTopics}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 sm:pt-6">
      <PageHeader
        icon={<IconProgress size={20} />}
        title="Topics Progress"
        description="Track your progress across IELTS topics and skills"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Topics
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.avgProgress}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mastered
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.mastered}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Needs Review
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.needsReview}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search topics"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="progress">Progress</option>
              <option value="topic">Topic A-Z</option>
              <option value="updated">Last Updated</option>
            </select>
            <button
              onClick={() => setSortDesc(d => !d)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Toggle sort direction"
            >
              {sortDesc ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </CardContent>
      </Card>

      {filteredTopics.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {topics.length === 0
                  ? 'No topics progress data yet.'
                  : 'No topics match your search.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {topics.length === 0
                  ? 'Progress will appear as you study different IELTS topics.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map(topic => (
            <div
              key={topic.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {topic.topic}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      topic.progressPercent >= 80
                        ? 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]'
                        : topic.progressPercent >= 60
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                        : topic.progressPercent >= 40
                        ? 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]'
                        : 'bg-[var(--color-danger-light)] text-[var(--color-danger-dark)]'
                    }`}>
                      {getProgressLabel(topic.progressPercent)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(topic.progressPercent)}`}
                          style={{ width: `${topic.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                      {topic.progressPercent}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>Vocab: {topic.vocabularyCount}</span>
                    <span>Reading: {topic.readingCount}</span>
                    <span>Listening: {topic.listeningCount}</span>
                    <span>Writing: {topic.writingCount}</span>
                    <span>Speaking: {topic.speakingCount}</span>
                    <span>Last reviewed: {formatDate(topic.lastReviewedAt)}</span>
                  </div>
                </div>
              </div>
              {topic.weakPoints.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-700">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Weak points:
                  </span>
                  {topic.weakPoints.map((wp, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-dark)' }}
                    >
                      {wp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

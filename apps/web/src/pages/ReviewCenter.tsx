import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DatabaseService } from '../services/storage/Database'
import { getDailyReviewQueue } from '../utils/spaced-repetition'
import type {
  VocabularyEntry,
  VocabReviewEntry,
  GrammarNote,
  MistakeEntry,
  WritingSession,
  SpeakingSession,
} from '../models'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/layout/PageHeader'
import PageContent from '../components/layout/PageContent'
import { IconMistakeReview } from '@ielts/ui'

interface ReviewGroup {
  id: string
  title: string
  description: string
  count: number
  items: Array<{ id: string; label: string; subtitle?: string }>
  linkTo: string
  icon: string
  color: string
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(dateStr: string, days: number): boolean {
  const d = new Date(dateStr)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return d < cutoff
}

export default function ReviewCenter() {
  const [groups, setGroups] = useState<ReviewGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReviewData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [vocabulary, reviews, grammarNotes, mistakes, writingSessions, speakingSessions] =
        await Promise.all([
          DatabaseService.getAll<VocabularyEntry>('vocabulary'),
          DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
          DatabaseService.getAll<GrammarNote>('grammarNotes'),
          DatabaseService.getAll<MistakeEntry>('mistakes'),
          DatabaseService.getAll<WritingSession>('writingSessions'),
          DatabaseService.getAll<SpeakingSession>('speakingSessions'),
        ])

      const today = getToday()

      // 1. Vocabulary due today
      const reviewQueue = getDailyReviewQueue(vocabulary, reviews, today)
      const dueVocab: ReviewGroup['items'] = reviewQueue.map(item => ({
        id: item.vocab.id,
        label: item.vocab.word,
        subtitle: item.vocab.meaning,
      }))

      // 2. Difficult words — hard difficulty or new/learning status that aren't already in due queue
      const dueVocabIds = new Set(reviewQueue.map(r => r.vocab.id))
      const difficultWords = vocabulary.filter(
        v => !dueVocabIds.has(v.id) && (v.difficulty === 'hard' || v.status === 'new' || v.status === 'learning')
      )
      const difficultItems: ReviewGroup['items'] = difficultWords.map(v => ({
        id: v.id,
        label: v.word,
        subtitle: `${v.meaning} (${v.status}, ${v.difficulty})`,
      }))

      // 3. Grammar weak points
      const weakGrammar = grammarNotes.filter(g => g.status === 'weak')
      const grammarItems: ReviewGroup['items'] = weakGrammar.map(g => ({
        id: g.id,
        label: g.topic,
        subtitle: g.explanation.slice(0, 80) + (g.explanation.length > 80 ? '…' : ''),
      }))

      // 4. Repeated mistakes — sorted by repetitionCount descending
      const sortedMistakes = [...mistakes]
        .sort((a, b) => b.repetitionCount - a.repetitionCount || new Date(b.date).getTime() - new Date(a.date).getTime())
      const mistakeItems: ReviewGroup['items'] = sortedMistakes.slice(0, 20).map(m => ({
        id: m.id,
        label: m.mistake.slice(0, 60) + (m.mistake.length > 60 ? '…' : ''),
        subtitle: `${m.correction.slice(0, 60)}${m.correction.length > 60 ? '…' : ''} (×${m.repetitionCount})`,
      }))

      // 5. Old essays to review — writing sessions without betterVersion, older than 7 days
      const oldEssays = writingSessions.filter(
        w => !w.betterVersion && daysAgo(w.createdAt, 7)
      )
      const essayItems: ReviewGroup['items'] = oldEssays.map(w => ({
        id: w.id,
        label: w.question.slice(0, 60) + (w.question.length > 60 ? '…' : ''),
        subtitle: `${w.taskType === 'task1' ? 'Task 1' : 'Task 2'} — ${w.topic} (${w.createdAt.slice(0, 10)})`,
      }))

      // 6. Old speaking answers to improve — without improvedAnswer, older than 7 days
      const oldSpeaking = speakingSessions.filter(
        s => !s.improvedAnswer && daysAgo(s.createdAt, 7)
      )
      const speakingItems: ReviewGroup['items'] = oldSpeaking.map(s => ({
        id: s.id,
        label: s.question.slice(0, 60) + (s.question.length > 60 ? '…' : ''),
        subtitle: `Part ${s.part} — ${s.topic} (${s.createdAt.slice(0, 10)})`,
      }))

      setGroups([
        {
          id: 'vocabulary-due',
          title: 'Vocabulary Due Today',
          description: 'Words scheduled for review by spaced repetition',
          count: dueVocab.length,
          items: dueVocab,
          linkTo: '/review',
          icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
          color: 'border-l-purple-500',
        },
        {
          id: 'difficult-words',
          title: 'Difficult Words',
          description: 'Words marked as hard or still in new/learning status',
          count: difficultItems.length,
          items: difficultItems,
          linkTo: '/vocabulary',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
          color: 'border-l-red-500',
        },
        {
          id: 'grammar-weak',
          title: 'Grammar Weak Points',
          description: 'Grammar topics marked as weak and needing review',
          count: grammarItems.length,
          items: grammarItems,
          linkTo: '/grammar',
          icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
          color: 'border-l-orange-500',
        },
        {
          id: 'repeated-mistakes',
          title: 'Repeated Mistakes',
          description: 'Common mistakes sorted by frequency',
          count: mistakeItems.length,
          items: mistakeItems,
          linkTo: '/mistakes',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
          color: 'border-l-yellow-500',
        },
        {
          id: 'old-essays',
          title: 'Old Essays to Review',
          description: 'Writing sessions older than 7 days without an improved version',
          count: essayItems.length,
          items: essayItems,
          linkTo: '/writing',
          icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
          color: 'border-l-blue-500',
        },
        {
          id: 'old-speaking',
          title: 'Old Speaking Answers to Improve',
          description: 'Speaking sessions older than 7 days without an improved answer',
          count: speakingItems.length,
          items: speakingItems,
          linkTo: '/speaking',
          icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
          color: 'border-l-green-500',
        },
      ])
    } catch (err) {
      console.error('apps/web/src/pages/ReviewCenter.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReviewData()
  }, [loadReviewData])

  const totalDue = useMemo(() => groups.reduce((sum, g) => sum + g.count, 0), [groups])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          role="status"
          className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadReviewData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (totalDue === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All caught up!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Nothing needs your review right now. Great work staying on top of things!
            </p>
            <Button className="mt-6" variant="secondary" onClick={loadReviewData}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageContent className="space-y-6">
      <PageHeader
        icon={<IconMistakeReview size={20} />}
        title="Review Center"
        description={`${totalDue} item${totalDue !== 1 ? 's' : ''} need${totalDue === 1 ? 's' : ''} your attention`}
        actions={
          <Button variant="secondary" size="sm" onClick={loadReviewData}>
            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6">
        {groups
          .filter(g => g.count > 0)
          .map(group => (
            <Card key={group.id} className={`border-l-4 ${group.color}`}>
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={group.icon} />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>{group.title}</CardTitle>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {group.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-bold tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {group.count}
                  </span>
                  <Link
                    to={group.linkTo}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    Review
                  </Link>
                </div>
              </CardHeader>
              {group.items.length > 0 && (
                <CardContent className="pt-0">
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.items.slice(0, 10).map(item => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 py-2"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {item.label}
                          </p>
                          {item.subtitle && (
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                    {group.items.length > 10 && (
                      <li className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                        +{group.items.length - 10} more {group.title.toLowerCase()}
                      </li>
                    )}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
      </div>
    </PageContent>
  )
}

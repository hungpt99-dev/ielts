import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type {
  ReadingQuestion,
  ReadingPassageWithQuestions,
  ReadingPracticeSession,
} from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Question from './components/Question'
import { ensureSeedData, loadAllPassages } from './passageSeedService'
import { generateId } from '../../utils'
import { generateReadingPassage, generateQuestionsForPassage } from '../../services/ai/AIService'
import PageHeader from '../../components/layout/PageHeader'
import { IconReading } from '@ielts/ui'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${minutes}m ${s}s` : `${minutes}m`
}

function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

function normalizeAnswer(userAnswer: unknown, correctAnswer: string | number | string[]): boolean {
  if (userAnswer === undefined || userAnswer === null) return false
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
  }
  if (typeof userAnswer === 'number' && typeof correctAnswer === 'number') {
    return userAnswer === correctAnswer
  }
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    return (
      userAnswer.length === correctAnswer.length &&
      userAnswer.every((v, i) => v.toLowerCase().trim() === (correctAnswer[i] as string).toLowerCase().trim())
    )
  }
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
}

function checkAnswer(question: ReadingQuestion, answer: unknown): boolean {
  if (question.type === 'matching-headings') {
    const correctMatches = question.correctMatches || {}
    const userMatches = (answer as Record<string, number>) || {}
    const keys = Object.keys(correctMatches)
    if (keys.length === 0) return false
    return keys.every((k) => userMatches[k] === correctMatches[k])
  }
  if (question.type === 'gap-fill') {
    const blanks = question.blanks || []
    const userBlanks = (answer as string[]) || []
    if (blanks.length === 0) return false
    return blanks.every((b, i) => userBlanks[i]?.toLowerCase().trim() === b.toLowerCase().trim())
  }
  return normalizeAnswer(answer, question.correctAnswer)
}

function getAnswerLabel(question: ReadingQuestion): string {
  if (question.type === 'multiple-choice') {
    const idx = question.correctAnswer as number
    const letter = String.fromCharCode(65 + idx)
    return `${letter}. ${question.options?.[idx] || ''}`
  }
  if (question.type === 'true-false-not-given') {
    const labels: Record<string, string> = { true: 'True', false: 'False', 'not-given': 'Not Given' }
    return labels[question.correctAnswer as string] || String(question.correctAnswer)
  }
  if (question.type === 'matching-headings') {
    const matches = question.correctMatches || {}
    return Object.entries(matches)
      .map(([k, v]) => `${k} → ${String.fromCharCode(65 + v)}`)
      .join(', ')
  }
  if (question.type === 'gap-fill') {
    return (question.blanks || []).join(', ')
  }
  return String(question.correctAnswer)
}

function getUserAnswerLabel(question: ReadingQuestion, answer: unknown): string {
  if (answer === undefined || answer === null) return 'No answer'
  if (question.type === 'multiple-choice') {
    const idx = answer as number
    const letter = String.fromCharCode(65 + idx)
    return `${letter}. ${question.options?.[idx] || ''}`
  }
  if (question.type === 'true-false-not-given') {
    const labels: Record<string, string> = { true: 'True', false: 'False', 'not-given': 'Not Given' }
    return labels[answer as string] || String(answer)
  }
  if (question.type === 'matching-headings') {
    const matches = answer as Record<string, number>
    return Object.entries(matches)
      .map(([k, v]) => `${k} → ${String.fromCharCode(65 + v)}`)
      .join(', ') || 'No answer'
  }
  if (question.type === 'gap-fill') {
    return (answer as string[])?.filter(Boolean).join(', ') || 'No answer'
  }
  return String(answer)
}

export default function ReadingPractice() {
  const [view, setView] = useState<'browse' | 'reading' | 'results' | 'history'>('browse')

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  const [currentPassage, setCurrentPassage] = useState<ReadingPassageWithQuestions | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [results, setResults] = useState<{
    score: number
    total: number
    accuracy: number
    timeSpentSeconds: number
    questionResults: Array<{ question: ReadingQuestion; answer: unknown; isCorrect: boolean }>
  } | null>(null)
  const [aiGeneratedPassage, setAiGeneratedPassage] = useState<ReadingPassageWithQuestions | null>(null)
  const [allPassages, setAllPassages] = useState<ReadingPassageWithQuestions[]>([])

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [history, setHistory] = useState<ReadingPracticeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [historyDetail, setHistoryDetail] = useState<ReadingPracticeSession | null>(null)
  const [generatingQuestions, setGeneratingQuestions] = useState<Record<string, boolean>>({})
  const [generateError, setGenerateError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const all = await DatabaseService.getAll<ReadingPracticeSession>('readingPracticeSessions')
      setHistory(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reading history')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPassages = useCallback(async () => {
    try {
      await ensureSeedData()
      const passages = await loadAllPassages()
      setAllPassages(passages)
    } catch {}
  }, [])

  useEffect(() => {
    loadPassages()
  }, [loadPassages])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const displayPassages = useMemo(() => {
    const passages = [...allPassages]
    if (aiGeneratedPassage) passages.unshift(aiGeneratedPassage)
    return passages
  }, [allPassages, aiGeneratedPassage])

  const filteredPassages = useMemo(() => {
    let filtered = displayPassages
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.text.toLowerCase().includes(query) ||
          p.topic.toLowerCase().includes(query)
      )
    }
    if (topicFilter) filtered = filtered.filter(p => p.topic === topicFilter)
    if (difficultyFilter) filtered = filtered.filter(p => p.difficulty === difficultyFilter)
    return filtered
  }, [displayPassages, search, topicFilter, difficultyFilter])

  function startPassage(passage: ReadingPassageWithQuestions) {
    setCurrentPassage(passage)
    setAnswers({})
    setResults(null)
    setTimerSeconds(0)
    setTimerRunning(true)
    setView('reading')
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimerSeconds(s => s + 1)
    }, 1000)
    setTimerRunning(true)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimerRunning(false)
  }

  useEffect(() => {
    if (timerRunning) {
      startTimer()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  function handleAnswer(questionId: string, answer: unknown) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  function handleSubmit() {
    if (!currentPassage) return
    stopTimer()

    const questionResults = currentPassage.questions.map(q => ({
      question: q,
      answer: answers[q.id],
      isCorrect: checkAnswer(q, answers[q.id]),
    }))

    const score = questionResults.filter(r => r.isCorrect).length
    const total = questionResults.length
    const accuracy = computeAccuracy(score, total)

    setResults({
      score,
      total,
      accuracy,
      timeSpentSeconds: timerSeconds,
      questionResults,
    })
    setView('results')

    const mistakes = questionResults
      .filter(r => !r.isCorrect)
      .map(r => ({
        questionId: r.question.id,
        question: r.question.question,
        userAnswer: getUserAnswerLabel(r.question, r.answer),
        correctAnswer: getAnswerLabel(r.question),
        explanation: r.question.explanation,
      }))

    const session: ReadingPracticeSession = {
      id: generateId(),
      passageId: currentPassage.id,
      title: currentPassage.title,
      topic: currentPassage.topic,
      passageText: currentPassage.text,
      questions: currentPassage.questions,
      answers: answers as Record<string, unknown>,
      score,
      totalQuestions: total,
      accuracy,
      timeSpentSeconds: timerSeconds,
      mistakes,
      createdAt: new Date().toISOString(),
    }

    DatabaseService.add('readingPracticeSessions', session).catch(() => {})
    setHistory(prev => [session, ...prev])
  }

  function handleReset() {
    stopTimer()
    setCurrentPassage(null)
    setAnswers({})
    setResults(null)
    setTimerSeconds(0)
    setView('browse')
  }

  function handleViewHistory() {
    loadHistory()
    setView('history')
  }

  async function handleAiGenerate() {
    if (!aiTopic.trim()) {
      setAiError('Please select or enter a topic')
      return
    }

    setAiGenerating(true)
    setAiError(null)

    try {
      const { content, error } = await generateReadingPassage({
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
      })

      if (error) {
        throw new Error(error)
      }

      if (!content) {
        throw new Error('AI returned an empty response. Try again.')
      }

      let parsed: Record<string, unknown>
      try {
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
        parsed = JSON.parse(jsonStr) as Record<string, unknown>
      } catch {
        throw new Error('Failed to parse AI response. The response was not valid JSON.')
      }

      if (!parsed.title || !parsed.text || !Array.isArray(parsed.questions)) {
        throw new Error('AI response missing required fields (title, text, or questions)')
      }

      const validTypes = ['multiple-choice', 'true-false-not-given', 'gap-fill'] as const

      const passage: ReadingPassageWithQuestions = {
        id: generateId(),
        title: parsed.title as string,
        topic: aiTopic.trim(),
        text: parsed.text as string,
        questions: (parsed.questions as Record<string, unknown>[]).map((q, i) => ({
          id: `ai-q${i}`,
          type: (validTypes as readonly string[]).includes(q.type as string)
            ? (q.type as 'multiple-choice' | 'true-false-not-given' | 'gap-fill')
            : 'multiple-choice',
          question: q.question as string,
          options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
          correctAnswer: q.correctAnswer ?? 0,
          explanation: (q.explanation as string) || '',
          blanks: Array.isArray(q.blanks) ? (q.blanks as string[]) : undefined,
        })),
        difficulty: aiDifficulty,
        wordCount: (parsed.text as string).split(/\s+/).length,
        estimatedMinutes: 20,
      }

      setAiGeneratedPassage(passage)
      setAiModalOpen(false)
      startPassage(passage)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate reading passage')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleGenerateExercise = useCallback(async (passage: ReadingPassageWithQuestions) => {
    setGeneratingQuestions(prev => ({ ...prev, [passage.id]: true }))
    setGenerateError(null)

    try {
      const { content, error } = await generateQuestionsForPassage({
        title: passage.title,
        text: passage.text,
        difficulty: passage.difficulty,
      })

      if (error) throw new Error(error)
      if (!content) throw new Error('AI returned an empty response')

      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>
      const questions = parsed.questions as Record<string, unknown>[]

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI returned no questions')
      }

      const validTypes = ['multiple-choice', 'true-false-not-given', 'gap-fill', 'matching-headings'] as const

      const newQuestions: ReadingQuestion[] = questions.map((q, i) => ({
        id: `${passage.id}-gq${i}`,
        type: (validTypes as readonly string[]).includes(q.type as string)
          ? (q.type as 'multiple-choice' | 'true-false-not-given' | 'gap-fill' | 'matching-headings')
          : 'multiple-choice',
        question: q.question as string,
        options: Array.isArray(q.options) ? q.options as string[] : undefined,
        correctAnswer: q.correctAnswer ?? 0,
        explanation: (q.explanation as string) || '',
        blanks: Array.isArray(q.blanks) ? q.blanks as string[] : undefined,
        headings: Array.isArray(q.headings) ? q.headings as string[] : undefined,
        paragraphs: Array.isArray(q.paragraphs) ? q.paragraphs as { id: string; text: string }[] : undefined,
        correctMatches: q.correctMatches as Record<string, number> | undefined,
      }))

      setAllPassages(prev => prev.map(p =>
        p.id === passage.id ? { ...p, questions: newQuestions } : p
      ))

      if (currentPassage?.id === passage.id) {
        setCurrentPassage(prev => prev ? { ...prev, questions: newQuestions } : null)
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setGeneratingQuestions(prev => ({ ...prev, [passage.id]: false }))
    }
  }, [currentPassage])

  const historyStats = useMemo(() => {
    if (history.length === 0) return null
    const total = history.length
    const avgAccuracy = Math.round(history.reduce((s, h) => s + h.accuracy, 0) / total)
    const totalTime = history.reduce((s, h) => s + h.timeSpentSeconds, 0)
    const totalCorrect = history.reduce((s, h) => s + h.score, 0)
    const totalQuestions = history.reduce((s, h) => s + h.totalQuestions, 0)
    const bestAccuracy = Math.max(...history.map(h => h.accuracy))
    return { total, avgAccuracy, totalTime, totalCorrect, totalQuestions, bestAccuracy }
  }, [history])

  if (loading && view === 'history') {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error && view === 'history') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadHistory}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {view === 'browse' && (
        <>
          <PageHeader
            icon={<IconReading size={22} />}
            title="Reading Practice"
            description="Practice IELTS reading with passages and comprehension questions"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAiModalOpen(true)} variant="secondary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Generate
                </Button>
                <Button onClick={handleViewHistory} variant="secondary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </Button>
            </div>
          }
        />

          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[200px] flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search passages..."
                    className="w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    aria-label="Search reading passages"
                  />
                </div>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Filter by topic"
                >
                  <option value="">All Topics</option>
                  {TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Filter by difficulty"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {generateError && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger)',
            }}>
              {generateError}
              <button
                className="ml-2 underline"
                onClick={() => setGenerateError(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {filteredPassages.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="No passages available."
              description="Generate a custom passage with AI or search for different topics."
              action={{ label: 'Generate with AI', onClick: () => setAiModalOpen(true) }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPassages.map(passage => (
                <Card key={passage.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor:
                              passage.difficulty === 'easy'
                                ? 'var(--color-success-light)'
                                : passage.difficulty === 'hard'
                                  ? 'var(--color-danger-light)'
                                  : 'var(--color-primary-light)',
                            color:
                              passage.difficulty === 'easy'
                                ? 'var(--color-success)'
                                : passage.difficulty === 'hard'
                                  ? 'var(--color-danger)'
                                  : 'var(--color-primary)',
                          }}
                        >
                          {passage.difficulty.charAt(0).toUpperCase() + passage.difficulty.slice(1)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {passage.topic}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {passage.wordCount} words
                        </span>
                      </div>
                    </div>
                    <h3
                      className="mt-3 text-base font-semibold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {passage.title}
                    </h3>
                    <p
                      className="mt-2 line-clamp-3 text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {passage.text}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {passage.questions.length} questions &middot; ~{passage.estimatedMinutes} min
                      </span>
                      <div className="flex gap-2">
                        {passage.questions.length === 0 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleGenerateExercise(passage)}
                            loading={generatingQuestions[passage.id]}
                            disabled={generatingQuestions[passage.id]}
                            aria-label="Generate exercise questions"
                          >
                            {generatingQuestions[passage.id] ? 'Generating...' : 'Generate Exercise'}
                          </Button>
                        )}
                        <Button size="sm" onClick={() => startPassage(passage)}>
                          {passage.questions.length > 0 ? 'Start Practice' : 'Read'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'reading' && currentPassage && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {currentPassage.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {currentPassage.topic}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {currentPassage.wordCount} words
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                style={{
                  borderColor: 'var(--color-border)',
                  color: timerSeconds > currentPassage.estimatedMinutes * 60 ? 'var(--color-danger)' : 'var(--color-text)',
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(timerSeconds)}
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Quit
              </Button>
            </div>
          </div>

          <Card>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--color-text)', fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
                >
                  {currentPassage.text}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Questions ({currentPassage.questions.length})
              </h2>
              {currentPassage.questions.length === 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGenerateExercise(currentPassage)}
                  loading={generatingQuestions[currentPassage.id]}
                  disabled={generatingQuestions[currentPassage.id]}
                >
                  {generatingQuestions[currentPassage.id] ? 'Generating...' : 'Generate Exercise'}
                </Button>
              )}
            </div>

            {generateError && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
              }}>
                {generateError}
              </div>
            )}

            <div className="space-y-4">
              {currentPassage.questions.length === 0 && !generatingQuestions[currentPassage.id] && (
                <Card>
                  <CardContent>
                    <div className="py-8 text-center">
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        No questions yet. Generate exercise questions using AI.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {currentPassage.questions.map((q, i) => (
                <Question
                  key={q.id}
                  question={q}
                  index={i}
                  answer={answers[q.id]}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center pb-8">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={currentPassage.questions.length === 0}
            >
              Submit Answers
            </Button>
          </div>
        </div>
      )}

      {view === 'results' && results && currentPassage && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Results: {currentPassage.title}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {formatDate(new Date().toISOString())} &middot; {formatTime(results.timeSpentSeconds)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Score</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {results.score}/{results.total}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Accuracy</p>
                <p
                  className="mt-1 text-2xl font-bold"
                  style={{
                    color:
                      results.accuracy >= 80
                        ? 'var(--color-success)'
                        : results.accuracy >= 60
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                  }}
                >
                  {results.accuracy}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Time</p>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatTime(results.timeSpentSeconds)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Mistakes</p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                  {results.total - results.score}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Question Review
            </h2>
            {results.questionResults.map((r, i) => (
              <Question
                key={r.question.id}
                question={r.question}
                index={i}
                answer={r.answer}
                onAnswer={() => {}}
                showResult
                isCorrect={r.isCorrect}
              />
            ))}
          </div>

          {results.questionResults.filter(r => !r.isCorrect).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mistakes Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.questionResults
                    .filter(r => !r.isCorrect)
                    .map(r => (
                      <div
                        key={r.question.id}
                        className="rounded-lg border p-3 text-sm"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface-alt)',
                        }}
                      >
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {r.question.question}
                        </p>
                        <p className="mt-1" style={{ color: 'var(--color-danger)' }}>
                          Your answer: {getUserAnswerLabel(r.question, r.answer)}
                        </p>
                        <p style={{ color: 'var(--color-success)' }}>
                          Correct answer: {getAnswerLabel(r.question)}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                          {r.question.explanation}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-3 pb-8">
            <Button variant="secondary" onClick={handleReset}>
              Back to Passages
            </Button>
            <Button onClick={() => startPassage(currentPassage)}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Reading History
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Track your reading practice progress over time
              </p>
            </div>
            <Button variant="secondary" onClick={() => setView('browse')}>
              Back to Passages
            </Button>
          </div>

          {historyStats && (
            <div className="grid gap-4 sm:grid-cols-5">
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Practices</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{historyStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Avg Accuracy</p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{historyStats.avgAccuracy}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Best Score</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{historyStats.bestAccuracy}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Questions Done</p>
                  <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{historyStats.totalQuestions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Time</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatTime(historyStats.totalTime)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {history.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="No reading practice history yet."
              description="Complete a reading practice to see your history here."
              action={{ label: 'Start Reading Practice', onClick: () => setView('browse') }}
            />
          ) : (
            <div className="space-y-3">
              {history.map((session, idx) => {
                const accuracyColor =
                  session.accuracy >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : session.accuracy >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                return (
                  <Card key={session.id}>
                    <CardContent
                      className="flex cursor-pointer items-start justify-between gap-4"
                      onClick={() => setHistoryDetail(session)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            #{history.length - idx}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-surface-alt)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {session.topic}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {session.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                          <span>{formatDate(session.createdAt)}</span>
                          <span>{formatTime(session.timeSpentSeconds)}</span>
                          <span className={accuracyColor}>
                            {session.accuracy}% ({session.score}/{session.totalQuestions})
                          </span>
                          {session.mistakes.length > 0 && (
                            <span className="text-red-500 dark:text-red-400">
                              {session.mistakes.length} mistake{session.mistakes.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal open={aiModalOpen} onClose={() => { setAiModalOpen(false); setAiError(null) }} title="Generate AI Reading Passage" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-topic" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Topic
            </label>
            <input
              id="ai-topic"
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g., Climate Change, Space Exploration, Urban Development"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            />
          </div>
          <div>
            <label htmlFor="ai-difficulty" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Difficulty
            </label>
            <select
              id="ai-difficulty"
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              <option value="easy">Easy (Band 5-6)</option>
              <option value="medium">Medium (Band 6-7)</option>
              <option value="hard">Hard (Band 7-9)</option>
            </select>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
            This will use your AI API key configured in Settings. The generated passage will include questions and explanations.
          </p>
          {aiError && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{aiError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setAiModalOpen(false); setAiError(null) }}>
              Cancel
            </Button>
            <Button onClick={handleAiGenerate} loading={aiGenerating} disabled={!aiTopic.trim()}>
              Generate Passage
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!historyDetail}
        onClose={() => setHistoryDetail(null)}
        title={historyDetail?.title ?? ''}
        size="lg"
      >
        {historyDetail && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Date
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatDate(historyDetail.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Topic
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{historyDetail.topic}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Time Spent
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatTime(historyDetail.timeSpentSeconds)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Score
                </span>
                <p
                  className="mt-0.5 font-semibold"
                  style={{
                    color:
                      historyDetail.accuracy >= 80
                        ? 'var(--color-success)'
                        : historyDetail.accuracy >= 60
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                  }}
                >
                  {historyDetail.score}/{historyDetail.totalQuestions} ({historyDetail.accuracy}%)
                </p>
              </div>
            </div>

            {historyDetail.passageText && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Passage
                </span>
                <p
                  className="mt-1 whitespace-pre-wrap rounded-lg border p-3 text-xs leading-relaxed"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {historyDetail.passageText}
                </p>
              </div>
            )}

            {historyDetail.mistakes.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Mistakes ({historyDetail.mistakes.length})
                </span>
                <div className="mt-1 space-y-2">
                  {historyDetail.mistakes.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-alt)',
                      }}
                    >
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{m.question}</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>Your answer: {m.userAnswer}</p>
                      <p className="text-xs" style={{ color: 'var(--color-success)' }}>Correct: {m.correctAnswer}</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>{m.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setHistoryDetail(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

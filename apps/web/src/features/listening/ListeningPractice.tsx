import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type {
  ListeningExercise,
  ListeningPracticeSession,
  ListeningQuestion,
} from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import AudioPlayer from './components/AudioPlayer'
import LQuestion from './components/ListeningQuestion'

import { generateId } from '../../utils'
import { startEngineSession } from '../../services/learning/ai-exercise-session'
import type { SessionInfo } from '../../services/learning/ai-exercise-session'
import { getLearningEngine } from '../../services/engineBootstrap'
import { loadListeningExercises } from './listeningExerciseService'
import PageHeader from '../../components/layout/PageHeader'
import { IconListening, IconDelete } from '@ielts/ui'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Science',
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

export function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

export function normalizeAnswer(userAnswer: unknown, correctAnswer: string | number | string[]): boolean {
  if (userAnswer === undefined || userAnswer === null) return false
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
  }
  if (typeof userAnswer === 'number' && typeof correctAnswer === 'number') {
    return userAnswer === correctAnswer
  }
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    return userAnswer.some((v: string) =>
      correctAnswer.some((c: string) => v.toLowerCase().trim() === c.toLowerCase().trim())
    )
  }
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
}

export function checkAnswer(question: ListeningQuestion, answer: unknown): boolean {
  if (question.type === 'gap-fill') {
    const blanks = question.blanks || []
    const userBlanks = (answer as string[]) || []
    if (blanks.length === 0) return false
    return blanks.every((b, i) => {
      const userVal = userBlanks[i]?.toLowerCase().trim() || ''
      return b.toLowerCase().trim() === userVal
    })
  }
  return normalizeAnswer(answer, question.correctAnswer)
}

function getAnswerLabel(question: ListeningQuestion): string {
  if (question.type === 'multiple-choice') {
    const idx = question.correctAnswer as number
    return `${String.fromCharCode(65 + idx)}. ${question.options?.[idx] || ''}`
  }
  if (question.type === 'gap-fill') {
    return (question.blanks || []).join(', ')
  }
  return String(question.correctAnswer)
}

function getUserAnswerLabel(question: ListeningQuestion, answer: unknown): string {
  if (answer === undefined || answer === null) return 'No answer'
  if (question.type === 'multiple-choice') {
    const idx = answer as number
    return `${String.fromCharCode(65 + idx)}. ${question.options?.[idx] || ''}`
  }
  if (question.type === 'gap-fill') {
    return (answer as string[])?.filter(Boolean).join(', ') || 'No answer'
  }
  return String(answer)
}

export default function ListeningPractice() {
  const [view, setView] = useState<'browse' | 'practice' | 'results' | 'history'>('browse')

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  const [currentExercise, setCurrentExercise] = useState<ListeningExercise | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [notes, setNotes] = useState('')
  const [results, setResults] = useState<{
    score: number
    total: number
    accuracy: number
    timeSpentSeconds: number
    questionResults: Array<{ questionId: string; question: string; userAnswer: unknown; correctAnswer: string | number | string[]; isCorrect: boolean; explanation: string }>
  } | null>(null)

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [history, setHistory] = useState<ListeningPracticeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [showTranscript, setShowTranscript] = useState(false)
  const [historyDetail, setHistoryDetail] = useState<ListeningPracticeSession | null>(null)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<ListeningExercise | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const all = await DatabaseService.getAll<ListeningPracticeSession>('listeningPracticeSessions')
      setHistory(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      console.error('apps/web/src/features/listening/ListeningPractice.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listening history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const [allExercises, setAllExercises] = useState<ListeningExercise[]>([])

  useEffect(() => {
    loadListeningExercises().then(setAllExercises).catch(() => {})
  }, [])

  const filteredExercises = useMemo(() => {
    let filtered = allExercises
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.title.toLowerCase().includes(query) ||
          e.transcript.toLowerCase().includes(query) ||
          e.topic.toLowerCase().includes(query)
      )
    }
    if (topicFilter) filtered = filtered.filter(e => e.topic === topicFilter)
    if (difficultyFilter) filtered = filtered.filter(e => e.difficulty === difficultyFilter)
    return filtered
  }, [allExercises, search, topicFilter, difficultyFilter])

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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startExercise(exercise: ListeningExercise) {
    setCurrentExercise(exercise)
    setAnswers({})
    setNotes('')
    setResults(null)
    setTimerSeconds(0)
    setTimerRunning(true)
    setView('practice')
  }

  function handleAnswer(questionId: string, answer: unknown) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  async function handleSubmit() {
    if (!currentExercise) return
    stopTimer()

    const engine = getLearningEngine()
    let questionResults: Array<{ questionId: string; question: string; userAnswer: unknown; correctAnswer: string | number | string[]; isCorrect: boolean; explanation: string }> = []
    let total = currentExercise.questions.length
    let score = 0

    if (engine) {
      const result = await engine.completeExercise({
        skill: 'listening',
        topic: currentExercise.title,
        questions: currentExercise.questions.map(q => ({
          id: q.id,
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: q.options,
          explanation: q.explanation || '',
          type: q.type,
          blanks: q.blanks,
        })),
        answers: answers as Record<string, unknown>,
        sessionId: sessionInfo?.sessionId,
        attemptId: sessionInfo?.attemptId,
        timeSpentMs: timerSeconds * 1000,
      })
      if (result.status === 'success' && result.data) {
        questionResults = result.data.questionResults
        total = result.data.totalQuestions
        score = result.data.correctAnswers
      }
    }

    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

    setResults({ score, total, accuracy, timeSpentSeconds: timerSeconds, questionResults })
    setView('results')

    const mistakes = questionResults.filter(r => !r.isCorrect).map(r => ({
      questionId: r.questionId,
      question: r.question,
      userAnswer: String(r.userAnswer ?? ''),
      correctAnswer: String(r.correctAnswer ?? ''),
      explanation: r.explanation,
    }))

    const session: ListeningPracticeSession = {
      id: generateId(),
      exerciseId: currentExercise.id,
      title: currentExercise.title,
      topic: currentExercise.topic,
      transcript: currentExercise.transcript,
      audioUrl: currentExercise.audioUrl,
      questions: currentExercise.questions,
      answers: answers as Record<string, unknown>,
      score,
      totalQuestions: total,
      accuracy,
      timeSpentSeconds: timerSeconds,
      notes,
      mistakes,
      createdAt: new Date().toISOString(),
    }

    DatabaseService.add('listeningPracticeSessions', session).catch(() => {})
    setHistory(prev => [session, ...prev])
  }

  function handleReset() {
    stopTimer()
    setCurrentExercise(null)
    setAnswers({})
    setNotes('')
    setResults(null)
    setSessionInfo(null)
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
      const { content, error, sessionInfo: si } = await startEngineSession(
        'listening',
        `Listening: ${aiTopic.trim()}`,
        aiDifficulty,
        20,
        aiTopic.trim(),
      )

      if (error) throw new Error(error)
      if (!content) throw new Error('AI returned an empty response. Try again.')

      setSessionInfo(si)

      let parsed: Record<string, unknown>
      try {
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
        parsed = JSON.parse(jsonStr) as Record<string, unknown>
      } catch (error) {
        console.error('apps/web/src/features/listening/ListeningPractice.tsx error:', error);
        throw new Error('Failed to parse AI response. The response was not valid JSON.')
      }

      if (!parsed.title || !parsed.transcript || !Array.isArray(parsed.questions)) {
        throw new Error('AI response missing required fields (title, transcript, or questions)')
      }

      const validTypes = ['multiple-choice', 'gap-fill'] as const

      const trimmedTopic = aiTopic.trim()
      const title = (parsed.title as string || '').toLowerCase().includes(trimmedTopic.toLowerCase())
        ? parsed.title as string
        : `Listening: ${trimmedTopic}`
      const transcriptText = parsed.transcript as string || ''
      const transcriptMatchesTopic = transcriptText.toLowerCase().includes(trimmedTopic.toLowerCase())
      let finalTranscript = transcriptText
      if (!transcriptMatchesTopic) {
        const retry = await startEngineSession('listening', `Listening: ${trimmedTopic}`, aiDifficulty, 20, trimmedTopic)
        if (retry.content) {
          try {
            const rParsed = JSON.parse(
              retry.content.slice(retry.content.indexOf('{'), retry.content.lastIndexOf('}') + 1),
            )
            if (rParsed.transcript && (rParsed.transcript as string).toLowerCase().includes(trimmedTopic.toLowerCase())) {
              finalTranscript = rParsed.transcript as string
            }
          } catch {}
        }
      }
      const exercise: ListeningExercise = {
        id: generateId(),
        title,
        topic: trimmedTopic,
        transcript: finalTranscript,
        audioUrl: '',
        audioType: 'audio',
        questions: parsed.questions.map((q: Record<string, unknown>, i: number) => ({
          id: `ai-lq${i}`,
          type: (validTypes as readonly string[]).includes(q.type as string)
            ? (q.type as 'multiple-choice' | 'gap-fill')
            : 'gap-fill',
          question: q.question as string,
          options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
          correctAnswer: q.correctAnswer ?? '',
          explanation: (q.explanation as string) || '',
          blanks: Array.isArray(q.blanks) ? (q.blanks as string[]) : undefined,
        })),
        difficulty: aiDifficulty,
        wordCount: parsed.transcript.split(/\s+/).length,
        estimatedMinutes: 12,
      }

      setAllExercises(prev => [exercise, ...prev])

      setAiModalOpen(false)
      startExercise(exercise)
    } catch (err) {
      console.error('apps/web/src/features/listening/ListeningPractice.tsx error:', err);
      setAiError(err instanceof Error ? err.message : 'Failed to generate listening exercise')
    } finally {
      setAiGenerating(false)
    }
  }

  async function handleDeleteExercise(exercise: ListeningExercise) {
    setDeletingId(exercise.id)
    try {
      const engine = getLearningEngine()
      if (engine) await engine.deleteExercise(exercise.id)
      setAllExercises(prev => prev.filter(e => e.id !== exercise.id))
    } catch {
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

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
            icon={<IconListening size={22} />}
            title="Listening Practice"
            description="Practice IELTS listening with transcript-based exercises"
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
                    placeholder="Search exercises..."
                    className="w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    aria-label="Search listening exercises"
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

          {filteredExercises.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--color-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No exercises available. Try generating one with AI.
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setAiModalOpen(true)}>
                    Generate with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredExercises.map(exercise => (
                <Card key={exercise.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor:
                              exercise.difficulty === 'easy'
                                ? 'var(--color-success-light)'
                                : exercise.difficulty === 'hard'
                                  ? 'var(--color-danger-light)'
                                  : 'var(--color-primary-light)',
                            color:
                              exercise.difficulty === 'easy'
                                ? 'var(--color-success)'
                                : exercise.difficulty === 'hard'
                                  ? 'var(--color-danger)'
                                  : 'var(--color-primary)',
                          }}
                        >
                          {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {exercise.topic}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {exercise.wordCount} words
                        </span>
                      </div>
                    </div>
                    <h3
                      className="mt-3 text-base font-semibold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {exercise.title}
                    </h3>
                    <p
                      className="mt-2 line-clamp-3 text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {exercise.transcript}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {exercise.questions.length} questions &middot; ~{exercise.estimatedMinutes} min
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<IconDelete size={16} />}
                          onClick={() => setConfirmDelete(exercise)}
                          disabled={deletingId === exercise.id}
                          aria-label={`Delete ${exercise.title}`}
                        />
                        <Button size="sm" onClick={() => startExercise(exercise)}>
                          Start Practice
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

      {view === 'practice' && currentExercise && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {currentExercise.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {currentExercise.topic}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {currentExercise.wordCount} words
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                style={{
                  borderColor: 'var(--color-border)',
                  color: timerSeconds > currentExercise.estimatedMinutes * 60 ? 'var(--color-danger)' : 'var(--color-text)',
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

          <AudioPlayer audioUrl={currentExercise.audioUrl} audioType={currentExercise.audioType} transcript={currentExercise.transcript} />

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="whitespace-nowrap"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showTranscript ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                )}
              </svg>
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </Button>
          </div>

          {showTranscript && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {currentExercise.transcript}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Questions ({currentExercise.questions.length})
            </h2>
            <div className="space-y-4">
              {currentExercise.questions.map((q, i) => (
                <LQuestion
                  key={q.id}
                  question={q}
                  index={i}
                  answer={answers[q.id]}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listening Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your notes about this listening exercise..."
                className="w-full rounded-lg border p-3 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
                rows={4}
                aria-label="Listening notes"
              />
            </CardContent>
          </Card>

          <div className="flex justify-center pb-8">
            <Button size="lg" onClick={handleSubmit}>
              Submit Answers
            </Button>
          </div>
        </div>
      )}

      {view === 'results' && results && currentExercise && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Results: {currentExercise.title}
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
            {results.questionResults.map((r, i) => {
              const origQ = currentExercise?.questions.find(q => q.id === r.questionId)
              return (
                <LQuestion
                  key={r.questionId}
                  question={origQ || ({ id: r.questionId, question: r.question } as ListeningQuestion)}
                  index={i}
                  answer={r.userAnswer}
                  onAnswer={() => {}}
                  showResult
                  isCorrect={r.isCorrect}
                />
              )
            })}
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
                    .map(r => {
                      const origQ = currentExercise?.questions.find(q => q.id === r.questionId)
                      return (
                        <div
                          key={r.questionId}
                          className="rounded-lg border p-3 text-sm"
                          style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-surface-alt)',
                          }}
                        >
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {r.question}
                          </p>
                          <p className="mt-1" style={{ color: 'var(--color-danger)' }}>
                            Your answer: {origQ ? getUserAnswerLabel(origQ, r.userAnswer) : String(r.userAnswer ?? '')}
                          </p>
                          <p style={{ color: 'var(--color-success)' }}>
                            Correct answer: {origQ ? getAnswerLabel(origQ) : String(r.correctAnswer ?? '')}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                            {r.explanation}
                          </p>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {notes && (
            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="whitespace-pre-wrap rounded-lg border p-3 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-alt)',
                    color: 'var(--color-text)',
                  }}
                >
                  {notes}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center gap-3 pb-8">
            <Button variant="secondary" onClick={handleReset}>
              Back to Exercises
            </Button>
            <Button onClick={() => startExercise(currentExercise)}>
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
                Listening History
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Track your listening practice progress over time
              </p>
            </div>
            <Button variant="secondary" onClick={() => setView('browse')}>
              Back to Exercises
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
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--color-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No listening practice history yet.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Complete a listening practice to see your history here.
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setView('browse')}>
                    Start Listening Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
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

      <Modal open={aiModalOpen} onClose={() => { setAiModalOpen(false); setAiError(null) }} title="Generate AI Listening Exercise" size="md">
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
              placeholder="e.g., Climate Change, Travel Booking, University Life"
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
            This will use your AI API key configured in Settings. A listening transcript with gap-fill and multiple-choice questions will be generated. No audio will be attached.
          </p>
          {aiError && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{aiError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setAiModalOpen(false); setAiError(null) }}>
              Cancel
            </Button>
            <Button onClick={handleAiGenerate} loading={aiGenerating} disabled={!aiTopic.trim()}>
              Generate Exercise
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

            {historyDetail.notes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Notes
                </span>
                <p
                  className="mt-1 whitespace-pre-wrap rounded-lg border p-3 text-xs leading-relaxed"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {historyDetail.notes}
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

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete exercise?"
        message={`Are you sure you want to delete "${confirmDelete?.title || ''}"? This will also remove all associated practice sessions.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDelete && handleDeleteExercise(confirmDelete)}
        loading={deletingId !== null}
      />
    </div>
  )
}

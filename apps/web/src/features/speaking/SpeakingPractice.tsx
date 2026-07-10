import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { SpeakingSession, SpeakingPart } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SelfEvaluation, { type EvaluationResult } from './components/SelfEvaluation'
import { SAMPLE_QUESTIONS, type SpeakingQuestion } from './data/questions'
import { COMMON_PHRASES } from './data/phrases'
import { generateId } from '../../utils'
import { getSpeakingFeedback } from '../../services/ai/AIService'
import PageHeader from '../../components/layout/PageHeader'
import { IconSpeaking } from '@ielts/ui'
import TimerCard from '../../components/TimerCard'
import { useTimer } from '../../hooks/useTimer'
import { DEFAULT_TIMER_CONFIG } from '../../models/timer'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const SPEAKING_PARTS: { value: SpeakingPart; label: string }[] = [
  { value: 1, label: 'Part 1 (Intro & Interview)' },
  { value: 2, label: 'Part 2 (Cue Card)' },
  { value: 3, label: 'Part 3 (Discussion)' },
]

const TIMER_CONFIG = DEFAULT_TIMER_CONFIG

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${minutes}m ${s}s` : `${minutes}m`
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'var(--color-success)'
  if (score >= 5) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getScoreLabel(score: number): string {
  if (score >= 9) return 'Excellent'
  if (score >= 7) return 'Good'
  if (score >= 5) return 'Average'
  if (score >= 3) return 'Needs Work'
  return 'Poor'
}

const emptyEvaluation: EvaluationResult = {
  fluency: 5,
  vocabulary: 5,
  grammar: 5,
  pronunciation: 5,
  coherence: 5,
  taskAchievement: 5,
}

type ViewState = 'browse' | 'practice' | 'results' | 'history'

export default function SpeakingPractice() {
  const [view, setView] = useState<ViewState>('browse')

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [partFilter, setPartFilter] = useState<SpeakingPart | 0>(0)

  const [selectedQuestion, setSelectedQuestion] = useState<SpeakingQuestion | null>(null)
  const [answerNotes, setAnswerNotes] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult>(emptyEvaluation)
  const [fluencyNotes, setFluencyNotes] = useState('')
  const [vocabularyNotes, setVocabularyNotes] = useState('')
  const [grammarNotes, setGrammarNotes] = useState('')
  const [pronunciationNotes, setPronunciationNotes] = useState('')
  const [betterExpressions, setBetterExpressions] = useState('')
  const [improvedAnswer, setImprovedAnswer] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  const [history, setHistory] = useState<SpeakingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)

  const timer = useTimer({ config: TIMER_CONFIG })

  const [recording, setRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')

  const [phrasesOpen, setPhrasesOpen] = useState(false)
  const [phrasesFilter, setPhrasesFilter] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [historyDetail, setHistoryDetail] = useState<SpeakingSession | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const all = await DatabaseService.getAll<SpeakingSession>('speakingSessions')
      setHistory(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load speaking history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setRecordingSupported(true)
    } else {
      setRecordingSupported(false)
    }
  }, [])

  const filteredQuestions = useMemo(() => {
    let filtered = SAMPLE_QUESTIONS
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.question.toLowerCase().includes(query) ||
          p.topic.toLowerCase().includes(query)
      )
    }
    if (topicFilter) filtered = filtered.filter(p => p.topic === topicFilter)
    if (partFilter) filtered = filtered.filter(p => p.part === partFilter)
    return filtered
  }, [search, topicFilter, partFilter])

  const filteredPhrases = useMemo(() => {
    if (!phrasesFilter.trim()) return COMMON_PHRASES
    const query = phrasesFilter.toLowerCase()
    return COMMON_PHRASES.map(cat => ({
      ...cat,
      phrases: cat.phrases.filter(p => p.toLowerCase().includes(query)),
    })).filter(cat => cat.phrases.length > 0)
  }, [phrasesFilter])

  async function startRecording() {
    if (!recordingSupported) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      setRecordingTime(0)
      transcriptRef.current = ''

      const SpeechRecognitionConstructor = (window as unknown as Record<string, unknown>).SpeechRecognition
        || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
      if (SpeechRecognitionConstructor) {
        const recognition = new (SpeechRecognitionConstructor as new () => SpeechRecognition)()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' '
            }
          }
          if (final) {
            transcriptRef.current += final
            setAnswerNotes(prev => (prev + final).trim())
          }
        }
        recognition.onerror = () => {}
        recognition.start()
        recognitionRef.current = recognition
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch {
      setRecordingSupported(false)
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    setRecording(false)
  }

  function startPractice(question: SpeakingQuestion) {
    setSelectedQuestion(question)
    setAnswerNotes('')
    setSessionId(null)
    setAiError(null)
    setAiFeedback(null)
    setEvaluation(emptyEvaluation)
    setFluencyNotes('')
    setVocabularyNotes('')
    setGrammarNotes('')
    setPronunciationNotes('')
    setBetterExpressions('')
    setImprovedAnswer('')
    setCustomTopic(question.topic)
    setView('practice')

    if (question.part === 2) {
      timer.configure('countdown', TIMER_CONFIG.part2PrepSeconds)
    } else {
      timer.configure('stopwatch')
    }
  }

  function startCustomPractice() {
    setSelectedQuestion(null)
    setAnswerNotes('')
    setSessionId(null)
    setAiError(null)
    setAiFeedback(null)
    setEvaluation(emptyEvaluation)
    setFluencyNotes('')
    setVocabularyNotes('')
    setGrammarNotes('')
    setPronunciationNotes('')
    setBetterExpressions('')
    setImprovedAnswer('')
    setCustomTopic('')
    setView('practice')
    timer.configure('stopwatch')
  }

  function saveSession() {
    if (!answerNotes.trim() && !selectedQuestion) return
    const now = new Date().toISOString()
    const part = selectedQuestion?.part ?? 1
    const duration = timer.mode === 'countdown'
      ? timer.total - timer.seconds
      : timer.seconds

    const session: SpeakingSession = {
      id: sessionId || generateId(),
      part,
      question: selectedQuestion?.question || answerNotes.slice(0, 100) || 'Custom practice',
      answerNotes: answerNotes.trim(),
      topic: customTopic || selectedQuestion?.topic || '',
      durationSeconds: duration,
      selfRating: Math.round(Object.values(evaluation).reduce((s, v) => s + v, 0) / Object.keys(evaluation).length) || 5,
      fluencyNotes,
      vocabularyNotes,
      grammarMistakes: grammarNotes,
      pronunciationNotes,
      betterExpressions,
      improvedAnswer,
      createdAt: now,
    }

    if (sessionId) {
      DatabaseService.put('speakingSessions', session).then(() => {
        loadHistory()
      }).catch(() => {})
    } else {
      DatabaseService.add('speakingSessions', session).then(() => {
        setSessionId(session.id)
        loadHistory()
      }).catch(() => {})
    }
  }

  async function handleGetAiFeedback(text?: string) {
    const textForFeedback = text || improvedAnswer.trim() || answerNotes.trim() || transcriptRef.current.trim()
    if (!textForFeedback) {
      setAiError('Record your answer first or type it in the "Your Answer" field.')
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiFeedback(null)

    let aiContent = ''
    try {
      const questionText = selectedQuestion?.question || 'Custom practice'
      const part = (selectedQuestion?.part || 1) as 1 | 2 | 3

      const { content, error } = await getSpeakingFeedback(textForFeedback, questionText, part)

      if (error) throw new Error(error)
      if (!content) throw new Error('AI returned an empty response. Try again.')

      aiContent = content

      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>

      const textFields = ['fluencyNotes', 'vocabularyNotes', 'grammarNotes', 'pronunciationNotes', 'betterExpressions', 'improvedAnswer'] as const
      for (const field of textFields) {
        const val = parsed[field]
        if (typeof val === 'string') {
          const setters: Record<string, (v: string) => void> = {
            fluencyNotes: setFluencyNotes,
            vocabularyNotes: setVocabularyNotes,
            grammarNotes: setGrammarNotes,
            pronunciationNotes: setPronunciationNotes,
            betterExpressions: setBetterExpressions,
            improvedAnswer: setImprovedAnswer,
          }
          setters[field](val)
        }
      }

      if (parsed.scores && typeof parsed.scores === 'object') {
        const scores = parsed.scores as Record<string, unknown>
        setEvaluation(prev => {
          const next = { ...prev }
          for (const key of Object.keys(next) as (keyof EvaluationResult)[]) {
            const score = scores[key]
            if (typeof score === 'number' && score >= 1 && score <= 10) {
              next[key] = Math.round(score)
            }
          }
          return next
        })
      }

      const bandScore = parsed.bandScore
      const bandMsg = typeof bandScore === 'number' ? `\n\nEstimated Band: ${bandScore.toFixed(1)}` : ''
      setAiFeedback(content + bandMsg)
      saveSession()
    } catch (err) {
      if (err instanceof SyntaxError && aiContent) {
        setAiFeedback(aiContent)
        saveSession()
      } else {
        setAiError(err instanceof Error ? err.message : 'Failed to get AI feedback')
      }
    } finally {
      setAiLoading(false)
    }
  }

  function handleFinish() {
    timer.stop()
    if (recording) stopRecording()
    saveSession()
    setView('results')
  }

  function handleSaveAndFinish() {
    saveSession()
    setView('browse')
  }

  function handleReset() {
    timer.stop()
    if (recording) stopRecording()
    setSelectedQuestion(null)
    setAnswerNotes('')
    setEvaluation(emptyEvaluation)
    setSessionId(null)
    setAiError(null)
    setAiFeedback(null)
    setView('browse')
  }

  function handleViewHistory() {
    loadHistory()
    setView('history')
  }

  function handleDeleteSession(id: string) {
    DatabaseService.remove('speakingSessions', id)
    setHistory(prev => prev.filter(s => s.id !== id))
    setDeleteConfirmId(null)
  }

  const historyStats = useMemo(() => {
    if (history.length === 0) return null
    const total = history.length
    const avgRating = Math.round((history.reduce((s, h) => s + h.selfRating, 0) / total) * 10) / 10
    const totalTime = history.reduce((s, h) => s + h.durationSeconds, 0)
    const partsCount = new Set(history.map(h => h.part)).size
    const bestRating = Math.max(...history.map(h => h.selfRating))
    return { total, avgRating, totalTime, partsCount, bestRating }
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
            icon={<IconSpeaking size={22} />}
            title="Speaking Practice"
            description="Practice IELTS Speaking Part 1, 2, and 3 with question bank, timer, and AI feedback"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPhrasesOpen(true)}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Speaking Phrases
                </Button>
                <Button variant="secondary" onClick={startCustomPractice}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Custom Practice
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

          {historyStats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Total Sessions
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {historyStats.total}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Avg Self-Rating
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: getScoreColor(historyStats.avgRating) }}
                  >
                    {historyStats.avgRating}
                    <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>/10</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Speaking Time
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
                    {formatDuration(historyStats.totalTime)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Parts Practiced
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {historyStats.partsCount}/3
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[200px] flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    aria-label="Search questions"
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
                  value={partFilter}
                  onChange={(e) => setPartFilter(Number(e.target.value) as SpeakingPart | 0)}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Filter by part"
                >
                  <option value={0}>All Parts</option>
                  {SPEAKING_PARTS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No questions match your filters.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Try adjusting your search or filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border p-4 transition-colors hover:border-blue-300 cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                  onClick={() => startPractice(question)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startPractice(question) }}
                  aria-label={`Practice: ${question.question}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: question.part === 1
                              ? 'var(--color-primary-light)'
                              : question.part === 2
                                ? 'var(--color-success-light)'
                                : 'var(--color-warning-light)',
                            color: question.part === 1
                              ? 'var(--color-primary)'
                              : question.part === 2
                                ? 'var(--color-success)'
                                : 'var(--color-warning)',
                          }}
                        >
                          Part {question.part}
                        </span>
                        {question.topic && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-surface-alt)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {question.topic}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {question.question}
                      </p>
                      {question.cueCard && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                          Cue card with {question.cueCard.points.length} points to cover
                        </p>
                      )}
                      {question.followUp && question.followUp.length > 0 && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                          {question.followUp.length} follow-up question{question.followUp.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <svg className="h-5 w-5 shrink-0" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'practice' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {selectedQuestion
                  ? `Part ${selectedQuestion.part} Practice`
                  : 'Custom Practice'}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {selectedQuestion?.topic || customTopic || 'Speaking practice'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPhrasesOpen(true)} size="sm">
                Speaking Phrases
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSaveAndFinish}>
                Save & Exit
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Question / Cue Card */}
              {selectedQuestion && (
                <Card>
                  <CardHeader>
                    <CardTitle>Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
                      {selectedQuestion.question}
                    </p>
                    {selectedQuestion.cueCard && (
                      <div className="mt-4 rounded-lg border p-4" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                          Cue Card: {selectedQuestion.cueCard.topic}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {selectedQuestion.cueCard.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                              {point}
                            </li>
                          ))}
                        </ul>
                        {selectedQuestion.cueCard.followUp.length > 0 && (
                          <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                              Follow-up Discussion
                            </p>
                            <ul className="mt-1 space-y-1">
                              {selectedQuestion.cueCard.followUp.map((q, i) => (
                                <li key={i} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                  • {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedQuestion.followUp && selectedQuestion.followUp.length > 0 && !selectedQuestion.cueCard && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                          Follow-up Questions
                        </p>
                        {selectedQuestion.followUp.map((q, i) => (
                          <p key={i} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            • {q}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <TimerCard
                timer={timer}
                isPart2={selectedQuestion?.part === 2}
                config={TIMER_CONFIG}
                recording={recording}
                onStart={startRecording}
                onPause={stopRecording}
                onReset={() => {
                  stopRecording()
                  setAnswerNotes('')
                }}
              />

              {/* Recording Indicator */}
              {recording && (
                <div
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-danger)',
                    backgroundColor: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                  }}
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                  Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                </div>
              )}

              {/* Answer Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Answer</CardTitle>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {answerNotes.trim() ? answerNotes.trim().split(/\s+/).length : 0} words
                  </span>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={answerNotes}
                    onChange={(e) => setAnswerNotes(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-1"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontFamily: 'Georgia, serif',
                    }}
                    placeholder="Write your answer or key points you spoke about..."
                    aria-label="Your answer notes"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Self Evaluation */}
              <SelfEvaluation result={evaluation} onChange={setEvaluation} />

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Speaking Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Fluency Notes
                      </label>
                      <textarea
                        value={fluencyNotes}
                        onChange={(e) => setFluencyNotes(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Pauses, hesitations, speech rate..."
                        aria-label="Fluency notes"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Vocabulary Notes
                      </label>
                      <textarea
                        value={vocabularyNotes}
                        onChange={(e) => setVocabularyNotes(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Range, collocations, word choice..."
                        aria-label="Vocabulary notes"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Grammar Notes
                      </label>
                      <textarea
                        value={grammarNotes}
                        onChange={(e) => setGrammarNotes(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Sentence structures, errors..."
                        aria-label="Grammar notes"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Pronunciation Notes
                      </label>
                      <textarea
                        value={pronunciationNotes}
                        onChange={(e) => setPronunciationNotes(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Intonation, word stress, clarity..."
                        aria-label="Pronunciation notes"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Better Expressions
                      </label>
                      <textarea
                        value={betterExpressions}
                        onChange={(e) => setBetterExpressions(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        placeholder="Alternative phrases you could have used..."
                        aria-label="Better expressions"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        Improved Answer
                      </label>
                      <textarea
                        value={improvedAnswer}
                        onChange={(e) => setImprovedAnswer(e.target.value)}
                        rows={4}
                        className="mt-1 w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          fontFamily: 'Georgia, serif',
                        }}
                        placeholder="Write an improved version of your answer..."
                        aria-label="Improved answer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Feedback */}
              <Card>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        AI Feedback
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Get AI feedback on your answer. Uses your API key from Settings.
                    </p>
                    <Button
                      onClick={handleGetAiFeedback}
                      loading={aiLoading}
                      className="w-full"
                      size="sm"
                    >
                      {aiLoading ? 'Getting Feedback...' : 'Get AI Feedback'}
                    </Button>
                    {aiError && (
                      <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                        {aiError}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button onClick={handleFinish} className="w-full">
                  Finish & Review
                </Button>
                <Button variant="secondary" onClick={handleSaveAndFinish} className="w-full">
                  Save & Back to Browse
                </Button>
                <Button variant="ghost" onClick={handleReset} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'results' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Session Review
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {selectedQuestion?.question || 'Custom practice'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSaveAndFinish}>
                Save & Back
              </Button>
              <Button onClick={handleReset}>
                Practice Again
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {answerNotes || 'No answer recorded.'}
                </p>
              </CardContent>
            </Card>

            <SelfEvaluation result={evaluation} onChange={setEvaluation} />

            {aiFeedback && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {([
                        ['fluency', 'Fluency'],
                        ['vocabulary', 'Vocab'],
                        ['grammar', 'Grammar'],
                        ['pronunciation', 'Pronun.'],
                        ['coherence', 'Coherence'],
                        ['taskAchievement', 'Task'],
                      ] as const).map(([key, label]) => (
                        <div key={key} className="rounded-lg border p-3 text-center" style={{ borderColor: 'var(--color-border)' }}>
                          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{label}</p>
                          <p className="mt-1 text-lg font-bold" style={{ color: getScoreColor(evaluation[key]) }}>
                            {evaluation[key]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                      {[
                        ['fluencyNotes', 'Fluency & Coherence'],
                        ['vocabularyNotes', 'Lexical Resource'],
                        ['grammarNotes', 'Grammatical Range & Accuracy'],
                        ['pronunciationNotes', 'Pronunciation'],
                        ['betterExpressions', 'Better Expressions'],
                      ].map(([field, label]) => {
                        const val = ({
                          fluencyNotes,
                          vocabularyNotes,
                          grammarNotes,
                          pronunciationNotes,
                          betterExpressions,
                        } as Record<string, string>)[field]
                        if (!val) return null
                        return (
                          <div key={field}>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                              {label}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{val}</p>
                          </div>
                        )
                      })}
                      {improvedAnswer && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                            Improved Answer
                          </p>
                          <p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--color-success)' }}>{improvedAnswer}</p>
                        </div>
                      )}
                      {fluencyNotes || vocabularyNotes || grammarNotes || pronunciationNotes || betterExpressions || improvedAnswer ? null : (
                        <p className="whitespace-pre-wrap">{aiFeedback}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {view === 'history' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Speaking History
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {history.length} session{history.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <Button variant="secondary" onClick={() => setView('browse')}>
              Back to Practice
            </Button>
          </div>

          {history.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No speaking sessions yet.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Complete your first speaking practice to see it here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map(session => (
                <div
                  key={session.id}
                  className="rounded-xl border p-4 transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: session.part === 1
                              ? 'var(--color-primary-light)'
                              : session.part === 2
                                ? 'var(--color-success-light)'
                                : 'var(--color-warning-light)',
                            color: session.part === 1
                              ? 'var(--color-primary)'
                              : session.part === 2
                                ? 'var(--color-success)'
                                : 'var(--color-warning)',
                          }}
                        >
                          Part {session.part}
                        </span>
                        {session.topic && (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-surface-alt)',
                              color: 'var(--color-muted)',
                            }}
                          >
                            {session.topic}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setHistoryDetail(session)}
                        className="mt-1 text-left"
                      >
                        <h3 className="text-sm font-medium hover:underline" style={{ color: 'var(--color-text)' }}>
                          {session.question.length > 80
                            ? session.question.slice(0, 80) + '...'
                            : session.question}
                        </h3>
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                        <span>{formatDate(session.createdAt)}</span>
                        <span>{formatDuration(session.durationSeconds)}</span>
                        <span style={{ color: getScoreColor(session.selfRating) }}>
                          {getScoreLabel(session.selfRating)} ({session.selfRating}/10)
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryDetail(session)}
                        aria-label="View details"
                        className="p-1.5"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(session.id)}
                        aria-label="Delete session"
                        className="p-1.5"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal open={!!historyDetail} onClose={() => setHistoryDetail(null)} title={historyDetail?.question ?? ''} size="lg">
        {historyDetail && (
          <div className="space-y-4 text-sm" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Speaking Part
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>
                  Part {historyDetail.part}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Topic
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{historyDetail.topic || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Date
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatDate(historyDetail.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Duration
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatDuration(historyDetail.durationSeconds)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Self-Rating
                </span>
                <p className="mt-0.5 font-semibold" style={{ color: getScoreColor(historyDetail.selfRating) }}>
                  {getScoreLabel(historyDetail.selfRating)} ({historyDetail.selfRating}/10)
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Question
              </span>
              <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                {historyDetail.question}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Answer Notes
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {historyDetail.answerNotes}
              </p>
            </div>
            {historyDetail.improvedAnswer && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Improved Answer
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-success)' }}>
                  {historyDetail.improvedAnswer}
                </p>
              </div>
            )}
            {historyDetail.fluencyNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Fluency Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {historyDetail.fluencyNotes}
                </p>
              </div>
            )}
            {historyDetail.vocabularyNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Vocabulary Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-primary)' }}>
                  {historyDetail.vocabularyNotes}
                </p>
              </div>
            )}
            {historyDetail.grammarMistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Grammar Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-danger)' }}>
                  {historyDetail.grammarMistakes}
                </p>
              </div>
            )}
            {historyDetail.pronunciationNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Pronunciation Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {historyDetail.pronunciationNotes}
                </p>
              </div>
            )}
            {historyDetail.betterExpressions && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Better Expressions
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                  {historyDetail.betterExpressions}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Session">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Are you sure you want to delete this speaking session? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Speaking Phrases Modal */}
      <Modal open={phrasesOpen} onClose={() => setPhrasesOpen(false)} title="Common Speaking Phrases" size="lg">
        <div className="space-y-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <input
            type="text"
            value={phrasesFilter}
            onChange={(e) => setPhrasesFilter(e.target.value)}
            placeholder="Search phrases..."
            className="w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
            aria-label="Search phrases"
          />
          {filteredPhrases.map((category) => (
            <div key={category.category}>
              <h4
                className="mb-2 text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-muted)' }}
              >
                {category.category}
              </h4>
              <div className="space-y-1">
                {category.phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-blue-50"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                    onClick={() => {
                      navigator.clipboard?.writeText(phrase)
                    }}
                    title="Click to copy"
                  >
                    {phrase}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

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

const CUE_CARD_PREP_TIME = 60
const PRACTICE_TIME = 120

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

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('stopwatch')
  const [countdownTotal, setCountdownTotal] = useState(PRACTICE_TIME)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [recording, setRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
      if (timerRef.current) clearInterval(timerRef.current)
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

  function startTimer(mode: 'countdown' | 'stopwatch', countdownSecs?: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerMode(mode)
    if (mode === 'countdown') {
      setTimerSeconds(countdownSecs ?? PRACTICE_TIME)
      setCountdownTotal(countdownSecs ?? PRACTICE_TIME)
    } else {
      setTimerSeconds(0)
    }
    setTimerRunning(true)
    timerRef.current = setInterval(() => {
      if (mode === 'countdown') {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      } else {
        setTimerSeconds(prev => prev + 1)
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimerRunning(false)
  }

  function toggleTimer() {
    if (timerRunning) {
      stopTimer()
    } else {
      startTimer(timerMode, timerMode === 'countdown' ? timerSeconds || PRACTICE_TIME : undefined)
    }
  }

  function resetTimer() {
    stopTimer()
    if (timerMode === 'countdown') {
      setTimerSeconds(countdownTotal)
    } else {
      setTimerSeconds(0)
    }
  }

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
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch {
      setRecordingSupported(false)
    }
  }

  function stopRecording() {
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
      setTimerMode('countdown')
      setCountdownTotal(CUE_CARD_PREP_TIME)
      setTimerSeconds(CUE_CARD_PREP_TIME)
      setTimerRunning(false)
    } else {
      setTimerMode('stopwatch')
      setTimerSeconds(0)
      setTimerRunning(true)
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
    setTimerMode('stopwatch')
    setTimerSeconds(0)
    setTimerRunning(true)
  }

  function saveSession() {
    if (!answerNotes.trim() && !selectedQuestion) return
    const now = new Date().toISOString()
    const part = selectedQuestion?.part ?? 1
    const duration = timerMode === 'countdown'
      ? (timerMode === 'countdown' ? countdownTotal - timerSeconds : timerSeconds)
      : timerSeconds

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

  async function handleGetAiFeedback() {
    const textForFeedback = improvedAnswer.trim() || answerNotes.trim()
    if (!textForFeedback) return

    const settingsRaw = localStorage.getItem('ielts-settings')
    if (!settingsRaw) {
      setAiError('Settings not found')
      return
    }
    const settings = JSON.parse(settingsRaw)
    if (!settings.aiApiKey) {
      setAiError('Set your AI API key in Settings first')
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiFeedback(null)

    try {
      const partLabel = selectedQuestion
        ? `Speaking Part ${selectedQuestion.part}`
        : 'Speaking Practice'

      const questionText = selectedQuestion?.question || 'Custom practice'

      const prompt = `You are an IELTS speaking examiner. Evaluate the following IELTS ${partLabel} response.

Question/Prompt:
${questionText}

Response:
${textForFeedback}

Provide detailed, constructive feedback covering:
1. Fluency & Coherence - Did the response flow naturally? Were ideas logically connected?
2. Lexical Resource (Vocabulary) - Range and appropriateness of vocabulary used
3. Grammatical Range & Accuracy - Sentence structures and grammar errors
4. Pronunciation & Intonation - Based on the written response, note any areas of concern
5. Task Achievement - Did the speaker fully address the question?
6. Estimated IELTS Band Score (1-9)
7. Specific suggestions for improvement
8. A model answer or improved version

Format your response in clear sections with bullet points where appropriate. Be encouraging and specific.`

      const response = await fetch(settings.aiEndpoint || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an experienced IELTS speaking examiner. Provide constructive, detailed feedback.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`AI API error (${response.status}): ${errBody || response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      setAiFeedback(content)
      saveSession()
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI feedback')
    } finally {
      setAiLoading(false)
    }
  }

  function handleFinish() {
    stopTimer()
    if (recording) stopRecording()
    saveSession()
    setView('results')
  }

  function handleSaveAndFinish() {
    saveSession()
    setView('browse')
  }

  function handleReset() {
    stopTimer()
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Speaking Practice
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Practice IELTS Speaking Part 1, 2, and 3 with question bank, timer, and AI feedback
              </p>
            </div>
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
          </div>

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
                                ? 'var(--color-success-light, #f0fdf4)'
                                : 'var(--color-warning-light, #fefce8)',
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
                              backgroundColor: 'var(--color-surface-alt, #f8fafc)',
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
                                <li key={i} className="text-sm" style={{ color: 'var(--color-text-secondary, #475569)' }}>
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
                          <p key={i} className="text-sm" style={{ color: 'var(--color-text-secondary, #475569)' }}>
                            • {q}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timer */}
              <Card>
                <CardHeader>
                  <CardTitle>Timer</CardTitle>
                  <div className="flex gap-2">
                    <select
                      value={timerMode}
                      onChange={(e) => {
                        stopTimer()
                        const mode = e.target.value as 'countdown' | 'stopwatch'
                        setTimerMode(mode)
                        if (mode === 'countdown') {
                          setTimerSeconds(selectedQuestion?.part === 2 ? CUE_CARD_PREP_TIME : PRACTICE_TIME)
                          setCountdownTotal(selectedQuestion?.part === 2 ? CUE_CARD_PREP_TIME : PRACTICE_TIME)
                        } else {
                          setTimerSeconds(0)
                        }
                      }}
                      className="rounded-lg border px-2 py-1 text-xs"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                      }}
                      aria-label="Timer mode"
                    >
                      <option value="stopwatch">Stopwatch</option>
                      <option value="countdown">Countdown</option>
                    </select>
                    {timerMode === 'countdown' && selectedQuestion?.part === 2 && (
                      <select
                        value={countdownTotal}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCountdownTotal(val)
                          if (!timerRunning) setTimerSeconds(val)
                        }}
                        className="rounded-lg border px-2 py-1 text-xs"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        aria-label="Countdown duration"
                      >
                        <option value={60}>Prep: 1 min</option>
                        <option value={120}>Speaking: 2 min</option>
                        <option value={180}>3 min</option>
                        <option value={300}>5 min</option>
                      </select>
                    )}
                    {timerMode === 'countdown' && selectedQuestion?.part !== 2 && (
                      <select
                        value={countdownTotal}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCountdownTotal(val)
                          if (!timerRunning) setTimerSeconds(val)
                        }}
                        className="rounded-lg border px-2 py-1 text-xs"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                        aria-label="Countdown duration"
                      >
                        <option value={60}>1 min</option>
                        <option value={120}>2 min</option>
                        <option value={180}>3 min</option>
                        <option value={300}>5 min</option>
                      </select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
                      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="var(--color-border)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={timerMode === 'countdown' && countdownTotal > 0
                            ? `${2 * Math.PI * 42 * (1 - timerSeconds / countdownTotal)}`
                            : '0'}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span
                        className="absolute text-2xl font-bold tabular-nums"
                        style={{
                          color: timerSeconds <= 10 && timerRunning && timerMode === 'countdown'
                            ? 'var(--color-danger)'
                            : 'var(--color-text)',
                        }}
                      >
                        {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={toggleTimer} variant={timerRunning ? 'secondary' : 'primary'} size="sm">
                        {timerRunning ? 'Pause' : 'Start'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetTimer} disabled={timerRunning}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recording */}
              {recordingSupported && (
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${recording ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: recording ? 'var(--color-danger)' : 'var(--color-muted)' }}
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {recording ? `Recording... ${Math.floor(recordingTime / 60)}:${String(recordingTime % 60).padStart(2, '0')}` : 'Microphone'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!recording ? (
                        <Button size="sm" onClick={startRecording} variant="secondary">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Record
                        </Button>
                      ) : (
                        <Button size="sm" onClick={stopRecording} variant="danger">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                          Stop
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                      disabled={!(improvedAnswer.trim() || answerNotes.trim())}
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
                  <div
                    className="whitespace-pre-wrap text-sm leading-relaxed"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {aiFeedback}
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
                                ? 'var(--color-success-light, #f0fdf4)'
                                : 'var(--color-warning-light, #fefce8)',
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
                              backgroundColor: 'var(--color-surface-alt, #f8fafc)',
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

import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react'
import type { SpeakingSession, SpeakingPart } from '../../models'
import { speakingSessionRepo } from '../../services/repositories'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { generateId } from '../../utils'
import { getLearningEngine } from '../../services/engineBootstrap'
import { generateActivityUseCase } from '../../use-cases/generate-activity'
import PageHeader from '../../components/layout/PageHeader'
import { IconSpeaking } from '@ielts/ui'

import {
  speakingReducer,
  initialState,
} from './types'
import type {
  SpeakingQuestion,
  SpeakingPhrase,
  AICoachFeedback,
  SessionStats,
  SessionStage,
} from './types'

import QuestionCard from './components/QuestionCard'
import PreparationMode from './components/PreparationMode'
import RecordingMode from './components/RecordingMode'
import LiveTranscript from './components/LiveTranscript'
import AICoachPanel from './components/AICoachPanel'
import AIExaminer from './components/AIExaminer'
import ModelAnswerView from './components/ModelAnswer'
import SpeakingPhrasesDrawer from './components/SpeakingPhrases'
import SessionSummary from './components/SessionSummary'
import PracticeAgainOptions from './components/PracticeAgain'

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

const PART_DURATIONS: Record<number, number> = { 1: 60, 2: 120, 3: 120 }
const PART_PREP_SECONDS: Record<number, number> = { 1: 0, 2: 60, 3: 0 }

const STAGE_LABELS: Record<SessionStage, string> = {
  browse: 'Question',
  preparation: 'Preparation',
  speaking: 'Speaking',
  analyzing: 'AI Analysis',
  results: 'Practice Again',
  history: 'History',
}

const STAGE_ORDER: SessionStage[] = ['browse', 'preparation', 'speaking', 'analyzing', 'results']

export default function SpeakingPractice() {
  const [state, dispatch] = useReducer(speakingReducer, initialState)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [partFilter, setPartFilter] = useState<SpeakingPart | 0>(0)
  const [phrasesOpen, setPhrasesOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [historyDetail, setHistoryDetail] = useState<SpeakingSession | null>(null)

  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingQuestion[]>([])
  const [speakingPhrases, setSpeakingPhrases] = useState<SpeakingPhrase[]>([])

  const loadHistory = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true })
      const all = await speakingSessionRepo.findAll()
      dispatch({ type: 'SET_HISTORY', history: all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) })
    } catch (err) {
      console.error('SpeakingPractice error:', err)
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load speaking history' })
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    getLearningEngine()?.getExercises('speaking').then(result => {
      if (result.status !== 'success' || !result.data) return

      const questions: SpeakingQuestion[] = []
      const phrases: SpeakingPhrase[] = []

      for (const e of result.data.exercises) {
        const entry = e as any
        const part = entry.metadata?.part

        if (part && part >= 1 && part <= 3) {
          const topic = entry.metadata?.topic || 'General'
          const question = entry.content
          if (question) {
            const cueCardRaw = entry.metadata?.cueCard
            let cueCard: SpeakingQuestion['cueCard']
            if (typeof cueCardRaw === 'string') { try { cueCard = JSON.parse(cueCardRaw) } catch {} }
            else if (cueCardRaw && typeof cueCardRaw === 'object') cueCard = cueCardRaw as any
            const difficulty = entry.metadata?.difficulty || (part === 1 ? 'B1' : part === 2 ? 'B2' : 'C1')
            questions.push({
              id: entry.id,
              part: part as 1 | 2 | 3,
              question,
              topic,
              difficulty,
              estimatedTime: part === 1 ? '~1 minute' : part === 2 ? '~2 minutes (+1 min prep)' : '~2 minutes',
              followUp: cueCard?.followUp,
              cueCard: cueCard ? { topic: cueCard.topic, points: cueCard.points, followUp: cueCard.followUp } : undefined,
            })
          }
        }

        if ((entry.source || entry.sourceType) === 'built-in') {
          const rawPhrases = entry.metadata?.phrases
          if (rawPhrases) {
            let phraseList: string[] = []
            if (typeof rawPhrases === 'string') { try { phraseList = JSON.parse(rawPhrases) } catch {} }
            else if (Array.isArray(rawPhrases)) phraseList = rawPhrases
            if (phraseList.length > 0) {
              phrases.push({ category: entry.title || 'General', phrases: phraseList })
            }
          }
        }
      }

      setSpeakingQuestions(questions)
      setSpeakingPhrases(phrases)
    }).catch(() => {})
  }, [])

  const filteredQuestions = useMemo(() => {
    let filtered = speakingQuestions
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        p => p.question.toLowerCase().includes(query) || p.topic.toLowerCase().includes(query)
      )
    }
    if (topicFilter) filtered = filtered.filter(p => p.topic === topicFilter)
    if (partFilter) filtered = filtered.filter(p => p.part === partFilter)
    return filtered
  }, [speakingQuestions, search, topicFilter, partFilter])

  const historyStats = useMemo(() => {
    if (state.history.length === 0) return null
    const total = state.history.length
    const avgRating = Math.round((state.history.reduce((s, h) => s + h.selfRating, 0) / total) * 10) / 10
    const totalTime = state.history.reduce((s, h) => s + h.durationSeconds, 0)
    const partsCount = new Set(state.history.map(h => h.part)).size
    return { total, avgRating, totalTime, partsCount }
  }, [state.history])

  function startPractice(question: SpeakingQuestion) {
    dispatch({ type: 'START_SESSION', question, sessionId: null })
  }

  function startCustomPractice() {
    if (speakingQuestions.length > 0) {
      const part2Questions = speakingQuestions.filter(q => q.part === 2)
      const questions = part2Questions.length > 0 ? part2Questions : speakingQuestions
      startPractice(questions[Math.floor(Math.random() * questions.length)])
    }
  }

  function handlePreparationComplete() {
    dispatch({ type: 'SET_STAGE', stage: 'speaking' })
    setRecordingTime(0)
  }

  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null)
  const audioBlobUrlRef = useRef(audioBlobUrl)
  audioBlobUrlRef.current = audioBlobUrl

  useEffect(() => {
    return () => {
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current)
    }
  }, [])

  function handleAudioBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    setAudioBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }

  function handleRecordingFinish() {
    dispatch({ type: 'SET_STAGE', stage: 'analyzing' })

    const duration = recordingTime
    const transcript = state.answerTranscript
    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0
    const fillerCount = (transcript.match(/\b(um|uh|er|ah|like|you know|i mean)\b/gi) || []).length
    const fillerDensity = wordCount > 0 ? fillerCount / wordCount : 0

    const estimatedOverall = wordCount === 0 ? 1
      : wordCount < 15 ? 3
      : wordCount < 30 ? 4
      : wordCount < 50 ? 4.5
      : wordCount < 70 ? 5
      : wordCount < 90 ? 5.5
      : wordCount < 110 ? 6
      : wordCount < 140 ? 6.5
      : 7

    const wpmPenalty = wpm > 0 && wpm < 50 ? 0.5 : wpm > 0 && wpm < 70 ? 0.25 : 0
    const fillerPenalty = fillerDensity > 0.12 ? 1 : fillerDensity > 0.06 ? 0.5 : 0

    const finalBand = Math.max(1, Math.min(9, estimatedOverall - wpmPenalty - fillerPenalty))
    const vocabScore = Math.min(9, finalBand + (wordCount > 60 ? 1 : wordCount > 30 ? 0.5 : -0.5))
    const grammarScore = Math.min(9, finalBand + (fillerDensity < 0.05 ? 0.5 : -0.5))
    const fluScore = Math.max(1, Math.min(9, finalBand + (fillerDensity < 0.06 ? 0.5 : -1)))

    const mockStats: SessionStats = {
      bandScore: {
        overall: finalBand,
        fluency: fluScore,
        vocabulary: vocabScore,
        grammar: grammarScore,
        pronunciation: finalBand,
        coherence: finalBand,
        taskAchievement: finalBand,
      },
      durationSeconds: duration,
      wordsSpoken: wordCount,
      wordsPerMinute: wpm,
      vocabularyRichness: wordCount > 80 ? 'Rich' : wordCount > 40 ? 'Good' : 'Limited',
      grammarAccuracy: fillerDensity < 0.05 ? 'Good' : fillerDensity < 0.1 ? 'Moderate' : 'Needs Work',
      fillersUsed: fillerCount,
      longestPause: 3200,
      improvementTips: [
        ...(fillerDensity > 0.05 ? ['Try to reduce filler words by pausing silently instead'] : []),
        ...(wordCount < 50 ? ['Expand your answers with more details and examples'] : []),
        ...(wpm < 70 && wpm > 0 ? ['Practice speaking at a more natural pace'] : []),
        'Record yourself regularly to track pronunciation progress',
        'Practice using complex sentence structures',
      ].slice(0, 4),
    }
    dispatch({ type: 'SET_SESSION_STATS', stats: mockStats })

    handleGetAiFeedback(transcript, duration)
  }

  function handleRecordingCancel() {
    dispatch({ type: 'RESET_SESSION' })
  }

  function handleSaveSession(
    transcript: string,
    duration: number,
    feedback?: { fluencyNotes?: string; pronunciationNotes?: string; betterExpressions?: string; improvedAnswer?: string },
  ) {
    if (!state.selectedQuestion) return
    const now = new Date().toISOString()
    const session: SpeakingSession = {
      id: state.sessionId || generateId(),
      part: state.selectedQuestion.part,
      question: state.selectedQuestion.question,
      answerNotes: transcript.trim(),
      topic: state.selectedQuestion.topic,
      durationSeconds: duration,
      selfRating: Math.round(state.sessionStats?.bandScore?.overall ?? 5),
      fluencyNotes: feedback?.fluencyNotes || '',
      vocabularyNotes: '',
      grammarMistakes: '',
      pronunciationNotes: feedback?.pronunciationNotes || '',
      betterExpressions: feedback?.betterExpressions || '',
      improvedAnswer: feedback?.improvedAnswer || '',
      createdAt: now,
    }
    if (state.sessionId) {
      speakingSessionRepo.bulkUpsert([session]).then(() => loadHistory()).catch(() => {})
    } else {
      speakingSessionRepo.create(session).then(() => {
        dispatch({ type: 'SET_SESSION_ID', sessionId: session.id })
        loadHistory()
      }).catch(() => {})
    }
  }

  async function handleGetAiFeedback(transcript: string, duration: number) {
    const textForFeedback = transcript.trim()
    if (!textForFeedback) {
      dispatch({ type: 'SET_AI_ERROR', error: 'Record your answer first to get AI feedback.' })
      handleSaveSession(transcript, duration)
      dispatch({ type: 'SET_STAGE', stage: 'results' })
      return
    }

    dispatch({ type: 'SET_AI_LOADING', loading: true })

    const FEEDBACK_TIMEOUT_MS = 30_000
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI feedback timed out')), FEEDBACK_TIMEOUT_MS)
    })

    try {
      const topic = state.selectedQuestion?.topic || 'General'
      const result = await Promise.race([
        generateActivityUseCase({
          skill: 'speaking',
          description: `Evaluate this IELTS speaking response about "${topic}" and provide:
1. An estimated band score (0-9)
2. Overall feedback
3. Strengths (list)
4. Areas to improve (list)
5. Fluency, pronunciation, and task achievement feedback
6. An IMPROVED VERSION of the same answer written at Band 8+ level — rephrase the user's ideas with better vocabulary, grammar, and structure. Keep the same meaning but elevate the language.

User's response: "${textForFeedback.slice(0, 500)}"

Respond as JSON with these keys: bandScore, overallFeedback, strengths, areasToImprove, fluencyFeedback, pronunciationFeedback, taskAchievementFeedback, improvedAnswer`,
          difficulty: state.selectedQuestion?.difficulty || 'medium',
          availableMinutes: 10,
          topic,
        }),
        timeoutPromise,
      ])
      if (timeoutId) clearTimeout(timeoutId)

      const rawContent = result.content || ''
      const jsonStart = rawContent.indexOf('{')
      const jsonEnd = rawContent.lastIndexOf('}')
      const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? rawContent.slice(jsonStart, jsonEnd + 1) : rawContent
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>

      const bandScore = typeof parsed.bandScore === 'number' ? parsed.bandScore : (state.sessionStats?.bandScore?.overall ?? 0)

      const feedback: AICoachFeedback = {
        estimatedBand: bandScore,
        overallFeedback: typeof parsed.overallFeedback === 'string' ? parsed.overallFeedback : '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths as string[] : [],
        areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove as string[] : [],
        grammarCorrections: Array.isArray(parsed.grammarCorrections) ? parsed.grammarCorrections : [],
        vocabularySuggestions: Array.isArray(parsed.vocabularySuggestions) ? parsed.vocabularySuggestions : [],
        fluencyFeedback: typeof parsed.fluencyFeedback === 'string' ? parsed.fluencyFeedback : '',
        pronunciationFeedback: typeof parsed.pronunciationFeedback === 'string' ? parsed.pronunciationFeedback : '',
        taskAchievementFeedback: typeof parsed.taskAchievementFeedback === 'string' ? parsed.taskAchievementFeedback : '',
        modelAnswers: [],
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions as string[] : [],
        improvedAnswer: typeof parsed.improvedAnswer === 'string' ? parsed.improvedAnswer : undefined,
      }

      dispatch({ type: 'SET_AI_FEEDBACK', feedback })
      handleSaveSession(transcript, duration, {
        fluencyNotes: feedback.fluencyFeedback,
        pronunciationNotes: feedback.pronunciationFeedback,
        betterExpressions: feedback.vocabularySuggestions.map(v => `${v.word} → ${v.alternatives.join(', ')}`).join('; '),
        improvedAnswer: feedback.improvedAnswer || '',
      })
      dispatch({ type: 'SET_STAGE', stage: 'results' })
    } catch (err) {
      console.error('AI feedback error:', err)
      if (timeoutId) clearTimeout(timeoutId)
      dispatch({ type: 'SET_AI_ERROR', error: err instanceof Error ? err.message : 'AI feedback generation failed. Please try again.' })
      handleSaveSession(transcript, duration)
      dispatch({ type: 'SET_STAGE', stage: 'results' })
    }
  }

  function handleReset() {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl)
      setAudioBlobUrl(null)
    }
    setRecordingTime(0)
    dispatch({ type: 'RESET_SESSION' })
  }

  function handleViewHistory() {
    loadHistory()
    dispatch({ type: 'SET_STAGE', stage: 'history' })
  }

  async function handleDeleteSession(id: string) {
    try {
      await speakingSessionRepo.delete(id)
    } catch {
      setDeleteConfirmId(null)
      loadHistory()
      return
    }
    dispatch({ type: 'SET_HISTORY', history: state.history.filter(s => s.id !== id) })
    setDeleteConfirmId(null)
  }

  function handleExaminerAnswer(_question: string, _answer: string) {}

  const handlePracticeAgain = {
    onPracticeSame: () => state.selectedQuestion && startPractice(state.selectedQuestion),
    onSimilarQuestion: () => {
      if (!state.selectedQuestion) return
      const sameTopic = speakingQuestions.filter(q => q.topic === state.selectedQuestion?.topic && q.id !== state.selectedQuestion?.id)
      if (sameTopic.length > 0) {
        startPractice(sameTopic[Math.floor(Math.random() * sameTopic.length)])
      } else {
        startPractice(state.selectedQuestion)
      }
    },
    onRandomQuestion: () => {
      if (speakingQuestions.length > 0) {
        startPractice(speakingQuestions[Math.floor(Math.random() * speakingQuestions.length)])
      } else {
        startCustomPractice()
      }
    },
    onHarderDifficulty: () => {
      const harder = speakingQuestions.filter(q => q.part === 3)
      if (harder.length > 0) {
        startPractice(harder[Math.floor(Math.random() * harder.length)])
      } else if (state.selectedQuestion) {
        startPractice(state.selectedQuestion)
      }
    },
    onEasierDifficulty: () => {
      const easier = speakingQuestions.filter(q => q.part === 1)
      if (easier.length > 0) {
        startPractice(easier[Math.floor(Math.random() * easier.length)])
      } else if (state.selectedQuestion) {
        startPractice(state.selectedQuestion)
      }
    },
    onBackToBrowse: () => handleReset(),
  }

  if (state.loading && state.stage === 'history') {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (state.error && state.stage === 'history') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p style={{ color: 'var(--color-danger)' }}>{state.error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadHistory}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isInSession = state.stage === 'preparation' || state.stage === 'speaking' || state.stage === 'analyzing' || state.stage === 'results'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {state.stage === 'browse' && (
        <>
          <PageHeader
            icon={<IconSpeaking size={22} />}
            title="Speaking Practice"
            description="Practice IELTS Speaking with AI-powered feedback, real-time transcription, and personalized coaching"
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
                  Quick Practice
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
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Sessions</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{historyStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Avg Rating</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: getScoreColor(historyStats.avgRating) }}>
                    {historyStats.avgRating}<span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>/10</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Speaking Time</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{formatDuration(historyStats.totalTime)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Parts Practiced</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{historyStats.partsCount}/3</p>
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
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    aria-label="Search questions"
                  />
                </div>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  aria-label="Filter by topic"
                >
                  <option value="">All Topics</option>
                  {TOPICS.map(t => (<option key={t} value={t}>{t}</option>))}
                </select>
                <select
                  value={partFilter}
                  onChange={(e) => setPartFilter(Number(e.target.value) as SpeakingPart | 0)}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  aria-label="Filter by part"
                >
                  <option value={0}>All Parts</option>
                  {SPEAKING_PARTS.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
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
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>No questions match your filters.</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>Try adjusting your search or filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="cursor-pointer rounded-xl border p-4 transition-all hover:border-blue-300 hover:shadow-md"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  onClick={() => startPractice(question)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startPractice(question) }}
                  aria-label={`Practice Part ${question.part}: ${question.question}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: question.part === 1 ? 'var(--color-primary-light)' : question.part === 2 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                            color: question.part === 1 ? 'var(--color-primary)' : question.part === 2 ? 'var(--color-success)' : 'var(--color-warning)',
                          }}
                        >
                          Speaking Part {question.part}
                        </span>
                        {question.topic && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}>
                            {question.topic}
                          </span>
                        )}
                        {question.difficulty && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}>
                            {question.difficulty}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {question.estimatedTime}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {question.question}
                      </p>
                      {question.cueCard && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {question.cueCard.points.map((point, i) => (
                            <span key={i} className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                              {point}
                            </span>
                          ))}
                        </div>
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

      {isInSession && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {state.selectedQuestion ? `Speaking Part ${state.selectedQuestion.part}` : 'Speaking Practice'}
                </h1>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {STAGE_ORDER.map((s, i) => {
                  const isActive = s === state.stage
                  const isPast = STAGE_ORDER.indexOf(state.stage) > i
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                            isActive ? 'scale-110' : ''
                          }`}
                          style={{
                            backgroundColor: isPast ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-border)',
                            color: isPast || isActive ? 'white' : 'var(--color-muted)',
                          }}
                        >
                          {isPast ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-xs font-medium hidden sm:inline ${isActive ? 'font-bold' : ''}`}
                          style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                          {STAGE_LABELS[s]}
                        </span>
                      </div>
                      {i < STAGE_ORDER.length - 1 && (
                        <div className="h-px w-6 sm:w-8" style={{ backgroundColor: isPast ? 'var(--color-success)' : 'var(--color-border)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPhrasesOpen(true)} size="sm">
                Speaking Phrases
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Exit
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {state.selectedQuestion && (
                <QuestionCard question={state.selectedQuestion} />
              )}

              {state.stage === 'preparation' && (
                <PreparationMode
                  onComplete={handlePreparationComplete}
                  topic={state.selectedQuestion?.topic || 'General'}
                  notes={state.quickNotes}
                  onNotesChange={(notes) => dispatch({ type: 'SET_QUICK_NOTES', notes })}
                  keywordChips={state.keywordChips}
                  onAddChip={(chip) => dispatch({ type: 'ADD_KEYWORD_CHIP', chip })}
                  onRemoveChip={(index) => dispatch({ type: 'REMOVE_KEYWORD_CHIP', index })}
                />
              )}

              {state.stage === 'speaking' && (
                <RecordingMode
                  onTranscript={(text) => dispatch({ type: 'SET_ANSWER_TRANSCRIPT', transcript: text })}
                  onFinish={handleRecordingFinish}
                  onPause={() => {}}
                  onCancel={handleRecordingCancel}
                  onAudioBlob={handleAudioBlob}
                  recordingTime={recordingTime}
                  setRecordingTime={setRecordingTime}
                  maxDuration={state.selectedQuestion ? PART_DURATIONS[state.selectedQuestion.part] || 120 : 120}
                />
              )}

              {state.stage === 'analyzing' && (
                <Card variant="elevated">
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12">
                      <div
                        className="mb-4 h-12 w-12 animate-spin rounded-full"
                        style={{
                          borderWidth: '4px',
                          borderTopColor: 'transparent',
                          borderRightColor: 'var(--color-primary)',
                          borderBottomColor: 'var(--color-primary)',
                          borderLeftColor: 'var(--color-primary)',
                        }}
                      />
                      <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        Analyzing Your Response
                      </p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                        Our AI is evaluating your fluency, vocabulary, grammar, and more...
                      </p>
                      <div className="mt-4 flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="h-2.5 w-2.5 animate-pulse rounded-full"
                            style={{ backgroundColor: 'var(--color-primary)', animationDelay: `${i * 0.2}s`, opacity: 0.5 }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(state.stage === 'speaking' || state.stage === 'results') && (
                <LiveTranscript
                  transcript={state.answerTranscript}
                  editable={state.stage === 'results'}
                  onEdit={(text) => dispatch({ type: 'SET_ANSWER_TRANSCRIPT', transcript: text })}
                  highlights={{ fillers: true, repetitions: true }}
                  timestamps={state.stage === 'results'}
                />
              )}

              {state.stage === 'results' && state.sessionStats && (
                <SessionSummary
                  stats={state.sessionStats}
                  questionTopic={state.selectedQuestion?.topic || 'Speaking'}
                  questionText={state.selectedQuestion?.question || ''}
                  transcript={state.answerTranscript}
                  improvedAnswer={state.aiCoachFeedback?.improvedAnswer}
                  audioUrl={audioBlobUrl}
                />
              )}

              {state.stage === 'results' && state.aiCoachFeedback && (
                <>
                  {state.aiCoachFeedback.modelAnswers.length > 0 && (
                    <ModelAnswerView answers={state.aiCoachFeedback.modelAnswers} />
                  )}
                  <AIExaminer
                    followUpQuestions={state.aiCoachFeedback.followUpQuestions}
                    topic={state.selectedQuestion?.topic || 'Speaking'}
                    onAnswer={handleExaminerAnswer}
                  />
                  <PracticeAgainOptions {...handlePracticeAgain} />
                </>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <AICoachPanel
                  feedback={state.aiCoachFeedback}
                  loading={state.aiLoading}
                  error={state.aiError}
                  transcript={state.answerTranscript}
                  bandScore={state.sessionStats?.bandScore ?? null}
                />
              </div>
            </div>
          </div>

          {state.stage === 'results' && (
            <div className="lg:hidden space-y-4">
              <AICoachPanel
                feedback={state.aiCoachFeedback}
                loading={state.aiLoading}
                error={state.aiError}
                transcript={state.answerTranscript}
                bandScore={state.sessionStats?.bandScore ?? null}
              />
              {state.aiCoachFeedback?.modelAnswers && state.aiCoachFeedback.modelAnswers.length > 0 && (
                <ModelAnswerView answers={state.aiCoachFeedback.modelAnswers} />
              )}
              <AIExaminer
                followUpQuestions={state.aiCoachFeedback?.followUpQuestions || []}
                topic={state.selectedQuestion?.topic || 'Speaking'}
                onAnswer={handleExaminerAnswer}
              />
              <PracticeAgainOptions {...handlePracticeAgain} />
            </div>
          )}
        </>
      )}

      {state.stage === 'history' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Speaking History</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {state.history.length} session{state.history.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <Button variant="secondary" onClick={() => dispatch({ type: 'SET_STAGE', stage: 'browse' })}>
              Back to Practice
            </Button>
          </div>

          {state.history.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>No speaking sessions yet.</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>Complete your first speaking practice to see it here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {state.history.map(session => (
                <div
                  key={session.id}
                  className="rounded-xl border p-4 transition-colors"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: session.part === 1 ? 'var(--color-primary-light)' : session.part === 2 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                            color: session.part === 1 ? 'var(--color-primary)' : session.part === 2 ? 'var(--color-success)' : 'var(--color-warning)',
                          }}
                        >
                          Part {session.part}
                        </span>
                        {session.topic && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}>
                            {session.topic}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setHistoryDetail(session)} className="mt-1 text-left">
                        <h3 className="text-sm font-medium hover:underline" style={{ color: 'var(--color-text)' }}>
                          {session.question.length > 80 ? session.question.slice(0, 80) + '...' : session.question}
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
                      <Button variant="ghost" size="sm" onClick={() => setHistoryDetail(session)} aria-label="View details" className="p-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(session.id)} aria-label="Delete session" className="p-1.5" style={{ color: 'var(--color-danger)' }}>
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

      {/* Speaking Phrases Drawer */}
      <SpeakingPhrasesDrawer
        isOpen={phrasesOpen}
        onClose={() => setPhrasesOpen(false)}
        phrases={speakingPhrases}
        savedPhrases={state.savedPhrases}
        onToggleSave={(phrase) => dispatch({ type: 'TOGGLE_SAVED_PHRASE', phrase })}
      />

      {/* History Detail Modal */}
      <Modal open={!!historyDetail} onClose={() => setHistoryDetail(null)} title={historyDetail?.question ?? ''} size="lg">
        {historyDetail && (
          <div className="space-y-4 text-sm" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Speaking Part</span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>Part {historyDetail.part}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Topic</span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{historyDetail.topic || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Date</span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatDate(historyDetail.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Duration</span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatDuration(historyDetail.durationSeconds)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Rating</span>
                <p className="mt-0.5 font-semibold" style={{ color: getScoreColor(historyDetail.selfRating) }}>
                  {getScoreLabel(historyDetail.selfRating)} ({historyDetail.selfRating}/10)
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Question</span>
              <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>{historyDetail.question}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Answer</span>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {historyDetail.answerNotes}
              </p>
            </div>
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
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

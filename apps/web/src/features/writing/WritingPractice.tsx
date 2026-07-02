import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { WritingSession, WritingTaskType } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import FeedbackPanel, { type WritingFeedback } from './components/FeedbackPanel'
import { SAMPLE_PROMPTS, type WritingPrompt } from './data/prompts'
import { generateId } from '../../utils'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const TASK_TYPES: { value: WritingTaskType | ''; label: string }[] = [
  { value: '', label: 'All Tasks' },
  { value: 'task1', label: 'Task 1' },
  { value: 'task2', label: 'Task 2' },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${minutes}m ${s}s` : `${minutes}m`
}

function getBandColor(band: number): string {
  if (band >= 7) return 'var(--color-success)'
  if (band >= 5) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

const emptyFeedback: WritingFeedback = {
  taskResponse: '',
  coherence: '',
  vocabulary: '',
  grammar: '',
  bandScore: 5,
  overallFeedback: '',
  improvedVersion: '',
  mistakes: [],
}

export default function WritingPractice() {
  const [view, setView] = useState<'browse' | 'practice' | 'results' | 'history'>('browse')

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState<WritingTaskType | ''>('')

  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null)
  const [essayText, setEssayText] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  const [feedback, setFeedback] = useState<WritingFeedback>(emptyFeedback)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [history, setHistory] = useState<WritingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [historyDetail, setHistoryDetail] = useState<WritingSession | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const all = await DatabaseService.getAll<WritingSession>('writingSessions')
      setHistory(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load writing history')
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

  const wordCount = useMemo(() => {
    return essayText.trim() ? essayText.trim().split(/\s+/).length : 0
  }, [essayText])

  const filteredPrompts = useMemo(() => {
    let filtered = SAMPLE_PROMPTS
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.question.toLowerCase().includes(query) ||
          p.topic.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    }
    if (topicFilter) filtered = filtered.filter(p => p.topic === topicFilter)
    if (taskTypeFilter) filtered = filtered.filter(p => p.taskType === taskTypeFilter)
    return filtered
  }, [search, topicFilter, taskTypeFilter])

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

  function startPractice(prompt: WritingPrompt) {
    setSelectedPrompt(prompt)
    setQuestionText(prompt.question)
    setEssayText('')
    setCustomTopic(prompt.topic)
    setFeedback(emptyFeedback)
    setSessionId(null)
    setAiError(null)
    setTimerSeconds(0)
    setTimerRunning(true)
    setDraftSaved(false)
    setView('practice')
  }

  function startCustomPractice() {
    setSelectedPrompt(null)
    setQuestionText('')
    setEssayText('')
    setCustomTopic('')
    setFeedback(emptyFeedback)
    setSessionId(null)
    setAiError(null)
    setTimerSeconds(0)
    setTimerRunning(true)
    setDraftSaved(false)
    setView('practice')
  }

  function saveDraft() {
    if (!essayText.trim() || !questionText.trim()) return
    const session: WritingSession = {
      id: sessionId || generateId(),
      taskType: selectedPrompt?.taskType || 'task2',
      question: questionText.trim(),
      essay: essayText.trim(),
      topic: customTopic || selectedPrompt?.topic || '',
      wordCount,
      timeSpentMinutes: Math.round(timerSeconds / 60),
      estimatedBand: feedback.bandScore || 5,
      feedback: feedback.overallFeedback || '',
      grammarMistakes: feedback.mistakes.filter(m => m.category === 'grammar').map(m => m.text).join(', '),
      vocabularyMistakes: feedback.mistakes.filter(m => m.category === 'vocabulary').map(m => m.text).join(', '),
      coherenceNotes: feedback.coherence || '',
      improvedSentences: feedback.mistakes.map(m => m.correction).join('\n'),
      betterVersion: feedback.improvedVersion || '',
      personalReflection: '',
      createdAt: new Date().toISOString(),
    }
    DatabaseService.put('writingSessions', session).then(() => {
      setSessionId(session.id)
      setDraftSaved(true)
      loadHistory()
    }).catch(() => {})
  }

  async function handleGetAiFeedback() {
    if (!essayText.trim() || !questionText.trim()) return

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

    try {
      const taskType = selectedPrompt?.taskType || 'task2'
      const taskInstruction = taskType === 'task1'
        ? 'Task 1: The essay describes, summarizes, or explains a visual (chart, graph, table, map). Focus on whether the response accurately reports main features, makes comparisons, and stays objective.'
        : 'Task 2: The essay responds to an opinion, discussion, or problem-solution prompt. Focus on whether it presents a clear position, develops arguments, and addresses all parts of the prompt.'

      const prompt = `You are an IELTS writing examiner. Evaluate the following IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay.

${taskInstruction}

Question:
${questionText}

Essay:
${essayText}

Respond with valid JSON in this exact format:
{
  "taskResponse": "Feedback on task achievement / task response (2-3 sentences)",
  "coherence": "Feedback on coherence and cohesion (2-3 sentences)",
  "vocabulary": "Feedback on vocabulary range and accuracy (2-3 sentences)",
  "grammar": "Feedback on grammatical range and accuracy (2-3 sentences)",
  "bandScore": 6.5,
  "overallFeedback": "Overall assessment and advice (2-4 sentences)",
  "improvedVersion": "A rewritten improved version of the entire essay",
  "mistakes": [
    {
      "category": "grammar" | "vocabulary" | "coherence" | "task-response",
      "text": "Original problematic text",
      "correction": "Corrected version",
      "explanation": "Why this is an improvement"
    }
  ]
}

Be specific and constructive. Provide a realistic band score between 1.0 and 9.0. Do not include any text outside the JSON object.`

      const response = await fetch(settings.aiEndpoint || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an IELTS writing examiner. Always respond with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        throw new Error(`AI API error (${response.status}): ${errBody || response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      let parsed
      try {
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
        parsed = JSON.parse(jsonStr)
      } catch {
        throw new Error('Failed to parse AI response. The response was not valid JSON.')
      }

      const newFeedback: WritingFeedback = {
        taskResponse: parsed.taskResponse || '',
        coherence: parsed.coherence || '',
        vocabulary: parsed.vocabulary || '',
        grammar: parsed.grammar || '',
        bandScore: typeof parsed.bandScore === 'number' ? Math.max(1, Math.min(9, parsed.bandScore)) : 5,
        overallFeedback: parsed.overallFeedback || '',
        improvedVersion: parsed.improvedVersion || '',
        mistakes: Array.isArray(parsed.mistakes)
          ? parsed.mistakes.map((m: Record<string, string>) => ({
              category: (['grammar', 'vocabulary', 'coherence', 'task-response'] as const).includes(m.category as 'grammar')
                ? (m.category as 'grammar' | 'vocabulary' | 'coherence' | 'task-response')
                : 'grammar' as const,
              text: m.text || '',
              correction: m.correction || '',
              explanation: m.explanation || '',
            }))
          : [],
      }

      setFeedback(newFeedback)
      stopTimer()

      saveDraft()
      setView('results')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI feedback')
    } finally {
      setAiLoading(false)
    }
  }

  function handleSaveAndFinish() {
    saveDraft()
    setView('browse')
  }

  function handleReset() {
    stopTimer()
    setSelectedPrompt(null)
    setEssayText('')
    setQuestionText('')
    setFeedback(emptyFeedback)
    setSessionId(null)
    setTimerSeconds(0)
    setAiError(null)
    setDraftSaved(false)
    setView('browse')
  }

  function handleViewHistory() {
    loadHistory()
    setView('history')
  }

  function handleDeleteSession(id: string) {
    DatabaseService.remove('writingSessions', id)
    setHistory(prev => prev.filter(s => s.id !== id))
    setDeleteConfirmId(null)
  }

  const historyStats = useMemo(() => {
    if (history.length === 0) return null
    const total = history.length
    const avgBand = Math.round((history.reduce((s, h) => s + h.estimatedBand, 0) / total) * 10) / 10
    const totalTime = history.reduce((s, h) => s + h.timeSpentMinutes, 0)
    const totalWords = history.reduce((s, h) => s + h.wordCount, 0)
    const bestBand = Math.max(...history.map(h => h.estimatedBand))
    return { total, avgBand, totalTime, totalWords, bestBand }
  }, [history])

  const recentSessions = useMemo(() => {
    return history.slice(0, 5)
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
                Writing Practice
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Practice IELTS Writing Task 1 and Task 2 with prompts, an essay editor, and AI feedback
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startCustomPractice} variant="secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Custom Prompt
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
                    Total Essays
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {historyStats.total}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Avg Band
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: getBandColor(historyStats.avgBand) }}
                  >
                    {historyStats.avgBand}
                    <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>/9</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Writing Time
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
                    {formatTime(historyStats.totalTime * 60)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Words Written
                  </p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {historyStats.totalWords.toLocaleString()}
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
                    placeholder="Search prompts..."
                    className="w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                    aria-label="Search writing prompts"
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
                  value={taskTypeFilter}
                  onChange={(e) => setTaskTypeFilter(e.target.value as WritingTaskType | '')}
                  className="rounded-lg border px-2 py-2 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Filter by task type"
                >
                  {TASK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {filteredPrompts.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--color-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No prompts match your filters.
                  </p>
                  <Button className="mt-4" size="sm" onClick={startCustomPractice}>
                    Write with Custom Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPrompts.map(prompt => (
                <Card key={prompt.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: prompt.taskType === 'task1' ? 'var(--color-primary-light)' : 'var(--color-success-light, #f0fdf4)',
                            color: prompt.taskType === 'task1' ? 'var(--color-primary)' : 'var(--color-success, #16a34a)',
                          }}
                        >
                          {prompt.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {prompt.topic}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor:
                              prompt.difficulty === 'easy'
                                ? 'var(--color-success-light, #f0fdf4)'
                                : prompt.difficulty === 'hard'
                                  ? 'var(--color-danger-light, #fef2f2)'
                                  : 'var(--color-primary-light)',
                            color:
                              prompt.difficulty === 'easy'
                                ? 'var(--color-success, #16a34a)'
                                : prompt.difficulty === 'hard'
                                  ? 'var(--color-danger, #dc2626)'
                                  : 'var(--color-primary)',
                          }}
                        >
                          {prompt.difficulty.charAt(0).toUpperCase() + prompt.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-3 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                      {prompt.description}
                    </h3>
                    <p
                      className="mt-2 line-clamp-3 text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {prompt.question}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => startPractice(prompt)}>
                        Start Writing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {recentSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentSessions.map(s => (
                    <div
                      key={s.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                      }}
                      onClick={() => setHistoryDetail(s)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {s.question.slice(0, 60)}...
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                          <span>{formatDate(s.createdAt)}</span>
                          <span>{s.wordCount} words</span>
                          <span style={{ color: getBandColor(s.estimatedBand) }}>
                            Band {s.estimatedBand}
                          </span>
                        </div>
                      </div>
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {view === 'practice' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {selectedPrompt ? selectedPrompt.description : 'Custom Writing Practice'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedPrompt && (
                  <>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: selectedPrompt.taskType === 'task1' ? 'var(--color-primary-light)' : 'var(--color-success-light, #f0fdf4)',
                        color: selectedPrompt.taskType === 'task1' ? 'var(--color-primary)' : 'var(--color-success, #16a34a)',
                      }}
                    >
                      {selectedPrompt.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {selectedPrompt.topic}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {draftSaved && (
                <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                  Draft saved
                </span>
              )}
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                style={{
                  borderColor: timerSeconds > 3600 ? 'var(--color-danger)' : 'var(--color-border)',
                  color: timerSeconds > 3600 ? 'var(--color-danger)' : 'var(--color-text)',
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
            <CardHeader>
              <CardTitle>Question</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPrompt ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedPrompt.question}
                </p>
              ) : (
                <div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="custom-task-type" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        Task Type
                      </label>
                      <select
                        id="custom-task-type"
                        value={taskTypeFilter || 'task2'}
                        onChange={(e) => setTaskTypeFilter(e.target.value as WritingTaskType)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <option value="task1">Task 1</option>
                        <option value="task2">Task 2</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="custom-topic" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        Topic
                      </label>
                      <select
                        id="custom-topic"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <option value="">Select topic</option>
                        {TOPICS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label htmlFor="custom-question" className="mt-4 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Your Question
                  </label>
                  <textarea
                    id="custom-question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={4}
                    placeholder="Paste your IELTS writing prompt here..."
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Essay</CardTitle>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${
                      (selectedPrompt?.taskType === 'task1' && wordCount < 150) ||
                      (selectedPrompt?.taskType === 'task2' && wordCount < 250)
                        ? 'text-red-500'
                        : ''
                    }`}
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {wordCount} words
                    {selectedPrompt?.taskType === 'task1' && wordCount < 150 && (
                      <span className="ml-1 text-red-500">(min 150)</span>
                    )}
                    {selectedPrompt?.taskType === 'task2' && wordCount < 250 && (
                      <span className="ml-1 text-red-500">(min 250)</span>
                    )}
                  </span>
                  <Button variant="ghost" size="sm" onClick={saveDraft} disabled={!essayText.trim()}>
                    Save Draft
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                rows={16}
                placeholder="Write your essay here..."
                className="w-full rounded-lg border p-4 text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontFamily: 'Georgia, serif',
                  resize: 'vertical',
                }}
                aria-label="Essay editor"
              />
            </CardContent>
          </Card>

          {aiError && (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{
                borderColor: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-light, #fef2f2)',
                color: 'var(--color-danger)',
              }}
            >
              {aiError}
            </div>
          )}

          <div className="flex justify-center gap-3 pb-8">
            <Button variant="secondary" onClick={handleSaveAndFinish}>
              Save & Finish Later
            </Button>
            <Button
              size="lg"
              onClick={handleGetAiFeedback}
              loading={aiLoading}
              disabled={!essayText.trim() || !questionText.trim()}
            >
              {aiLoading ? 'Analyzing...' : 'Get AI Feedback'}
            </Button>
          </div>
        </div>
      )}

      {view === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Writing Feedback
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {formatDate(new Date().toISOString())} &middot; {formatTime(timerSeconds)} &middot; {wordCount} words
              </p>
            </div>
          </div>

          <FeedbackPanel feedback={feedback} />

          <Card>
            <CardHeader>
              <CardTitle>Your Essay</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {essayText}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3 pb-8">
            <Button variant="secondary" onClick={handleReset}>
              Back to Prompts
            </Button>
            <Button onClick={() => { setView('practice'); setFeedback(emptyFeedback); setAiError(null) }}>
              Revise & Try Again
            </Button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Writing History
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Track your writing practice and feedback over time
              </p>
            </div>
            <Button variant="secondary" onClick={() => setView('browse')}>
              Back to Prompts
            </Button>
          </div>

          {historyStats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Essays</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{historyStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Avg Band</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: getBandColor(historyStats.avgBand) }}>{historyStats.avgBand}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Best Band</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: getBandColor(historyStats.bestBand) }}>{historyStats.bestBand}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total Time</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatTime(historyStats.totalTime * 60)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Words Written</p>
                  <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{historyStats.totalWords.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {history.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: 'var(--color-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No writing practice history yet.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Complete a writing practice to see your history here.
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setView('browse')}>
                    Start Writing Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((session, idx) => {
                const bandColor = getBandColor(session.estimatedBand)
                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => setHistoryDetail(session)}
                        >
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
                                backgroundColor: session.taskType === 'task1' ? 'var(--color-primary-light)' : 'var(--color-success-light, #f0fdf4)',
                                color: session.taskType === 'task1' ? 'var(--color-primary)' : 'var(--color-success, #16a34a)',
                              }}
                            >
                              {session.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                            </span>
                            {session.topic && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  backgroundColor: 'var(--color-surface-alt)',
                                  color: 'var(--color-muted)',
                                }}
                              >
                                {session.topic}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {session.question.length > 80
                              ? session.question.slice(0, 80) + '...'
                              : session.question}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span>{formatDate(session.createdAt)}</span>
                            <span>{session.wordCount} words</span>
                            <span>{formatTime(session.timeSpentMinutes * 60)}</span>
                            <span className="font-medium" style={{ color: bandColor }}>
                              Band {session.estimatedBand}
                            </span>
                          </div>
                          {session.feedback && (
                            <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                              {session.feedback}
                            </p>
                          )}
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
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={!!historyDetail}
        onClose={() => setHistoryDetail(null)}
        title="Writing Session Details"
        size="lg"
      >
        {historyDetail && (
          <div className="space-y-4 text-sm" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Task Type
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>
                  {historyDetail.taskType === 'task1' ? 'Task 1' : 'Task 2'}
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
                  Band Score
                </span>
                <p className="mt-0.5 font-semibold" style={{ color: getBandColor(historyDetail.estimatedBand) }}>
                  {historyDetail.estimatedBand}/9
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Word Count
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{historyDetail.wordCount}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Time Spent
                </span>
                <p className="mt-0.5" style={{ color: 'var(--color-text)' }}>{formatTime(historyDetail.timeSpentMinutes * 60)}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Question
              </span>
              <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                {historyDetail.question}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Essay
              </span>
              <div
                className="mt-0.5 whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                  fontFamily: 'Georgia, serif',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {historyDetail.essay}
              </div>
            </div>

            {historyDetail.betterVersion && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Improved Version
                </span>
                <div
                  className="mt-0.5 whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed"
                  style={{
                    borderColor: 'var(--color-success, #16a34a)',
                    backgroundColor: 'var(--color-success-light, #f0fdf4)',
                    color: 'var(--color-text)',
                    fontFamily: 'Georgia, serif',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {historyDetail.betterVersion}
                </div>
              </div>
            )}

            {historyDetail.feedback && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Feedback
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {historyDetail.feedback}
                </p>
              </div>
            )}

            {historyDetail.grammarMistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Grammar Mistakes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-danger)' }}>
                  {historyDetail.grammarMistakes}
                </p>
              </div>
            )}

            {historyDetail.vocabularyMistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Vocabulary Mistakes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-primary)' }}>
                  {historyDetail.vocabularyMistakes}
                </p>
              </div>
            )}

            {historyDetail.coherenceNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Coherence Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {historyDetail.coherenceNotes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setHistoryDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Session"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Are you sure you want to delete this writing session? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

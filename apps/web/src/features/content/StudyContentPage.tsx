import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getContentByTitle, getAllContentTemplates } from '../tasks/ieltsContent'
import type { ContentTemplate } from '../tasks/ieltsContent'
import type { TaskContentSection, TaskPracticeQuestion, StudySkill, Difficulty } from '../tasks/types'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { DatabaseService } from '../../services/storage/Database'
import type { TaskEntry, StudyNote } from '../../models'
import { useToast } from '../../components/ui/Toast'
import { loadRoadmap, recalculateProgress, saveRoadmap } from '../roadmap/roadmapService'

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  Vocabulary: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  Reading: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  Listening: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  Writing: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  Speaking: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  Grammar: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300' },
}

const DIFFICULTY_BADGE: Record<Difficulty, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  easy: { variant: 'success', label: 'Easy' },
  medium: { variant: 'warning', label: 'Medium' },
  hard: { variant: 'danger', label: 'Hard' },
}

function getSkillColor(skill: string) {
  return SKILL_COLORS[skill] ?? { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' }
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function decodeTaskTitle(encoded: string): string {
  try {
    return decodeURIComponent(encoded)
  } catch {
    return encoded
  }
}

interface AnswerState {
  [questionId: string]: string
}

interface FeedbackState {
  [questionId: string]: {
    isCorrect: boolean
    revealed: boolean
  }
}

function SectionRenderer({ section, index }: { section: TaskContentSection; index: number }) {
  const typeStyles: Record<string, string> = {
    instruction: 'border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600',
    list: '',
    example: 'border-l-4 border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600',
    tip: 'border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600',
    text: '',
  }

  const cls = typeStyles[section.type ?? 'text'] ?? ''

  return (
    <div key={index} className={`rounded-lg p-4 ${cls}`} style={!cls ? { backgroundColor: 'var(--color-surface-alt)' } : undefined}>
      {section.heading && (
        <h4 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {section.heading}
        </h4>
      )}
      {section.type === 'list' ? (
        <ul className="space-y-1">
          {section.body.split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {line.startsWith('- ') || line.match(/^\d+\.\s/) ? line : `• ${line}`}
            </li>
          ))}
        </ul>
      ) : (
        <div className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {section.body}
        </div>
      )}
    </div>
  )
}

function QuestionRenderer({
  question,
  index,
  answer,
  feedback,
  onAnswer,
  onCheck,
  onReveal,
}: {
  question: TaskPracticeQuestion
  index: number
  answer: string
  feedback: FeedbackState[string] | undefined
  onAnswer: (val: string) => void
  onCheck: () => void
  onReveal: () => void
}) {
  const isMcq = question.type === 'multiple-choice'
  const isFillBlank = question.type === 'fill-blank'
  const isShortAnswer = question.type === 'short-answer'
  const isOpenEnded = question.type === 'open-ended'
  const isWriting = question.type === 'writing'
  const isSpeaking = question.type === 'speaking'

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)' }}>
      <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Q{index + 1}
        </span>
        {question.question}
      </p>

      {isMcq && question.options && (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                answer === opt
                  ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30'
                  : 'hover:border-blue-200 dark:hover:border-blue-800'
              }`}
              style={{ borderColor: answer === opt ? undefined : 'var(--color-border)' }}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={answer === opt}
                onChange={() => onAnswer(opt)}
                className="h-4 w-4 accent-blue-600"
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {isFillBlank && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}

      {isShortAnswer && (
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your short answer..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}

      {isOpenEnded && (
        <textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Write your answer..."
          rows={4}
          className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}

      {isWriting && (
        <textarea
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Write your essay or paragraph here..."
          rows={8}
          className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      )}

      {isSpeaking && (
        <div className="rounded-lg border p-4 text-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
          <p className="mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This is a speaking practice prompt. Record yourself or practice out loud.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
            }}
          >
            Practice with AI Tutor
          </Button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {isMcq && question.correctAnswer && (
          <>
            <Button size="sm" onClick={onCheck} disabled={!answer}>
              Check Answer
            </Button>
            <Button variant="ghost" size="sm" onClick={onReveal}>
              Show Answer
            </Button>
          </>
        )}
        {(isFillBlank || isShortAnswer) && question.correctAnswer && (
          <>
            <Button size="sm" onClick={onCheck} disabled={!answer}>
              Check Answer
            </Button>
            <Button variant="ghost" size="sm" onClick={onReveal}>
              Show Answer
            </Button>
          </>
        )}
        {isOpenEnded && (
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Open-ended — check your answer against the tips above
          </span>
        )}
        {isWriting && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
            }}
          >
            Get AI Feedback
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            feedback.isCorrect
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
          }`}
        >
          {feedback.isCorrect ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Correct!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Incorrect. The correct answer is: {question.correctAnswer}
            </span>
          )}
        </div>
      )}

      {feedback?.revealed && !feedback?.isCorrect && (
        <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
          Correct answer: {question.correctAnswer}
        </div>
      )}
    </div>
  )
}

export default function StudyContentPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [content, setContent] = useState<ContentTemplate | null>(null)
  const [contentData, setContentData] = useState<ReturnType<ContentTemplate['getContent']> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<AnswerState>({})
  const [feedback, setFeedback] = useState<FeedbackState>({})
  const [isComplete, setIsComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [taskEntry, setTaskEntry] = useState<TaskEntry | null>(null)

  const title = decodeTaskTitle(taskId ?? '')
  const contentGeneratedRef = useRef(false)

  useEffect(() => {
    if (!title || contentGeneratedRef.current) return
    contentGeneratedRef.current = true

    try {
      const found = getContentByTitle(title)
      if (found) {
        setContent(found)
        setContentData(found.getContent())
      } else {
        setError(`Content not found: "${title}"`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }

    DatabaseService.queryByIndex<TaskEntry>('tasks', 'title', title)
      .then(tasks => {
        if (tasks.length > 0) {
          const t = tasks[0]
          setTaskEntry(t)
          if (t.isDone) setIsComplete(true)
        }
      })
      .catch(() => {})
  }, [title])

  useEffect(() => {
    if (!loading && !content && !error) {
      const all = getAllContentTemplates()
      if (all.length > 0) {
        setContent(all[0])
        setContentData(all[0].getContent())
      }
    }
  }, [loading, content, error])

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleCheck = useCallback((question: TaskPracticeQuestion) => {
    const userAnswer = answers[question.id]?.trim().toLowerCase() ?? ''
    const correct = question.correctAnswer?.trim().toLowerCase() ?? ''
    const isCorrect = userAnswer === correct
    setFeedback(prev => ({
      ...prev,
      [question.id]: { isCorrect, revealed: false },
    }))
  }, [answers])

  const handleReveal = useCallback((question: TaskPracticeQuestion) => {
    const userAnswer = answers[question.id]?.trim().toLowerCase() ?? ''
    const correct = question.correctAnswer?.trim().toLowerCase() ?? ''
    const isCorrect = userAnswer === correct
    setFeedback(prev => ({
      ...prev,
      [question.id]: { isCorrect: isCorrect || !userAnswer, revealed: true },
    }))
  }, [answers])

  const handleCompleteTask = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      if (taskEntry) {
        await DatabaseService.updateTask(taskEntry.id, {
          isDone: true,
          completedAt: new Date().toISOString(),
        } as Partial<TaskEntry>)
      }

      const roadmap = loadRoadmap()
      if (roadmap) {
        const todayStr = new Date().toISOString().split('T')[0]
        for (const phase of roadmap.phases) {
          for (const week of phase.weeks) {
            for (const day of week.days) {
              if (day.objective === title || day.date === todayStr) {
                day.isComplete = true
              }
            }
          }
        }
        const updated = recalculateProgress(roadmap, [])
        saveRoadmap(updated)
      }

      setIsComplete(true)
      showToast('success', 'Task completed! Great progress.')
    } catch (err) {
      showToast('error', 'Failed to save completion. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [saving, taskEntry, title, showToast])

  const handleSaveNotes = useCallback(async () => {
    if (!notesText.trim()) return
    setSaving(true)
    try {
      const note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        title: `Notes: ${title}`,
        content: notesText,
        topic: contentData?.topic ?? '',
        skill: content?.skill ?? '',
        tags: ['study-content', content?.skill?.toLowerCase() ?? 'general'],
        isFavorite: false,
        isDraft: false,
      }
      await DatabaseService.addStudyNote(note)
      setNotesModalOpen(false)
      setNotesText('')
      showToast('success', 'Notes saved successfully!')
    } catch {
      showToast('error', 'Failed to save notes.')
    } finally {
      setSaving(false)
    }
  }, [notesText, title, contentData, content, showToast])

  const handleReviewLater = useCallback(async () => {
    setSaving(true)
    try {
      const note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        title: `Review later: ${title}`,
        content: `${title}\nSkill: ${content?.skill ?? ''}\nTopic: ${contentData?.topic ?? ''}\n\nAdd your notes here...`,
        topic: contentData?.topic ?? '',
        skill: content?.skill ?? '',
        tags: ['review-later', content?.skill?.toLowerCase() ?? 'general', 'study-content'],
        isFavorite: false,
        isDraft: true,
      }
      await DatabaseService.addStudyNote(note)
      showToast('success', 'Added to review list!')
    } catch {
      showToast('error', 'Failed to save for review.')
    } finally {
      setSaving(false)
    }
  }, [title, content, contentData, showToast])

  if (loading) {
    return <LoadingSpinner size="lg" fullPage message="Loading study content..." />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Content Not Found"
          description={error}
          action={{ label: 'Back to Dashboard', onClick: () => navigate('/dashboard') }}
        />
      </div>
    )
  }

  if (!content || !contentData) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="No Study Content"
          description="Select a task from your dashboard or roadmap to start learning."
          action={{ label: 'Go to Dashboard', onClick: () => navigate('/dashboard') }}
        />
      </div>
    )
  }

  const { skill, title: contentTitle, objective, difficulty, estimatedMinutes } = content
  const { sections, questions, tips, whyItMatters, topic } = contentData
  const skillColor = getSkillColor(skill)
  const diffBadge = DIFFICULTY_BADGE[difficulty]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-2 flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: 'var(--color-muted)' }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${skillColor.bg} ${skillColor.text}`}>
                  {skill}
                </span>
                <Badge variant={diffBadge.variant} size="sm">{diffBadge.label}</Badge>
                {estimatedMinutes > 0 && (
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {estimatedMinutes} min
                  </span>
                )}
                {topic && (
                  <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                    {topic}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {contentTitle}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {objective}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isComplete ? (
                <Badge variant="success" size="md">Completed</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCompleteTask}
                  loading={saving}
                >
                  Complete Task
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <CardContent>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                What is this task about?
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {objective}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-info, #3b82f6)' }}>
            <CardContent>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-info, #3b82f6)' }}>
                Why this matters for IELTS
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {whyItMatters}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.map((section, i) => (
                  <SectionRenderer key={i} section={section} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Practice Questions</CardTitle>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {questions.length} question{questions.length > 1 ? 's' : ''}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <QuestionRenderer
                      key={q.id}
                      question={q}
                      index={i}
                      answer={answers[q.id] ?? ''}
                      feedback={feedback[q.id]}
                      onAnswer={(val) => handleAnswer(q.id, val)}
                      onCheck={() => handleCheck(q)}
                      onReveal={() => handleReveal(q)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              AI Help
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNotesModalOpen(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Save Notes
            </Button>
            <Button variant="outline" size="sm" onClick={handleReviewLater} loading={saving}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review Later
            </Button>
            {!isComplete && (
              <Button size="sm" onClick={handleCompleteTask} loading={saving}>
                Complete Task
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Skill</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{skill}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Difficulty</span>
                  <Badge variant={diffBadge.variant} size="sm">{diffBadge.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Est. Time</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{estimatedMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Topic</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{topic}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Status</span>
                  {isComplete ? (
                    <Badge variant="success" size="sm">Completed</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">In Progress</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/roadmap')}
                >
                  View Roadmap
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate(`/${skill.toLowerCase()}`)}
                >
                  More {skill} Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        title="Save Notes"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Add your notes for: <strong>{contentTitle}</strong>
          </p>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Write your notes here..."
            rows={8}
            className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotesModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNotes} loading={saving} disabled={!notesText.trim()}>
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

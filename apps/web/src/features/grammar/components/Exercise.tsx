import { useState, useMemo } from 'react'
import type { MistakeEntry, MistakeStatus } from '../../../models'
import { DatabaseService } from '../../../services/storage/Database'
import Card, { CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { generateId } from '../../../utils'

export interface GrammarExerciseItem {
  id: string
  topic: string
  type: 'multiple-choice' | 'gap-fill' | 'true-false' | 'error-correction'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

interface ExerciseProps {
  exercises: GrammarExerciseItem[]
  topic: string
  onComplete: (results: { total: number; correct: number; mistakes: MistakeEntry[]; questions: GrammarExerciseItem[]; answers: Record<string, string> }) => void
  onGenerateAi?: (topic: string) => void
  onRegenerate?: (topic: string) => void
}

export default function Exercise({ exercises, topic, onComplete, onGenerateAi, onRegenerate }: ExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Array<{ exerciseId: string; correct: boolean }>>([])
  const [saving, setSaving] = useState(false)

  const currentExercise = exercises[currentIndex]
  const isLast = currentIndex === exercises.length - 1

  const progress = useMemo(() => {
    const answered = Object.keys(userAnswers).length
    return { answered, total: exercises.length }
  }, [userAnswers, exercises.length])

  function setAnswer(value: string) {
    setUserAnswers(prev => ({ ...prev, [currentExercise.id]: value }))
  }

  function checkAnswer() {
    const userAnswer = (userAnswers[currentExercise.id] || '').trim().toLowerCase()
    const correct = currentExercise.correctAnswer.trim().toLowerCase()
    const isCorrect = userAnswer === correct

    setResults(prev => [...prev, { exerciseId: currentExercise.id, correct: isCorrect }])
    setSubmitted(true)
  }

  function nextQuestion() {
    setSubmitted(false)
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  async function finish() {
    if (saving) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const mistakes: MistakeEntry[] = []

      for (let i = 0; i < exercises.length; i++) {
        const result = results.find(r => r.exerciseId === exercises[i].id)
        if (!result || !result.correct) {
          const mistake: MistakeEntry = {
            id: generateId(),
            mistake: exercises[i].question,
            correction: exercises[i].correctAnswer,
            explanation: exercises[i].explanation,
            source: `Grammar - ${topic}`,
            date: now.slice(0, 10),
            skill: 'grammar',
            status: 'new' as MistakeStatus,
            repetitionCount: 0,
            createdAt: now,
            updatedAt: now,
          }
          mistakes.push(mistake)
        }
      }

      const correctCount = results.filter(r => r.correct).length
      onComplete({ total: exercises.length, correct: correctCount, mistakes, questions: exercises, answers: userAnswers })
    } catch (error) {
      console.error('apps/web/src/features/grammar/components/Exercise.tsx error:', error);
      const correctCount = results.filter(r => r.correct).length
      onComplete({ total: exercises.length, correct: correctCount, mistakes: [], questions: exercises, answers: userAnswers })
    } finally {
      setSaving(false)
    }
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
              No exercises available for this topic.
            </p>
            {onGenerateAi && (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => onGenerateAi(topic)}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Generate with AI
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const allAnswered = Object.keys(userAnswers).length === exercises.length
  const allChecked = results.length === exercises.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Exercise {currentIndex + 1} of {exercises.length}
        </p>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
            {progress.answered}
          </span>
          /{progress.total} answered
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--color-surface-alt)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / exercises.length) * 100}%`,
            backgroundColor: 'var(--color-primary)',
          }}
        />
      </div>

      {allChecked ? (
        completeScreen(results, finish, saving, topic, onRegenerate)
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {currentExercise.type.replace(/-/g, ' ')}
              </span>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {currentExercise.topic}
              </span>
            </div>

            <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {currentExercise.question}
            </p>

            {currentExercise.type === 'multiple-choice' && currentExercise.options && (
              <div className="space-y-2">
                {currentExercise.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const selected = userAnswers[currentExercise.id] === letter
                  const showCorrect = submitted && opt.startsWith(currentExercise.correctAnswer)
                  const showWrong = submitted && selected && !showCorrect

                  return (
                    <button
                      key={i}
                      onClick={() => !submitted && setAnswer(letter)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        submitted ? 'cursor-default' : 'cursor-pointer hover:border-[var(--color-primary)]'
                      }`}
                      style={{
                        borderColor: showCorrect
                          ? 'var(--color-success)'
                          : showWrong
                            ? 'var(--color-danger)'
                            : selected
                              ? 'var(--color-primary)'
                              : 'var(--color-border)',
                        backgroundColor: showCorrect
                          ? 'var(--color-success-light)'
                          : showWrong
                            ? 'var(--color-danger-light)'
                            : selected
                              ? 'var(--color-primary-light)'
                              : 'var(--color-surface)',
                      }}
                      disabled={submitted}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: selected || showCorrect
                            ? 'var(--color-primary)'
                            : 'var(--color-surface-alt)',
                          color: selected || showCorrect ? 'white' : 'var(--color-muted)',
                        }}
                      >
                        {letter}
                      </span>
                      <span style={{ color: 'var(--color-text)' }}>{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {currentExercise.type === 'gap-fill' && (
              <div>
                <input
                  type="text"
                  value={userAnswers[currentExercise.id] || ''}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{
                    borderColor: submitted
                      ? (userAnswers[currentExercise.id] || '').trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase()
                        ? 'var(--color-success)'
                        : 'var(--color-danger)'
                      : 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  disabled={submitted}
                />
              </div>
            )}

            {currentExercise.type === 'true-false' && (
              <div className="flex gap-3">
                {['True', 'False'].map(opt => {
                  const selected = userAnswers[currentExercise.id] === opt[0]
                  const showCorrect = submitted && currentExercise.correctAnswer.startsWith(opt[0])
                  const showWrong = submitted && selected && !showCorrect

                  return (
                    <button
                      key={opt}
                      onClick={() => !submitted && setAnswer(opt[0])}
                      className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                        submitted ? 'cursor-default' : 'cursor-pointer hover:border-[var(--color-primary)]'
                      }`}
                      style={{
                        borderColor: showCorrect
                          ? 'var(--color-success)'
                          : showWrong
                            ? 'var(--color-danger)'
                            : selected
                              ? 'var(--color-primary)'
                              : 'var(--color-border)',
                        backgroundColor: showCorrect
                          ? 'var(--color-success-light)'
                          : showWrong
                            ? 'var(--color-danger-light)'
                            : selected
                              ? 'var(--color-primary-light)'
                              : 'var(--color-surface)',
                        color: 'var(--color-text)',
                      }}
                      disabled={submitted}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {currentExercise.type === 'error-correction' && (
              <div>
                <textarea
                  value={userAnswers[currentExercise.id] || ''}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write the corrected version..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  disabled={submitted}
                />
              </div>
            )}

            {submitted && (
              <div
                className="rounded-lg border p-3 text-sm"
                style={{
                  borderColor:
                    (userAnswers[currentExercise.id] || '').trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase()
                      ? 'var(--color-success)'
                      : 'var(--color-danger)',
                  backgroundColor:
                    (userAnswers[currentExercise.id] || '').trim().toLowerCase() === currentExercise.correctAnswer.trim().toLowerCase()
                      ? 'var(--color-success-light)'
                      : 'var(--color-danger-light)',
                }}
              >
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {currentExercise.correctAnswer}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                  {currentExercise.explanation}
                </p>
              </div>
            )}

              <div className="flex items-center justify-between pt-2">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {Object.keys(userAnswers).length} of {exercises.length} answered
              </p>
              <div className="flex gap-2">
                {!submitted ? (
                  <Button
                    onClick={checkAnswer}
                    disabled={!userAnswers[currentExercise.id]}
                  >
                    Check Answer
                  </Button>
                ) : isLast ? (
                  <Button onClick={finish} loading={saving}>
                    {allAnswered ? 'Finish' : 'Skip & Finish'}
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>Next</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function completeScreen(
  results: Array<{ exerciseId: string; correct: boolean }>,
  finish: () => void,
  saving: boolean,
  topic: string,
  onRegenerate?: (topic: string) => void,
) {
  const correctCount = results.filter(r => r.correct).length
  const total = results.length
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0

  return (
    <Card>
      <CardContent className="py-8 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              percentage >= 80 ? 'var(--color-success-light)' : percentage >= 50 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
          }}
        >
          <svg
            className="h-8 w-8"
            style={{
              color:
                percentage >= 80 ? 'var(--color-success)' : percentage >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {percentage >= 50 ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>

        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Exercise Complete!
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          {topic}
        </p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {correctCount}/{total}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Correct
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
              {percentage}%
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Score
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-danger)' }}>
              {total - correctCount}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Mistakes
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs" style={{ color: 'var(--color-muted)' }}>
          Mistakes have been saved to your notebook for review.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={finish} loading={saving} variant="secondary">
            Back to Topics
          </Button>
          {onRegenerate && (
            <Button onClick={() => onRegenerate(topic)} variant="primary">
              Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

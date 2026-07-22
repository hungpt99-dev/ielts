import { useCallback, useEffect, useState } from 'react'
import { formatTime } from '../utils/tokenizeTranscript'
import { scoreObjectiveQuestion } from '@ielts/learning-engine'
import type { LearnerResponse } from '@ielts/learning-engine'

interface Question {
  id: string
  type: string
  prompt: string
  options?: string[]
  correctAnswer: string
  points: number
  sourceSegmentIds: string[]
  explanation: string
  evidenceStartMs: number
  evidenceEndMs: number
}

interface Quiz {
  id: string
  videoId: string
  title: string
  startMs: number
  endMs: number
  questions: Question[]
  totalPoints: number
  onePlay: boolean
  hideSubtitles: boolean
  createdAt: string
}

function mapQuizQuestionToEngine(question: Question): Record<string, unknown> | null {
  const t = question.type.toLowerCase().replace(/-/g, '_')
  if (t === 'multiple_choice') {
    const correctIndex = question.options?.indexOf(question.correctAnswer) ?? -1
    return {
      id: question.id,
      type: 'multiple_choice',
      prompt: question.prompt,
      options: question.options ?? [],
      correctIndex,
      points: question.points,
      difficulty: { difficulty: 1 },
      learningObjectiveIds: [],
    }
  }
  if (t === 'gap_fill' || t === 'completion' || t === 'fill_in_blank' || t === 'fill_in_the_blank') {
    return {
      id: question.id,
      type: 'completion',
      subtype: 'gap_fill',
      prompt: question.prompt,
      text: question.prompt,
      points: question.points,
      gaps: [{ correctAnswer: question.correctAnswer, acceptableAlternatives: [], position: 0 }],
      difficulty: { difficulty: 1 },
      learningObjectiveIds: [],
    }
  }
  if (t === 'true_false_not_given') {
    return {
      id: question.id,
      type: 'true_false_not_given',
      prompt: question.prompt,
      correctAnswer: question.correctAnswer,
      points: question.points,
      difficulty: { difficulty: 1 },
      learningObjectiveIds: [],
    }
  }
  if (t === 'short_answer') {
    return {
      id: question.id,
      type: 'short_answer',
      prompt: question.prompt,
      correctAnswer: question.correctAnswer,
      acceptableAlternatives: [],
      caseSensitive: false,
      points: question.points,
      difficulty: { difficulty: 1 },
      learningObjectiveIds: [],
    }
  }
  return null
}

function mapQuizAnswerToResponse(question: Question, answer: string): LearnerResponse {
  const t = question.type.toLowerCase().replace(/-/g, '_')
  if (t === 'multiple_choice') {
    const selectedIndex = question.options?.indexOf(answer) ?? -1
    return { type: 'choice', selectedIndex }
  }
  return { type: 'text', value: answer }
}

export function QuizPanel({
  videoId, startMs, endMs, onClose, onSeek, sendToParent,
}: {
  videoId: string
  startMs: number
  endMs: number
  onClose: () => void
  onSeek: (time: number) => void
  sendToParent: (type: string, payload?: unknown) => void
}) {
  useEffect(() => {
    sendToParent('ENTER_EXERCISE_MODE')
    return () => { sendToParent('EXIT_EXERCISE_MODE') }
  }, [sendToParent])

  const [phase, setPhase] = useState<'config' | 'generating' | 'ready' | 'playing' | 'answering' | 'submitted'>('config')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Array<{ questionId: string; correct: boolean; points: number; totalPoints: number; userAnswer: string; correctAnswer: string; explanation: string; evidenceStartMs: number; evidenceEndMs: number }> | null>(null)
  const [score, setScore] = useState<{ totalScore: number; totalPossible: number; accuracy: number } | null>(null)

  useEffect(() => {
    if (phase !== 'generating') return
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'QUIZ_DATA') {
        const payload = event.data.payload as { success?: boolean; quiz?: Quiz; error?: string }
        if (payload.error) {
          setError(payload.error)
          setPhase('config')
        } else if (payload.success && payload.quiz) {
          setQuiz(payload.quiz)
          setPhase('ready')
        }
      }
    }
    window.addEventListener('message', handler)
    sendToParent('GENERATE_QUIZ', { videoId, startMs, endMs, difficulty, questionCount })
    return () => window.removeEventListener('message', handler)
  }, [phase, videoId, startMs, endMs, difficulty, questionCount, sendToParent])

  useEffect(() => {
    if (phase !== 'submitted') return
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== 'ielts-content-script') return
      if (event.data?.type === 'QUIZ_EVALUATION') {
        const payload = event.data.payload as { success?: boolean; results?: typeof results; totalScore?: number; totalPossible?: number; accuracy?: number; error?: string }
        if (payload.error) {
          setError(payload.error)
        } else if (payload.success && payload.results) {
          setResults(payload.results)
          setScore({ totalScore: payload.totalScore || 0, totalPossible: payload.totalPossible || 0, accuracy: payload.accuracy || 0 })
          const incorrect = payload.results.filter((r: any) => !r.correct)
          if (incorrect.length > 0) {
            window.parent.postMessage(
              { source: 'ielts-youtube-learning', type: 'SAVE_MISTAKES', payload: { mistakes: incorrect.map((r: any) => ({
                questionId: r.questionId, userAnswer: r.userAnswer, correctAnswer: r.correctAnswer,
                explanation: r.explanation, evidenceStartMs: r.evidenceStartMs, attemptDate: new Date().toISOString(),
              })) } },
              '*',
            )
          }
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [phase])

  const handleGenerate = useCallback(() => {
    setError(null)
    setPhase('generating')
  }, [])

  const handleStartPlayback = useCallback(() => {
    setPhase('playing')
    onSeek(startMs / 1000)
  }, [onSeek, startMs])

  const handleStartAnswering = useCallback(() => {
    setPhase('answering')
  }, [])

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!quiz) return
    const scoredResults: Array<{ questionId: string; correct: boolean; points: number; totalPoints: number; userAnswer: string; correctAnswer: string; explanation: string; evidenceStartMs: number; evidenceEndMs: number }> = []
    let totalScore = 0
    let totalPossible = 0

    for (const q of quiz.questions) {
      const userAnswer = answers[q.id] || ''
      const engineQ = mapQuizQuestionToEngine(q)
      if (engineQ) {
        const engineR = mapQuizAnswerToResponse(q, userAnswer)
        const result = scoreObjectiveQuestion(engineQ as any, engineR)
        totalScore += result.score
        totalPossible += result.maxScore
        scoredResults.push({
          questionId: q.id,
          correct: result.correct,
          points: result.score,
          totalPoints: result.maxScore,
          userAnswer,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          evidenceStartMs: q.evidenceStartMs,
          evidenceEndMs: q.evidenceEndMs,
        })
      } else {
        const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
        totalScore += isCorrect ? q.points : 0
        totalPossible += q.points
        scoredResults.push({
          questionId: q.id,
          correct: isCorrect,
          points: isCorrect ? q.points : 0,
          totalPoints: q.points,
          userAnswer,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          evidenceStartMs: q.evidenceStartMs,
          evidenceEndMs: q.evidenceEndMs,
        })
      }
    }

    setResults(scoredResults)
    setScore({
      totalScore,
      totalPossible,
      accuracy: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
    })
    setPhase('submitted')
    sendToParent('SUBMIT_QUIZ', { quizId: quiz.id, questions: quiz.questions, answers })
  }, [quiz, answers, sendToParent])

  const containerStyle = { height: '100%', padding: 'var(--spacing-sm)', overflow: 'auto' }
  const btnStyle = { padding: '6px 14px', borderRadius: '4px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-on-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-sans)' }
  const btnOutline = { ...btnStyle, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }

  if (phase === 'config' || phase === 'generating') {
    return (
      <div style={containerStyle}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px', color: 'var(--color-text)' }}>Listening Quiz</div>
        <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px' }}>
          Section: {formatTime(startMs / 1000)} – {formatTime(endMs / 1000)}
        </div>
        {error && <div style={{ color: 'var(--color-danger)', fontSize: '11px', marginBottom: '8px' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Difficulty
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '4px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', fontSize: '12px', outline: 'none' }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Questions
            <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} style={{ display: 'block', width: '100%', marginTop: '4px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', fontSize: '12px', outline: 'none' }}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button onClick={handleGenerate} disabled={phase === 'generating'} style={{ ...btnStyle, opacity: phase === 'generating' ? 0.6 : 1, marginTop: '4px' }}>
            {phase === 'generating' ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
        <button onClick={onClose} style={{ ...btnOutline, marginTop: '8px', width: '100%' }}>Cancel</button>
      </div>
    )
  }

  if (phase === 'ready' && quiz) {
    return (
      <div style={containerStyle}>
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--color-text)' }}>{quiz.title}</div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '12px' }}>
          {quiz.questions.length} questions · {quiz.totalPoints} points
        </div>
        <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          ⓘ {quiz.onePlay ? 'You can play the section once.' : 'Practice mode — replay allowed.'} Transcript will be hidden during playback.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleStartPlayback} style={btnStyle}>Start Playback</button>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
        </div>
      </div>
    )
  }

  if (phase === 'playing') {
    return (
      <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-muted)' }}>Playing section...</div>
        <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
          {formatTime(startMs / 1000)} – {formatTime(endMs / 1000)}
        </div>
        <button onClick={handleStartAnswering} style={btnStyle}>I'm done — show questions</button>
      </div>
    )
  }

  if (phase === 'answering' && quiz) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text)' }}>Answer Questions</span>
          <button onClick={handleSubmit} style={btnStyle}>Submit</button>
        </div>
        {quiz.questions.map((q, i) => (
          <div key={q.id} style={{ padding: '10px', marginBottom: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)', marginBottom: '4px' }}>Q{i + 1} · {q.type.replace(/-/g, ' ')} · {q.points}pt{q.points > 1 ? 's' : ''}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.4 }}>{q.prompt}</div>
            {q.options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {q.options.map((opt, oi) => (
                  <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '4px', background: answers[q.id] === opt ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswerChange(q.id, opt)} style={{ accentColor: 'var(--color-primary)' }} />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input
                value={answers[q.id] || ''}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
                placeholder="Your answer..."
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', fontSize: '12px', outline: 'none', fontFamily: 'var(--font-sans)' }}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (phase === 'submitted' && score && results) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '16px', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: score.accuracy >= 80 ? 'var(--color-success)' : score.accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
            {score.totalScore}/{score.totalPossible}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{score.accuracy}% accuracy</div>
        </div>
        <button onClick={onClose} style={{ ...btnOutline, width: '100%', marginBottom: '12px' }}>Close</button>
        {results.map((r, i) => (
          <div key={r.questionId} style={{ padding: '10px', marginBottom: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${r.correct ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: r.correct ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                Q{i + 1} · {r.correct ? `+${r.points}` : `0/${r.totalPoints}`}
              </span>
              <button onClick={() => onSeek(r.evidenceStartMs / 1000)} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '10px', padding: 0 }}>
                Replay ⏵
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)', marginBottom: '4px' }}>Your answer: <span style={{ color: r.correct ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 500 }}>{r.userAnswer || '(empty)'}</span></div>
            {!r.correct && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Correct: <span style={{ fontWeight: 500 }}>{r.correctAnswer}</span></div>}
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.4 }}>{r.explanation}</div>
          </div>
        ))}
      </div>
    )
  }

  return null
}



import { useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface AIExaminerProps {
  followUpQuestions: string[]
  topic: string
  onAnswer: (question: string, answer: string) => void
}

export default function AIExaminer({ followUpQuestions, topic: _topic, onAnswer }: AIExaminerProps) {
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([])
  const [showAll, setShowAll] = useState(false)

  const allQuestions = followUpQuestions
  const displayedQuestions = showAll ? allQuestions : allQuestions.slice(0, 4)

  function handleAskQuestion(q: string) {
    setCurrentQuestion(q)
    setAnswer('')
  }

  function handleSubmitAnswer() {
    if (!currentQuestion || !answer.trim()) return
    onAnswer(currentQuestion, answer.trim())
    setHistory(prev => [...prev, { question: currentQuestion, answer: answer.trim() }])
    setCurrentQuestion(null)
    setAnswer('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Examiner</CardTitle>
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Continue the conversation
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {history.map((item, i) => (
                <div key={i} className="rounded-lg border p-2.5 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                    Q: {item.question}
                  </p>
                  <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    A: {item.answer}
                  </p>
                </div>
              ))}
            </div>
          )}

          {currentQuestion ? (
            <div className="space-y-3">
              <div
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
                }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                  {currentQuestion}
                </p>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
                className="w-full rounded-xl border px-3 py-2 text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
                placeholder="Type your answer..."
                aria-label="Your answer to the examiner"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                  Submit Answer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentQuestion(null)}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Ask a follow-up question to continue practicing:
              </p>
              {displayedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(q)}
                  className="flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  {q}
                </button>
              ))}
              {allQuestions.length > 4 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full pt-1 text-xs font-medium transition-colors hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {showAll ? 'Show fewer' : `Show ${allQuestions.length - 4} more questions`}
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

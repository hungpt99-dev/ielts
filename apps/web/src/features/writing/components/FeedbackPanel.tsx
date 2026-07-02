import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

export interface WritingFeedback {
  taskResponse: string
  coherence: string
  vocabulary: string
  grammar: string
  bandScore: number
  overallFeedback: string
  improvedVersion: string
  mistakes: WritingMistake[]
}

export interface WritingMistake {
  category: 'grammar' | 'vocabulary' | 'coherence' | 'task-response'
  text: string
  correction: string
  explanation: string
}

interface FeedbackPanelProps {
  feedback: WritingFeedback
}

function getBandColor(band: number): string {
  if (band >= 7) return 'var(--color-success)'
  if (band >= 5) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getScoreColor(score: 'good' | 'average' | 'poor'): string {
  if (score === 'good') return 'var(--color-success)'
  if (score === 'average') return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function scoreLabel(text: string): 'good' | 'average' | 'poor' {
  const words = text.toLowerCase()
  if (words.includes('excellent') || words.includes('strong') || words.includes('very good')) return 'good'
  if (words.includes('poor') || words.includes('weak') || words.includes('needs improvement') || words.includes('limited')) return 'poor'
  return 'average'
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const categories = [
    { label: 'Task Response', content: feedback.taskResponse, key: 'task' },
    { label: 'Coherence & Cohesion', content: feedback.coherence, key: 'coherence' },
    { label: 'Vocabulary', content: feedback.vocabulary, key: 'vocab' },
    { label: 'Grammar', content: feedback.grammar, key: 'grammar' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: `4px solid ${getBandColor(feedback.bandScore)}`,
          }}
        >
          <span className="text-2xl font-bold" style={{ color: getBandColor(feedback.bandScore) }}>
            {feedback.bandScore.toFixed(1)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Band
          </span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Overall Feedback
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {feedback.overallFeedback}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => {
          const score = scoreLabel(cat.content)
          return (
            <Card key={cat.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    {cat.label}
                  </span>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: getScoreColor(score) }}
                  />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--color-text)' }}>
                  {cat.content}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {feedback.mistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mistakes & Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.mistakes.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-alt)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                      style={{
                        backgroundColor:
                          m.category === 'grammar'
                            ? 'var(--color-danger-light, #fef2f2)'
                            : m.category === 'vocabulary'
                              ? 'var(--color-primary-light)'
                              : m.category === 'coherence'
                                ? 'var(--color-warning-light, #fefce8)'
                                : 'var(--color-surface-alt)',
                        color:
                          m.category === 'grammar'
                            ? 'var(--color-danger)'
                            : m.category === 'vocabulary'
                              ? 'var(--color-primary)'
                              : m.category === 'coherence'
                                ? 'var(--color-warning)'
                                : 'var(--color-muted)',
                      }}
                    >
                      {m.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-text)' }}>
                    {m.text}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>
                      → {m.correction}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    {m.explanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {feedback.improvedVersion && (
        <Card>
          <CardHeader>
            <CardTitle>Improved Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed"
              style={{
                borderColor: 'var(--color-success, #16a34a)',
                backgroundColor: 'var(--color-success-light, #f0fdf4)',
                color: 'var(--color-text)',
                fontFamily: 'Georgia, serif',
              }}
            >
              {feedback.improvedVersion}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

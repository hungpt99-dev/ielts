import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

export type WritingMistake = {
  category: 'grammar' | 'vocabulary' | 'coherence' | 'task-response'
  text: string
  correction: string
  explanation: string
}

export type WritingFeedback = {
  taskResponse: string
  coherence: string
  vocabulary: string
  grammar: string
  bandScore: number
  overallFeedback: string
  improvedVersion: string
  mistakes: WritingMistake[]
}

function getBandColor(band: number): string {
  if (band >= 7) return 'var(--color-success)'
  if (band >= 5) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'grammar': return 'G'
    case 'vocabulary': return 'V'
    case 'coherence': return 'C'
    case 'task-response': return 'T'
    default: return '?'
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'grammar': return 'Grammar'
    case 'vocabulary': return 'Vocabulary'
    case 'coherence': return 'Coherence'
    case 'task-response': return 'Task Response'
    default: return category
  }
}

function formatCategoryName(key: string): string {
  switch (key) {
    case 'taskResponse': return 'Task Response'
    case 'coherence': return 'Coherence'
    case 'vocabulary': return 'Vocabulary'
    case 'grammar': return 'Grammar'
    default: return key
  }
}

const CRITERIA = ['taskResponse', 'coherence', 'vocabulary', 'grammar'] as const

export default function FeedbackPanel({ feedback }: { feedback: WritingFeedback }) {
  const bandColor = getBandColor(feedback.bandScore)

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 text-3xl font-bold"
            style={{
              borderColor: bandColor,
              color: bandColor,
            }}
          >
            {feedback.bandScore}
          </div>
          {feedback.overallFeedback && (
            <p className="w-full text-center text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
              {feedback.overallFeedback}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {CRITERIA.map((key) => {
          const value = feedback[key]
          return (
            <Card key={key} variant="outlined">
              <CardHeader className="mb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {formatCategoryName(key)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {value || 'No feedback provided.'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {feedback.mistakes.length > 0 && (
        <Card>
          <CardHeader className="mb-3">
            <CardTitle>Mistakes & Corrections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.mistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: getBandColor(
                        mistake.category === 'grammar' ? 4 :
                        mistake.category === 'vocabulary' ? 5 :
                        mistake.category === 'coherence' ? 6 : 7
                      )}}
                    >
                      {getCategoryIcon(mistake.category)}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                      {getCategoryLabel(mistake.category)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium">Original: </span>
                      <span className="italic">{mistake.text}</span>
                    </p>
                    <p style={{ color: 'var(--color-success)' }}>
                      <span className="font-medium">Correction: </span>
                      {mistake.correction}
                    </p>
                    {mistake.explanation && (
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {mistake.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {feedback.improvedVersion && (
        <Card>
          <CardHeader className="mb-3">
            <CardTitle>Improved Version</CardTitle>
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
              {feedback.improvedVersion}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

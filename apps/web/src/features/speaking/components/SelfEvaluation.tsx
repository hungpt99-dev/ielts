import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

export interface EvaluationResult {
  fluency: number
  vocabulary: number
  grammar: number
  pronunciation: number
  coherence: number
  taskAchievement: number
}

const CRITERIA: { key: keyof EvaluationResult; label: string; description: string }[] = [
  {
    key: 'fluency',
    label: 'Fluency & Coherence',
    description: 'Did you speak smoothly without long pauses? Were your ideas connected logically?',
  },
  {
    key: 'vocabulary',
    label: 'Lexical Resource',
    description: 'Did you use a range of vocabulary? Did you use any less common words or idioms?',
  },
  {
    key: 'grammar',
    label: 'Grammatical Range & Accuracy',
    description: 'Did you use a variety of sentence structures? Were there grammar errors?',
  },
  {
    key: 'pronunciation',
    label: 'Pronunciation',
    description: 'Was your pronunciation clear? Did you use correct intonation and word stress?',
  },
  {
    key: 'coherence',
    label: 'Coherence & Cohesion',
    description: 'Did you organize your answer well? Did you use linking words effectively?',
  },
  {
    key: 'taskAchievement',
    label: 'Task Achievement',
    description: 'Did you fully answer the question or address all points on the cue card?',
  },
]

interface SelfEvaluationProps {
  result: EvaluationResult
  onChange: (result: EvaluationResult) => void
}

function RatingSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-center text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
        {value}
      </span>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 dark:bg-slate-600"
        aria-label={label}
      />
      <div className="flex w-16 gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-sm"
            style={{
              backgroundColor: i < value ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function SelfEvaluation({ result, onChange }: SelfEvaluationProps) {
  const totalScore = Object.values(result).reduce((s, v) => s + v, 0)
  const averageScore = Math.round((totalScore / Object.keys(result).length) * 10) / 10
  const maxScore = 10

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

  function update(key: keyof EvaluationResult, value: number) {
    onChange({ ...result, [key]: Math.max(1, Math.min(10, value)) })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Self Evaluation</CardTitle>
          <span
            className="rounded-full px-3 py-1 text-sm font-bold"
            style={{
              color: getScoreColor(averageScore),
              backgroundColor: averageScore >= 7
                ? 'var(--color-success-light, #f0fdf4)'
                : averageScore >= 5
                  ? 'var(--color-warning-light, #fefce8)'
                  : 'var(--color-danger-light, #fef2f2)',
            }}
          >
            {averageScore.toFixed(1)} / {maxScore} &mdash; {getScoreLabel(averageScore)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {CRITERIA.map((criterion) => (
            <div key={criterion.key}>
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {criterion.label}
                  </span>
                  <span
                    className="ml-2 text-xs font-medium"
                    style={{ color: getScoreColor(result[criterion.key]) }}
                  >
                    ({getScoreLabel(result[criterion.key])})
                  </span>
                </div>
              </div>
              <p className="mb-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                {criterion.description}
              </p>
              <RatingSlider
                value={result[criterion.key]}
                onChange={(v) => update(criterion.key, v)}
                label={criterion.label}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

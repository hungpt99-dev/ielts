import type { ReviewRating } from '../../models'
import { RATING_BUTTONS } from './reviewService'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

interface SessionSummaryProps {
  ratings: Record<ReviewRating, number>
  totalTimeMs: number
  onRestart: () => void
  onBack: () => void
}

const COLORS: Record<ReviewRating, string> = {
  again: 'text-red-600 dark:text-red-400',
  hard: 'text-orange-600 dark:text-orange-400',
  good: 'text-blue-600 dark:text-blue-400',
  easy: 'text-green-600 dark:text-green-400',
}

export default function SessionSummary({ ratings, totalTimeMs, onRestart, onBack }: SessionSummaryProps) {
  const total = Object.values(ratings).reduce((s, v) => s + v, 0)
  const correct = (ratings.good ?? 0) + (ratings.easy ?? 0)
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const minutes = Math.round(totalTimeMs / 60000)
  const seconds = Math.round((totalTimeMs % 60000) / 1000)
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="text-center">
        <CardContent className="py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Review Complete
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You reviewed {total} words in {timeStr}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{accuracy}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{total - correct}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Review again</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Rating Breakdown</p>
          <div className="space-y-2">
            {RATING_BUTTONS.map(({ rating, label }) => {
              const count = ratings[rating] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className={`w-16 text-xs font-medium ${COLORS[rating]}`}>{label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        rating === 'again' ? 'bg-red-500' :
                        rating === 'hard' ? 'bg-orange-500' :
                        rating === 'good' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button onClick={onRestart}>
          Start New Review
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back to Vocabulary
        </Button>
      </div>
    </div>
  )
}

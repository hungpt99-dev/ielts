import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface PracticeAgainProps {
  onPracticeSame: () => void
  onSimilarQuestion: () => void
  onRandomQuestion: () => void
  onHarderDifficulty: () => void
  onEasierDifficulty: () => void
  onBackToBrowse: () => void
}

const OPTIONS = [
  {
    key: 'same',
    label: 'Practice Same Topic',
    description: 'Retry the same question to improve your score',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M8.25 4.5l-3.219 3.219" />
      </svg>
    ),
    action: 'onPracticeSame',
  },
  {
    key: 'similar',
    label: 'Similar Question',
    description: 'Get a different question on the same topic',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
    action: 'onSimilarQuestion',
  },
  {
    key: 'random',
    label: 'Random Question',
    description: 'Get surprised with a random question',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
    ),
    action: 'onRandomQuestion',
  },
  {
    key: 'harder',
    label: 'Harder Difficulty',
    description: 'Challenge yourself with a more difficult question',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    action: 'onHarderDifficulty',
  },
  {
    key: 'easier',
    label: 'Easier Difficulty',
    description: 'Build confidence with a simpler question',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
      </svg>
    ),
    action: 'onEasierDifficulty',
  },
]

export default function PracticeAgain({
  onPracticeSame,
  onSimilarQuestion,
  onRandomQuestion,
  onHarderDifficulty,
  onEasierDifficulty,
  onBackToBrowse,
}: PracticeAgainProps) {
  const handlers: Record<string, () => void> = {
    onPracticeSame,
    onSimilarQuestion,
    onRandomQuestion,
    onHarderDifficulty,
    onEasierDifficulty,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Again</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map(option => (
            <button
              key={option.key}
              onClick={handlers[option.action]}
              className="flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all hover:border-blue-300 hover:shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                {option.icon}
              </span>
              <div className="min-w-0">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {option.label}
                </span>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <Button variant="secondary" onClick={onBackToBrowse} fullWidth>
            Back to Question Bank
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

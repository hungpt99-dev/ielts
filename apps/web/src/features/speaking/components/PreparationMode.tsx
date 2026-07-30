import { useEffect, useRef, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

interface PreparationModeProps {
  onComplete: () => void
  topic: string
  notes: string
  onNotesChange: (notes: string) => void
  keywordChips: string[]
  onAddChip: (chip: string) => void
  onRemoveChip: (index: number) => void
}

const SPEAKING_TIPS = [
  'Speak clearly and at a natural pace',
  'Use a range of vocabulary and avoid repetition',
  'Structure your answer with an introduction, main points, and conclusion',
  'Use linking words to connect your ideas smoothly',
  'Provide specific examples to support your points',
  "Don't worry about small mistakes — focus on communicating your ideas",
]

export default function PreparationMode({
  onComplete,
  topic,
  notes,
  onNotesChange,
  keywordChips,
  onAddChip,
  onRemoveChip,
}: PreparationModeProps) {
  const [prepSeconds, setPrepSeconds] = useState(60)
  const [isRunning, setIsRunning] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chipInputRef = useRef<HTMLInputElement>(null)
  const [chipInput, setChipInput] = useState('')

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPrepSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setIsRunning(false)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [onComplete])

  const circumference = 2 * Math.PI * 54
  const progress = prepSeconds / 60
  const offset = circumference * (1 - progress)
  const isWarning = prepSeconds <= 10
  const keywords: string[] = []

  function skipPrep() {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    onComplete()
  }

  function handleAddChip() {
    const trimmed = chipInput.trim()
    if (trimmed) {
      onAddChip(trimmed)
      setChipInput('')
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Preparation Time</CardTitle>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{
              color: isWarning ? 'var(--color-danger)' : 'var(--color-primary)',
            }}
          >
            1:00
          </span>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="relative mb-4 flex h-32 w-32 items-center justify-center">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={isWarning ? 'var(--color-danger)' : 'var(--color-primary)'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{
                    color: isWarning ? 'var(--color-danger)' : 'var(--color-text)',
                  }}
                >
                  {prepSeconds}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  seconds
                </span>
              </div>
            </div>
            <p
              className="mb-4 text-center text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              {isWarning
                ? 'Get ready to speak!'
                : 'Use this time to organize your thoughts and plan your answer.'}
            </p>
            <Button variant="ghost" size="sm" onClick={skipPrep}>
              Skip & Start Speaking
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              rows={6}
              className="w-full rounded-xl border px-4 py-3 text-sm leading-relaxed transition-colors focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
              placeholder="Jot down key points you want to cover..."
              aria-label="Quick preparation notes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keyword Chips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={chipInputRef}
                  type="text"
                  value={chipInput}
                  onChange={e => setChipInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddChip()
                    }
                  }}
                  className="flex-1 rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  placeholder="Type a keyword and press Enter..."
                  aria-label="Add keyword chip"
                />
                <Button size="sm" onClick={handleAddChip} disabled={!chipInput.trim()}>
                  Add
                </Button>
              </div>

              {keywordChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywordChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {chip}
                      <button
                        onClick={() => onRemoveChip(i)}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] hover:opacity-70"
                        aria-label={`Remove ${chip}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p
                  className="mb-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Suggested Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.filter(k => !keywordChips.includes(k)).slice(0, 12).map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => onAddChip(kw)}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-blue-300 hover:text-blue-600"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-muted)',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Speaking Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {SPEAKING_TIPS.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg p-3 text-sm leading-relaxed"
                style={{ backgroundColor: 'var(--color-surface-alt)' }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { ModelAnswer } from '../types'

interface ModelAnswerProps {
  answers: ModelAnswer[]
}

export default function ModelAnswerView({ answers }: ModelAnswerProps) {
  const [activeBand, setActiveBand] = useState<6 | 7 | 8 | 9>(7)

  if (answers.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            No model answers available.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeAnswer = answers.find(a => a.band === activeBand) || answers[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--color-border)' }}>
            {([6, 7, 8, 9] as const).map(band => {
              const exists = answers.some(a => a.band === band)
              const isActive = activeBand === band
              return (
                <button
                  key={band}
                  onClick={() => exists && setActiveBand(band)}
                  disabled={!exists}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-white'
                      : exists
                        ? ''
                        : 'cursor-not-allowed opacity-40'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-muted)',
                  }}
                >
                  Band {band}
                  {!exists && <span className="ml-0.5">—</span>}
                </button>
              )
            })}
          </div>

          {activeAnswer && (
            <div className="space-y-4">
              <div
                className="rounded-lg border p-4 text-sm leading-relaxed"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                }}
              >
                {activeAnswer.content}
              </div>

              {activeAnswer.vocabulary.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Key Vocabulary
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAnswer.vocabulary.map((v, i) => (
                      <span
                        key={i}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeAnswer.grammar.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Grammar Structures
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAnswer.grammar.map((g, i) => (
                      <span
                        key={i}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: 'var(--color-success-light)',
                          color: 'var(--color-success)',
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeAnswer.expressions.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                    Useful Expressions
                  </p>
                  <ul className="space-y-1">
                    {activeAnswer.expressions.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

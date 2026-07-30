import type { SpeakingQuestion } from '../types'

interface QuestionCardProps {
  question: SpeakingQuestion
  compact?: boolean
}

function getPartLabel(part: 1 | 2 | 3): string {
  if (part === 1) return 'Part 1: Introduction & Interview'
  if (part === 2) return 'Part 2: Cue Card'
  return 'Part 3: Discussion'
}

function getPartColor(part: 1 | 2 | 3): string {
  if (part === 1) return 'var(--color-primary)'
  if (part === 2) return 'var(--color-success)'
  return 'var(--color-warning)'
}

function getPartBgColor(part: 1 | 2 | 3): string {
  if (part === 1) return 'var(--color-primary-light)'
  if (part === 2) return 'var(--color-success-light)'
  return 'var(--color-warning-light)'
}

function getPartTime(part: 1 | 2 | 3): string {
  if (part === 1) return '4-5 minutes'
  if (part === 2) return '3-4 minutes'
  return '4-5 minutes'
}

export default function QuestionCard({ question, compact = false }: QuestionCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-md">
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: getPartColor(question.part) }}
      />

      <div className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: getPartBgColor(question.part),
              color: getPartColor(question.part),
            }}
          >
            {getPartLabel(question.part)}
          </span>
          {question.difficulty && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: 'var(--color-surface-alt)',
                color: 'var(--color-muted)',
              }}
            >
              {question.difficulty}
            </span>
          )}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              color: 'var(--color-muted)',
            }}
          >
            ~{getPartTime(question.part)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          {question.topic}
        </h3>

        <p className="text-base font-medium leading-relaxed text-[var(--color-text)] sm:text-lg">
          {question.question}
        </p>

        {question.cueCard && (
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 sm:p-5">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: getPartColor(question.part) }}
            >
              You should say:
            </p>
            <ul className="space-y-2.5">
              {question.cueCard.points.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text)]"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: getPartBgColor(question.part),
                      color: getPartColor(question.part),
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {question.cueCard.followUp.length > 0 && (
              <div
                className="border-t border-[var(--color-border)] pt-3"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Follow-up Discussion
                </p>
                {question.cueCard.followUp.map((q, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-[var(--color-text-secondary)]"
                  >
                    • {q}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {!question.cueCard && question.part === 2 && (
          <p className="text-xs italic text-[var(--color-muted)]">
            Take one minute to prepare. You have up to two minutes to speak.
          </p>
        )}
      </div>
    </div>
  )
}

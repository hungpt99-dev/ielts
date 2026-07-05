import { useMemo } from 'react'
import { useStudyPlan } from '../hooks/useStudyPlan'
import type { GenerationStep } from '../types'

const STEP_LABELS: Record<GenerationStep, { label: string; icon: string }> = {
  'creating-strategy': { label: 'Creating strategy', icon: 'strategy' },
  'generating-chunk': { label: 'Generating days', icon: 'generate' },
  'validating-chunk': { label: 'Validating days', icon: 'validate' },
  'repairing-days': { label: 'Repairing days', icon: 'repair' },
  'finalizing': { label: 'Finalizing', icon: 'finalize' },
}

const STEP_ORDER: GenerationStep[] = [
  'creating-strategy',
  'generating-chunk',
  'validating-chunk',
  'repairing-days',
  'finalizing',
]

function StepIcon({ step, active }: { step: GenerationStep; active: boolean }) {
  const icon = STEP_LABELS[step].icon
  const paths: Record<string, JSX.Element> = {
    strategy: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
    generate: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    ),
    validate: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    repair: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    ),
    finalize: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    ),
  }

  return (
    <svg
      className={`h-5 w-5 shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {paths[icon]}
    </svg>
  )
}

function RecentMessages({ messages }: { messages: Array<{ message: string; timestamp: number }> }) {
  const recent = messages.slice(-5)

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[var(--color-text-secondary)]">Recent activity</p>
      <div className="max-h-24 space-y-0.5 overflow-y-auto">
        {recent.map((msg, idx) => (
          <p
            key={msg.timestamp + '-' + idx}
            className="truncate text-xs text-[var(--color-muted)]"
          >
            {msg.message}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function PlanGenerationProgress() {
  const { state } = useStudyPlan()
  const { isGenerating, currentProgress, progressMessages, generationState, error } = state

  const show = isGenerating || (currentProgress != null && generationState?.status === 'generating')

  if (!show) return null

  const progress = currentProgress
  const generated = progress?.generatedDays ?? 0
  const total = progress?.totalDays ?? 0
  const pct = total > 0 ? Math.round((generated / total) * 100) : 0
  const currentStep = progress?.step ?? 'creating-strategy'
  const currentStepIdx = STEP_ORDER.indexOf(currentStep)

  const latestMessage = progress?.message ?? progressMessages[progressMessages.length - 1]?.message ?? ''

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {latestMessage}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {generated}/{total} days
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {STEP_ORDER.map((step, idx) => {
          const isActive = idx === currentStepIdx && !(step === 'finalizing' && pct < 100)
          const isDone = idx < currentStepIdx || (step === 'finalizing' && pct >= 100)
          const isCurrent = isActive && !isDone

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isCurrent
                  ? 'bg-[var(--color-primary-light)]'
                  : isDone
                    ? 'opacity-60'
                    : 'opacity-40'
              }`}
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                {isDone ? (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <StepIcon step={step} active={isCurrent} />
                )}
                {isCurrent && (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? 'text-[var(--color-primary)]'
                    : isDone
                      ? 'text-[var(--color-text-secondary)]'
                      : 'text-[var(--color-muted)]'
                }`}
              >
                {STEP_LABELS[step].label}
              </span>
              {progress && step === 'generating-chunk' && progress.currentDayStart > 0 && (
                <span className="ml-auto text-[10px] text-[var(--color-muted)]">
                  Days {progress.currentDayStart}–{progress.currentDayEnd}
                </span>
              )}
              {step === 'validating-chunk' && progress && progress.currentDayStart > 0 && (
                <span className="ml-auto text-[10px] text-[var(--color-muted)]">
                  Days {progress.currentDayStart}–{progress.currentDayEnd}
                </span>
              )}
              {step === 'repairing-days' && progress && progress.currentDayStart > 0 && (
                <span className="ml-auto text-[10px] text-[var(--color-muted)]">
                  Days {progress.currentDayStart}–{progress.currentDayEnd}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <RecentMessages messages={progressMessages} />
    </div>
  )
}

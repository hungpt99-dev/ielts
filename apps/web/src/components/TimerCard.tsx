import type { TimerMode, TimerConfig, UseTimerReturn } from '../models/timer'
import { DEFAULT_TIMER_CONFIG } from '../models/timer'
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card'
import Button from './ui/Button'

interface TimerCardProps {
  timer: UseTimerReturn
  isPart2?: boolean
  config?: Partial<TimerConfig>
  className?: string
  recording?: boolean
  onStart?: () => void
  onPause?: () => void
  onReset?: () => void
}

function CircularDisplay({
  formatted,
  progress,
  warning,
}: {
  formatted: string
  progress: number
  warning: boolean
}) {
  const circumference = 2 * Math.PI * 42
  const offset =
    progress > 0 ? `${circumference * (1 - progress)}` : '0'

  return (
    <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-2xl font-bold tabular-nums"
        style={{
          color: warning ? 'var(--color-danger)' : 'var(--color-text)',
        }}
      >
        {formatted}
      </span>
    </div>
  )
}

export default function TimerCard({
  timer,
  isPart2 = false,
  config: configOverride,
  className = '',
  recording,
  onStart,
  onPause,
  onReset,
}: TimerCardProps) {
  const config: TimerConfig = { ...DEFAULT_TIMER_CONFIG, ...configOverride }

  function handleToggle() {
    if (timer.running) {
      timer.stop()
      onPause?.()
    } else {
      timer.start()
      onStart?.()
    }
  }

  function handleReset() {
    timer.reset()
    onReset?.()
  }

  const durationOptions = isPart2
    ? [
        ...config.part2DurationOptions.prep,
        ...config.part2DurationOptions.speaking,
      ]
    : config.durationOptions

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Timer</CardTitle>
        <div className="flex gap-2">
          <select
            value={timer.mode}
            onChange={(e) => timer.configure(e.target.value as TimerMode)}
            className="rounded-lg border px-2 py-1 text-xs"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
            aria-label="Timer mode"
          >
            <option value="stopwatch">Stopwatch</option>
            <option value="countdown">Countdown</option>
          </select>

          {timer.mode === 'countdown' && (
            <select
              value={timer.total}
              onChange={(e) => timer.setDuration(Number(e.target.value))}
              className="rounded-lg border px-2 py-1 text-xs"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
              aria-label="Countdown duration"
            >
              {durationOptions.map((sec) => (
                <option key={sec} value={sec}>
                  {isPart2 && sec === config.part2PrepSeconds
                    ? `Prep: ${sec / 60} min`
                    : `${sec / 60} min`}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center">
          <CircularDisplay
            formatted={timer.formatted}
            progress={timer.progress}
            warning={timer.isWarning}
          />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleToggle}
              variant={timer.running ? 'secondary' : 'primary'}
              size="sm"
            >
              {timer.running
                ? 'Pause'
                : recording
                  ? 'Resume'
                  : 'Start'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={timer.running}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

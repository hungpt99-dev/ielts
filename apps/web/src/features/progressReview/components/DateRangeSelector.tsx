import { useState, useCallback } from 'react'
import Button from '../../../components/ui/Button'

export type PresetRange = '7d' | '30d' | 'custom'

export interface DateRange {
  start: string
  end: string
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange, preset: PresetRange) => void
}

type PresetOption = { preset: PresetRange; label: string }

const PRESETS: PresetOption[] = [
  { preset: '7d', label: 'Last 7 Days' },
  { preset: '30d', label: 'Last 30 Days' },
  { preset: 'custom', label: 'Custom Range' },
]

function computeRange(preset: PresetRange): DateRange {
  const end = new Date()
  const start = new Date()
  if (preset === '7d') start.setDate(start.getDate() - 7)
  else if (preset === '30d') start.setDate(start.getDate() - 30)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<PresetRange>('7d')

  const handlePreset = useCallback(
    (preset: PresetRange) => {
      setActivePreset(preset)
      if (preset !== 'custom') {
        onChange(computeRange(preset), preset)
      }
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const currentIndex = PRESETS.findIndex(p => p.preset === activePreset)
      let nextIndex = currentIndex
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = (currentIndex + 1) % PRESETS.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        nextIndex = (currentIndex - 1 + PRESETS.length) % PRESETS.length
      } else {
        return
      }
      const next = PRESETS[nextIndex]
      setActivePreset(next.preset)
      if (next.preset !== 'custom') {
        onChange(computeRange(next.preset), next.preset)
      }
      const nextButton = document.querySelector<HTMLButtonElement>(
        `[data-preset="${next.preset}"]`,
      )
      nextButton?.focus()
    },
    [activePreset, onChange],
  )

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, start: e.target.value }, 'custom')
    },
    [onChange, value],
  )

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, end: e.target.value }, 'custom')
    },
    [onChange, value],
  )

  return (
    <div role="group" aria-label="Review period selector" className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
        Review Period
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preset date ranges">
        {PRESETS.map(({ preset, label }) => (
          <button
            key={preset}
            role="radio"
            aria-checked={activePreset === preset}
            data-preset={preset}
            onClick={() => handlePreset(preset)}
            onKeyDown={handleKeyDown}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 ${
              activePreset === preset
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {activePreset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="progress-review-start"
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Start Date
            </label>
            <input
              id="progress-review-start"
              type="date"
              value={value.start}
              onChange={handleStartChange}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
            />
          </div>
          <div>
            <label
              htmlFor="progress-review-end"
              className="mb-1 block text-xs font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              End Date
            </label>
            <input
              id="progress-review-end"
              type="date"
              value={value.end}
              onChange={handleEndChange}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
            />
          </div>
          <Button
            size="sm"
            onClick={() => onChange(computeRange('custom'), 'custom')}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}

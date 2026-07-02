import { useMemo } from 'react'
import type { TaskEntry } from '../../../models'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startDay = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []
  for (let i = 0; i < startDay; i++) currentWeek.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }
  return weeks
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return (
    now.getFullYear() === year &&
    now.getMonth() === month &&
    now.getDate() === day
  )
}

function datePassed(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day, 23, 59, 59)
  return d.getTime() < Date.now()
}

interface CalendarViewProps {
  tasks: TaskEntry[]
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (dateStr: string) => void
}

export default function CalendarView({
  tasks,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
}: CalendarViewProps) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month])

  const dayData = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const t of tasks) {
      const dateKey = t.date.slice(0, 10)
      const entry = map.get(dateKey) ?? { total: 0, done: 0 }
      entry.total++
      if (t.isDone) entry.done++
      map.set(dateKey, entry)
    }
    return map
  }, [tasks])

  function getDayClass(dateStr: string, day: number): string {
    const data = dayData.get(dateStr)
    const isTodayDate = isToday(year, month, day)
    const isPast = datePassed(year, month, day)

    let ring = ''

    if (isTodayDate) {
      ring = 'ring-2 ring-[var(--color-primary)]'
    }

    if (data) {
      if (data.total > 0 && data.done === data.total) {
        return `${ring} [background:var(--color-success-light)]`
      }
      if (isPast && data.done < data.total) {
        return `${ring} [background:var(--color-danger-light)]`
      }
      if (data.done > 0) {
        return `${ring} [background:var(--color-primary-light)]`
      }
    }

    return `${ring} hover:bg-[var(--color-surface-alt)]`
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Previous month"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={onNextMonth}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Next month"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={onToday}
          className="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
          }}
        >
          Today
        </button>
      </div>

      <div
        className="mb-2 grid grid-cols-7 gap-1"
        style={{ color: 'var(--color-muted)' }}
      >
        {DAY_NAMES.map(d => (
          <div key={d} className="py-1 text-center text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={`empty-${wi}-${di}`} />
              }
              const dateStr = toDateStr(year, month, day)
              const data = dayData.get(dateStr)
              const isTodayDate = isToday(year, month, day)
              const dayClass = getDayClass(dateStr, day)

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick(dateStr)}
                  className={`flex flex-col items-center rounded-lg py-1.5 text-xs transition-colors ${dayClass}`}
                  style={{
                    backgroundColor: dayClass.includes('var') ? undefined : undefined,
                    color: undefined,
                  }}
                  aria-label={`${dateStr}${data ? ` (${data.done}/${data.total})` : ''}`}
                >
                  <span
                    className={`leading-tight ${isTodayDate ? 'font-bold' : ''}`}
                    style={{ color: isTodayDate ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                  >
                    {day}
                  </span>
                  {data && (
                    <span className="mt-0.5 text-[9px] leading-tight" style={{ color: 'var(--color-muted)' }}>
                      {data.done}/{data.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

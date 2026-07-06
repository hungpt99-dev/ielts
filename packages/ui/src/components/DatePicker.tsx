import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '../icons/IconMap'

export type DatePickerSize = 'sm' | 'md' | 'lg'

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  label?: string
  placeholder?: string
  helperText?: string
  error?: string
  size?: DatePickerSize
  fullWidth?: boolean
  icon?: ReactNode
  locale?: string
  monthLabel?: string
  yearLabel?: string
}

const sizeStyle: Record<DatePickerSize, Record<string, string>> = {
  sm: {
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-md)',
  },
  md: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-lg)',
  },
  lg: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    fontSize: 'var(--text-base)',
    borderRadius: 'var(--radius-lg)',
  },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function isDateDisabled(date: Date, min?: Date, max?: Date, disabled?: Date[]): boolean {
  if (min && date < min) return true
  if (max && date > max) return true
  if (disabled) return disabled.some((d) => isSameDay(d, date))
  return false
}

function getMonthDays(year: number, month: number): { date: Date; day: number; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: { date: Date; day: number; isCurrentMonth: boolean }[] = []

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), day: i, isCurrentMonth: true })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, day: d.getDate(), isCurrentMonth: false })
  }

  return days
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates,
  label,
  placeholder = 'Select date',
  helperText,
  error,
  size = 'md',
  fullWidth = true,
  icon,
  locale: _locale = 'en',
  monthLabel,
  yearLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? new Date().getMonth())
  const [focusedDate, setFocusedDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const today = new Date()

  const selected = value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : null
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const days = getMonthDays(viewYear, viewMonth)

  const handleSelect = useCallback((date: Date) => {
    if (isDateDisabled(date, minDate, maxDate, disabledDates)) return
    onChange?.(date)
    setOpen(false)
    triggerRef.current?.focus()
  }, [onChange, minDate, maxDate, disabledDates])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }, [viewMonth])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(date)
    }
  }, [handleSelect])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const displayValue = value ? MONTH_LABELS[value.getMonth()] + ' ' + value.getDate() + ', ' + value.getFullYear() : ''

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          width: '100%',
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--weight-normal)',
          color: value ? 'var(--color-text)' : 'var(--color-muted)',
          background: 'var(--color-surface)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: sizeStyle[size].borderRadius,
          outline: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all var(--transition-fast)',
          boxSizing: 'border-box',
          lineHeight: 'var(--leading-normal)',
          ...sizeStyle[size],
        } as Record<string, string>}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-primary)'
          e.currentTarget.style.boxShadow = error
            ? '0 0 0 2px var(--color-danger-light)'
            : '0 0 0 2px var(--color-primary-light)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flex: 1 }}>
          {icon && (
            <span style={{ display: 'inline-flex', color: 'var(--color-muted)', fontSize: 'var(--text-base)' }}>
              {icon}
            </span>
          )}
          {displayValue || placeholder}
        </span>
        <IconChevronDown
          size={16}
          style={{
            color: 'var(--color-muted)',
            flexShrink: 0,
            transition: 'transform var(--transition-fast)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>
      {(helperText || error) && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: error ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {error || helperText}
        </span>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 'var(--z-index-dropdown)',
            marginTop: 'var(--spacing-2xs)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--spacing-md)',
            fontFamily: 'var(--font-sans)',
            minWidth: '280px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <button
              type="button"
              aria-label="Previous month"
              onClick={prevMonth}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-xl)',
                height: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: 'var(--text-base)',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              <IconChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {monthLabel || MONTH_LABELS[viewMonth]} {yearLabel || viewYear}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={nextMonth}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-xl)',
                height: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'none',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: 'var(--text-base)',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-alt)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              <IconChevronRight size={16} />
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 'var(--spacing-3xs)',
              textAlign: 'center',
            }}
          >
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  padding: 'var(--spacing-2xs) 0',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {day}
              </div>
            ))}
            {days.map(({ date, day, isCurrentMonth }) => {
              const disabled = isDateDisabled(date, minDate, maxDate, disabledDates)
              const isSelected = selected && isSameDay(date, selected)
              const isToday = isSameDay(date, todayNorm)
              const isFocused = focusedDate && isSameDay(date, focusedDate)

              return (
                <button
                  key={formatDate(date)}
                  type="button"
                  role="gridcell"
                  aria-selected={!!isSelected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  tabIndex={isCurrentMonth && !disabled ? 0 : -1}
                  onClick={() => handleSelect(date)}
                  onKeyDown={(e) => handleKeyDown(e, date)}
                  onFocus={() => setFocusedDate(date)}
                  style={{
                    padding: 'var(--spacing-xs)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isSelected ? 'var(--weight-bold)' : 'var(--weight-normal)',
                    color: disabled
                      ? 'var(--color-muted)'
                      : isSelected
                        ? 'var(--color-on-primary)'
                        : isToday
                          ? 'var(--color-primary)'
                          : isCurrentMonth
                            ? 'var(--color-text)'
                            : 'var(--color-muted)',
                    background: isSelected
                      ? 'var(--color-primary)'
                      : isFocused
                        ? 'var(--color-primary-light)'
                        : 'none',
                    border: isToday && !isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    lineHeight: 'var(--leading-tight)',
                    opacity: disabled ? '0.4' : isCurrentMonth ? '1' : '0.5',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.background = 'var(--color-primary-light)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.background = 'none'
                    }
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useCallback, useEffect } from 'react'
import type { TimerMode, TimerConfig } from '../models/timer'
import { DEFAULT_TIMER_CONFIG } from '../models/timer'

export interface UseTimerOptions {
  initialMode?: TimerMode
  initialDuration?: number
  onTimeUp?: () => void
  config?: Partial<TimerConfig>
}

export function useTimer({
  initialMode = 'stopwatch',
  initialDuration,
  onTimeUp,
  config: configOverride,
}: UseTimerOptions = {}) {
  const config: TimerConfig = { ...DEFAULT_TIMER_CONFIG, ...configOverride }

  const [seconds, setSeconds] = useState(initialDuration ?? 0)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<TimerMode>(initialMode)
  const [total, setTotal] = useState(initialDuration ?? config.defaultCountdown)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeUpRef = useRef(onTimeUp)
  const countdownTotalRef = useRef(total)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    countdownTotalRef.current = total
  }, [total])

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTick()
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'countdown') {
          if (prev <= 1) {
            clearTick()
            setRunning(false)
            onTimeUpRef.current?.()
            return 0
          }
          return prev - 1
        }
        return prev + 1
      })
    }, config.intervalMs)
  }, [clearTick, mode, config.intervalMs])

  const stop = useCallback(() => {
    clearTick()
    setRunning(false)
  }, [clearTick])

  const reset = useCallback(() => {
    clearTick()
    setRunning(false)
    if (mode === 'countdown') {
      setSeconds(countdownTotalRef.current)
    } else {
      setSeconds(0)
    }
  }, [clearTick, mode])

  const setDuration = useCallback(
    (newTotal: number) => {
      setTotal(newTotal)
      if (!running) {
        setSeconds(newTotal)
      }
    },
    [running],
  )

  const configure = useCallback(
    (newMode: TimerMode, newTotal?: number) => {
      clearTick()
      setRunning(false)
      setMode(newMode)
      if (newMode === 'countdown') {
        const duration = newTotal ?? config.defaultCountdown
        setTotal(duration)
        setSeconds(duration)
      } else {
        setTotal(0)
        setSeconds(0)
      }
    },
    [clearTick, config.defaultCountdown],
  )

  useEffect(() => {
    return () => clearTick()
  }, [clearTick])

  const formatted =
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  const progress =
    mode === 'countdown' && total > 0 ? seconds / total : 0

  const isWarning =
    mode === 'countdown' && seconds <= config.warningThreshold && running

  return {
    seconds,
    running,
    mode,
    total,
    formatted,
    progress,
    isWarning,
    start,
    stop,
    reset,
    configure,
    setDuration,
  } as const
}

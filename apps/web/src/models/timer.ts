export type TimerMode = 'countdown' | 'stopwatch'

export interface TimerConfig {
  defaultCountdown: number
  part2PrepSeconds: number
  part2SpeakingSeconds: number
  durationOptions: number[]
  part2DurationOptions: {
    prep: number[]
    speaking: number[]
  }
  intervalMs: number
  warningThreshold: number
}

export interface UseTimerReturn {
  seconds: number
  running: boolean
  mode: TimerMode
  total: number
  formatted: string
  progress: number
  isWarning: boolean
  start: () => void
  stop: () => void
  reset: () => void
  configure: (mode: TimerMode, total?: number) => void
  setDuration: (total: number) => void
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  defaultCountdown: 120,
  part2PrepSeconds: 60,
  part2SpeakingSeconds: 120,
  durationOptions: [60, 120, 180, 300],
  part2DurationOptions: {
    prep: [60],
    speaking: [120, 180, 300],
  },
  intervalMs: 1000,
  warningThreshold: 10,
}

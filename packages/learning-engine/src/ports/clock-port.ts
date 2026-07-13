export interface ClockPort {
  now(): Date
  toISOString(): string
  today(): string
}

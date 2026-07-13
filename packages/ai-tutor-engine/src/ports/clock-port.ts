export interface ClockPort {
  now(): Date
  toISOString(): string
}

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date()
  }
  toISOString(): string {
    return new Date().toISOString()
  }
}

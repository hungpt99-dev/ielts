export interface QuietHoursConfig {
  start: string
  end: string
}

export function isInQuietHours(
  config: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startH, startM] = config.start.split(':').map(Number)
  const [endH, endM] = config.end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

export function getQuietHoursRemainingMs(
  config: QuietHoursConfig,
  now: Date = new Date(),
): number {
  if (!isInQuietHours(config, now)) return 0

  const [endH, endM] = config.end.split(':').map(Number)
  const endMinutes = endH * 60 + endM
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const remainingMinutes = endMinutes - currentMinutes

  if (remainingMinutes < 0) {
    return (1440 - currentMinutes + endMinutes) * 60 * 1000
  }

  return remainingMinutes * 60 * 1000
}

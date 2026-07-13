import type { TutorContextItem, TutorContextSource } from '../domain/entities/learner-context'

export interface FreshnessResult {
  fresh: TutorContextItem<unknown>[]
  stale: TutorContextItem<unknown>[]
  missing: TutorContextSource[]
}

const FRESHNESS_THRESHOLDS: Record<string, number> = {
  'user-profile': 86_400_000,
  'study-roadmap': 300_000,
  'progress': 600_000,
  'mistakes': 300_000,
  'vocabulary': 600_000,
  'saved-content': 600_000,
  'tutor-history': 300_000,
  'environment': 60_000,
  'extension-page': 60_000,
}

export function evaluateFreshness(
  items: TutorContextItem<unknown>[],
  now: Date = new Date(),
): FreshnessResult {
  const fresh: TutorContextItem<unknown>[] = []
  const stale: TutorContextItem<unknown>[] = []

  for (const item of items) {
    const threshold = FRESHNESS_THRESHOLDS[item.source] ?? 300_000
    const age = now.getTime() - new Date(item.collectedAt).getTime()
    if (age > threshold) {
      stale.push(item)
    } else {
      fresh.push(item)
    }
  }

  return {
    fresh,
    stale,
    missing: [],
  }
}

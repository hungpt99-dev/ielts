import type { TutorContextScope, TutorContextItem, TutorContextSource } from '../domain/entities/learner-context'

export interface ScopeRequirements {
  required: TutorContextSource[]
  optional: TutorContextSource[]
  maxRecords: number
  freshnessMs: number
}

const SCOPE_REQUIREMENTS: Record<TutorContextScope, ScopeRequirements> = {
  chat: {
    required: ['user-profile', 'environment'],
    optional: ['tutor-history', 'progress', 'mistakes'],
    maxRecords: 50,
    freshnessMs: 300_000,
  },
  proactive: {
    required: ['user-profile', 'environment'],
    optional: ['progress', 'mistakes', 'vocabulary', 'study-roadmap'],
    maxRecords: 20,
    freshnessMs: 600_000,
  },
  'progress-review': {
    required: ['user-profile', 'progress'],
    optional: ['mistakes', 'vocabulary', 'study-roadmap', 'tutor-history'],
    maxRecords: 100,
    freshnessMs: 3_600_000,
  },
  roadmap: {
    required: ['study-roadmap', 'user-profile'],
    optional: ['progress', 'environment'],
    maxRecords: 30,
    freshnessMs: 300_000,
  },
  writing: {
    required: ['user-profile'],
    optional: ['mistakes', 'vocabulary', 'progress', 'tutor-history'],
    maxRecords: 40,
    freshnessMs: 300_000,
  },
  speaking: {
    required: ['user-profile'],
    optional: ['mistakes', 'vocabulary', 'tutor-history'],
    maxRecords: 40,
    freshnessMs: 300_000,
  },
  reading: {
    required: ['user-profile'],
    optional: ['vocabulary', 'progress', 'mistakes'],
    maxRecords: 30,
    freshnessMs: 300_000,
  },
  listening: {
    required: ['user-profile'],
    optional: ['vocabulary', 'progress', 'mistakes'],
    maxRecords: 30,
    freshnessMs: 300_000,
  },
  vocabulary: {
    required: ['user-profile', 'vocabulary'],
    optional: ['progress', 'mistakes'],
    maxRecords: 30,
    freshnessMs: 300_000,
  },
  'saved-content': {
    required: ['user-profile', 'saved-content'],
    optional: ['vocabulary'],
    maxRecords: 20,
    freshnessMs: 300_000,
  },
  reminder: {
    required: ['user-profile', 'environment'],
    optional: ['progress', 'study-roadmap'],
    maxRecords: 10,
    freshnessMs: 600_000,
  },
}

export function selectContextForScope(
  items: TutorContextItem<unknown>[],
  scope: TutorContextScope,
  now: Date = new Date(),
): { selected: TutorContextItem<unknown>[]; missing: TutorContextSource[] } {
  const reqs = SCOPE_REQUIREMENTS[scope]

  const bySource = new Map<TutorContextSource, TutorContextItem<unknown>>()
  for (const item of items) {
    const existing = bySource.get(item.source)
    if (!existing || new Date(item.collectedAt) > new Date(existing.collectedAt)) {
      bySource.set(item.source, item)
    }
  }

  const missing = reqs.required.filter(s => {
    const item = bySource.get(s)
    if (!item) return true
    const age = now.getTime() - new Date(item.collectedAt).getTime()
    if (age > reqs.freshnessMs) return true
    return false
  })

  const selected: TutorContextItem<unknown>[] = []
  for (const source of reqs.required) {
    const item = bySource.get(source)
    if (item) selected.push(item)
  }
  for (const source of reqs.optional) {
    const item = bySource.get(source)
    if (item) selected.push(item)
  }

  return {
    selected: selected.slice(0, reqs.maxRecords),
    missing,
  }
}

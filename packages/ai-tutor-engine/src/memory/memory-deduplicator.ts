import type { TutorWeakPointMemory, TutorMistakeMemory, TutorPreferenceMemory } from '../domain/entities/tutor-memory'

export class MemoryDeduplicator {
  isDuplicateWeakPoint(candidate: TutorWeakPointMemory, existing: TutorWeakPointMemory[]): boolean {
    return existing.some(e =>
      e.skill === candidate.skill &&
      e.description.toLowerCase() === candidate.description.toLowerCase() &&
      (Date.now() - new Date(e.lastObservedAt).getTime()) < 86_400_000,
    )
  }

  isDuplicateMistakePattern(candidate: TutorMistakeMemory, existing: TutorMistakeMemory[]): boolean {
    return existing.some(e =>
      e.skill === candidate.skill &&
      e.pattern.toLowerCase() === candidate.pattern.toLowerCase(),
    )
  }

  mergePreferences(
    existing: TutorPreferenceMemory[],
    incoming: TutorPreferenceMemory[],
  ): TutorPreferenceMemory[] {
    const merged = [...existing]
    for (const incomingPref of incoming) {
      const idx = merged.findIndex(e => e.key === incomingPref.key)
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...incomingPref, lastConfirmedAt: new Date().toISOString() }
      } else {
        merged.push(incomingPref)
      }
    }
    return merged
  }
}

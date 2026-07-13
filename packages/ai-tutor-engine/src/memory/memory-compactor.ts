import type { TutorMemory } from '../domain/entities/tutor-memory'

export class MemoryCompactor {
  compact(memory: TutorMemory): TutorMemory {
    return {
      ...memory,
      weakPoints: this.compactWeakPoints(memory.weakPoints),
      mistakePatterns: this.compactMistakePatterns(memory.mistakePatterns),
      openLearningLoops: this.compactOpenLoops(memory.openLearningLoops),
    }
  }

  private compactWeakPoints(weakPoints: TutorMemory['weakPoints']): TutorMemory['weakPoints'] {
    return weakPoints
      .filter(wp => {
        const daysSinceLastObserved = (Date.now() - new Date(wp.lastObservedAt).getTime()) / 86_400_000
        return daysSinceLastObserved <= 30
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
  }

  private compactMistakePatterns(patterns: TutorMemory['mistakePatterns']): TutorMemory['mistakePatterns'] {
    return patterns
      .filter(p => {
        const daysSinceLastDetected = (Date.now() - new Date(p.lastDetectedAt).getTime()) / 86_400_000
        return daysSinceLastDetected <= 30
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15)
  }

  private compactOpenLoops(loops: TutorMemory['openLearningLoops']): TutorMemory['openLearningLoops'] {
    return loops.map(loop => {
      const daysSinceLastActivity = (Date.now() - new Date(loop.lastActivityAt).getTime()) / 86_400_000
      if (daysSinceLastActivity > 7 && loop.status === 'active') {
        return { ...loop, status: 'stale' as const }
      }
      return loop
    })
  }
}

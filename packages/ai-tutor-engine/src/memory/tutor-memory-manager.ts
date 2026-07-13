import type { TutorMemory, UpdateTutorMemoryRequest, UpdateTutorMemoryResult, TutorWeakPointMemory, TutorMistakeMemory, TutorPreferenceMemory } from '../domain/entities/tutor-memory'
import type { TutorMemoryRepository } from '../ports/tutor-memory-repository'
import { MemoryDeduplicator } from './memory-deduplicator'
import { MemoryCompactor } from './memory-compactor'

export class TutorMemoryManager {
  private repository: TutorMemoryRepository
  private deduplicator: MemoryDeduplicator
  private compactor: MemoryCompactor

  constructor(repository: TutorMemoryRepository) {
    this.repository = repository
    this.deduplicator = new MemoryDeduplicator()
    this.compactor = new MemoryCompactor()
  }

  async getMemory(learnerId: string): Promise<TutorMemory | null> {
    return this.repository.get(learnerId)
  }

  async updateMemory(request: UpdateTutorMemoryRequest): Promise<UpdateTutorMemoryResult> {
    const existing = await this.repository.get(request.learnerId)
    const base = existing ?? this.createEmptyMemory(request.learnerId)
    const memory = { ...base }

    const updatedFields: string[] = []

    if (request.weakPoints) {
      for (const wp of request.weakPoints) {
        if (!this.deduplicator.isDuplicateWeakPoint(wp as TutorWeakPointMemory, memory.weakPoints)) {
          memory.weakPoints.push(wp as TutorWeakPointMemory)
          if (!updatedFields.includes('weakPoints')) updatedFields.push('weakPoints')
        }
      }
    }

    if (request.mistakePatterns) {
      for (const mp of request.mistakePatterns) {
        if (!this.deduplicator.isDuplicateMistakePattern(mp as TutorMistakeMemory, memory.mistakePatterns)) {
          memory.mistakePatterns.push(mp as TutorMistakeMemory)
          if (!updatedFields.includes('mistakePatterns')) updatedFields.push('mistakePatterns')
        }
      }
    }

    if (request.preferences) {
      memory.preferences = this.deduplicator.mergePreferences(
        memory.preferences,
        request.preferences as TutorPreferenceMemory[],
      )
      if (!updatedFields.includes('preferences')) updatedFields.push('preferences')
    }

    const compacted = this.compactor.compact(memory)
    compacted.updatedAt = new Date().toISOString()
    compacted.version++

    await this.repository.save(compacted)

    return { success: true, updatedFields }
  }

  private createEmptyMemory(learnerId: string): TutorMemory {
    return {
      learnerId,
      goals: [],
      preferences: [],
      weakPoints: [],
      mistakePatterns: [],
      successfulStrategies: [],
      openLearningLoops: [],
      recommendationHistory: [],
      updatedAt: new Date().toISOString(),
      version: 1,
    }
  }
}

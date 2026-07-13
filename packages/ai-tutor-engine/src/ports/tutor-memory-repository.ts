import type { TutorMemory } from '../domain/entities/tutor-memory'

export interface TutorMemoryRepository {
  get(learnerId: string): Promise<TutorMemory | null>
  save(memory: TutorMemory): Promise<void>
  delete(learnerId: string): Promise<void>
}

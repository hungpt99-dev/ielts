import type { MistakeEvidence } from '../domain/entities/mistake-evidence'

export interface MistakeRepository {
  save(mistake: MistakeEvidence): Promise<void>
  findRecent(skill?: string, limit?: number): Promise<MistakeEvidence[]>
  findByPattern(skill: string, pattern: string): Promise<MistakeEvidence[]>
  getRecurringPatterns(skill?: string): Promise<Array<{ pattern: string; skill: string; frequency: number }>>
}

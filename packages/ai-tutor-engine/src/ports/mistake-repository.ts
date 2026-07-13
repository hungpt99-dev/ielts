import type { MistakePattern } from '../domain/entities/learner-context'

export interface MistakeRepository {
  getRecentMistakes(limit?: number): Promise<Array<{
    skill: string
    category: string
    text: string
    createdAt: string
  }>>
  getRecurringPatterns(): Promise<MistakePattern[]>
}

import type { LearnerProfile } from '../domain/entities/learner-profile'

export interface LearnerProfileRepository {
  get(): Promise<LearnerProfile | null>
  update(profile: Partial<LearnerProfile>): Promise<void>
}

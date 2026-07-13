import type { LearningContext, BuildLearningContextRequest } from '../domain/entities/learning-context'

export interface LearnerContextPort {
  buildLearningContext(request: BuildLearningContextRequest): Promise<LearningContext>
}

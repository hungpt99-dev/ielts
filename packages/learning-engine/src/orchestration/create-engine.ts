import type { LearningEngine } from './learning-engine-facade'
import type { LearningEngineDependencies } from './engine-impl'
import { LearningEngineImpl } from './engine-impl'

export function createLearningEngine(deps: LearningEngineDependencies): LearningEngine {
  return new LearningEngineImpl(deps)
}

export type { LearningEngineDependencies }

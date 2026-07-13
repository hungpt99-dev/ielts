import type { AITutorEngine } from './ai-tutor-engine'
import type { AITutorEngineDependencies } from './engine-impl'
import { AITutorEngineImpl } from './engine-impl'

export function createAITutorEngine(deps: AITutorEngineDependencies): AITutorEngine {
  return new AITutorEngineImpl(deps)
}

export type { AITutorEngineDependencies }

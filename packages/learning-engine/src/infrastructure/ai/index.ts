import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { BuildLearningContextRequest } from '../../domain/entities/learning-context'
import type { LearningContext } from '../../domain/entities/learning-context'

export class OfflineTutorIntelligenceAdapter implements TutorIntelligencePort {
  async getLearnerContext(_request: BuildLearningContextRequest): Promise<LearningContext> {
    throw new Error('AI Tutor Engine is not connected')
  }

  async selectTeachingStrategy(_request: any) {
    return { strategy: 'explain', reason: 'Default offline strategy' }
  }

  async generateEducationalContent(_request: any) {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI is not available in offline mode', recoverable: true } }
  }

  async evaluateOpenResponse(_request: any) {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI is not available in offline mode', recoverable: true } }
  }

  async explainFeedback(_request: any) {
    return { explanation: 'Feedback explanation requires AI.', suggestions: [] }
  }

  async recordLearningOutcome(_outcome: any) {
    return { success: true }
  }
}

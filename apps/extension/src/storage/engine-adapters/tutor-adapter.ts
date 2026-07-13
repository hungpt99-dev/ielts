import type { TutorIntelligencePort } from '@ielts/learning-engine'

export const extensionTutorPort: TutorIntelligencePort = {
  async getLearnerContext() {
    return null as any
  },
  async selectTeachingStrategy() {
    return { strategy: 'explain', reason: 'default' }
  },
  async generateEducationalContent() {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI not available in extension offline mode', recoverable: true } }
  },
  async evaluateOpenResponse() {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI not available in extension offline mode', recoverable: true } }
  },
  async explainFeedback() {
    return { explanation: '', suggestions: [] }
  },
  async recordLearningOutcome() {
    return { success: true }
  },
}

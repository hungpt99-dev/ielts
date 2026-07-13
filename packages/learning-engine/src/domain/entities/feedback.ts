export interface LearningFeedback {
  id: string
  attemptId: string
  sessionId: string
  exerciseId: string
  overallFeedback: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  nextSteps: string[]
  generatedAt: string
}

export interface FeedbackExplanationRequest {
  attemptId: string
  sessionId: string
  feedbackSummary: string
}

export interface FeedbackExplanationResult {
  explanation: string
  suggestions: string[]
}

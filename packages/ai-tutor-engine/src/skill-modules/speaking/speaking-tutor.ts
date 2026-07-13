export type SpeakingPart = 1 | 2 | 3

export interface SpeakingReviewRequest {
  response: string
  part: SpeakingPart
  topic: string
  targetBand: number
  language?: string
}

export interface SpeakingFeedbackResult {
  estimatedBand: number
  fluencyAndCoherence: string
  lexicalResource: string
  grammaticalRangeAndAccuracy: string
  pronunciationNotes: string
  overallFeedback: string
  improvements: string[]
}

export interface SpeakingQuestionRequest {
  part: SpeakingPart
  topic?: string
  targetBand: number
  language?: string
}

export interface SpeakingQuestionResult {
  part: SpeakingPart
  topic: string
  question: string
  followUpQuestions: string[]
  cueCard?: string
  tips: string[]
}

export interface SpeakingTutorModule {
  reviewSpeaking(request: SpeakingReviewRequest): Promise<SpeakingFeedbackResult>

  /** @deprecated Use learning engine's `generateActivity()` via `@ielts/learning-engine` instead */
  generateQuestion(request: SpeakingQuestionRequest): Promise<SpeakingQuestionResult>
}

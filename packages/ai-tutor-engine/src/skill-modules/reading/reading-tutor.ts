export interface ReadingExplanationRequest {
  passage: string
  question?: string
  userAnswer?: string
  correctAnswer?: string
  language?: string
}

export interface ReadingExplanationResult {
  summary: string
  keyVocabulary: Array<{ word: string; definition: string; example: string }>
  questionStrategy?: string
  answerExplanation?: string
  tips: string[]
}

export interface ReadingComprehensionRequest {
  passage: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount?: number
}

export interface ReadingComprehensionResult {
  questions: Array<{
    type: string
    question: string
    options?: string[]
    answer: string
    explanation: string
  }>
}

export interface ReadingTutorModule {
  explainPassage(request: ReadingExplanationRequest): Promise<ReadingExplanationResult>

  /** @deprecated Use learning engine's `generateActivity()` via `@ielts/learning-engine` instead */
  generateComprehensionQuestions(request: ReadingComprehensionRequest): Promise<ReadingComprehensionResult>
}

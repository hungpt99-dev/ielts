export interface GrammarExplanationRequest {
  text: string
  error?: string
  language?: string
}

export interface GrammarExplanationResult {
  error: string
  category: string
  correction: string
  rule: string
  examples: string[]
  practiceSentence: string
}

export interface GrammarExerciseRequest {
  skill: string
  difficulty: 'easy' | 'medium' | 'hard'
  count?: number
  language?: string
}

export interface GrammarExerciseResult {
  exercises: Array<{
    type: 'error-correction' | 'fill-blank' | 'multiple-choice' | 'transformation'
    question: string
    options?: string[]
    answer: string
    explanation: string
  }>
}

export interface GrammarTutorModule {
  explainError(request: GrammarExplanationRequest): Promise<GrammarExplanationResult>
  generateExercises(request: GrammarExerciseRequest): Promise<GrammarExerciseResult>
}

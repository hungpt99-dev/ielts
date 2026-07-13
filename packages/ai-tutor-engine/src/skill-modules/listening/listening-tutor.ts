export interface ListeningExplanationRequest {
  transcript: string
  question?: string
  userAnswer?: string
  correctAnswer?: string
  language?: string
}

export interface ListeningExplanationResult {
  summary: string
  keyVocabulary: Array<{ word: string; definition: string; example: string }>
  distractorExplanation?: string
  tips: string[]
}

export interface ListeningExerciseRequest {
  transcript: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount?: number
}

export interface ListeningExerciseResult {
  questions: Array<{
    type: string
    question: string
    options?: string[]
    answer: string
    explanation: string
  }>
}

export interface ListeningTutorModule {
  explainTranscript(request: ListeningExplanationRequest): Promise<ListeningExplanationResult>
  generateExercises(request: ListeningExerciseRequest): Promise<ListeningExerciseResult>
}

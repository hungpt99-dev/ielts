export interface VocabularyExplanationRequest {
  word: string
  context?: string
  language?: string
}

export interface VocabularyExplanationResult {
  word: string
  meaning: string
  pronunciation: string
  partOfSpeech: string
  wordFamily: string[]
  collocations: string[]
  cefrLevel?: string
  ieltsUsage: string
  contextualExamples: string[]
  synonyms: string[]
  antonyms: string[]
}

export interface VocabularyExerciseRequest {
  words: string[]
  topic?: string
  count?: number
}

export interface VocabularyExerciseResult {
  exercises: Array<{
    type: 'fill-blank' | 'multiple-choice' | 'matching' | 'sentence-creation'
    question: string
    options?: string[]
    answer: string
    explanation: string
  }>
}

export interface VocabularyTutorModule {
  explainWord(request: VocabularyExplanationRequest): Promise<VocabularyExplanationResult>

}

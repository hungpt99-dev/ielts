import type { CefrLevel } from '../domain/constants'
import type { Word } from '../domain/entities'
import type {
  Collocation,
  CommonMistake,
  PartOfSpeech,
  UsageExample,
  WordFamilyMember,
} from '../domain/value-objects'

export interface WordEnrichment {
  wordId: string
  definition: string
  simplifiedMeaning: string
  pronunciation?: string
  partOfSpeech: PartOfSpeech
  cefrLevel?: CefrLevel
  ieltsRelevance?: 'low' | 'medium' | 'high'
  collocations: Collocation[]
  synonyms: string[]
  antonyms: string[]
  wordFamily: WordFamilyMember[]
  usageExamples: UsageExample[]
  commonMistakes: CommonMistake[]
  translation?: string
}

export interface PracticeExercise {
  id: string
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'spelling'
  prompt: string
  answer: string
  options?: string[]
  explanation?: string
}

export interface CoachingAdvice {
  wordId: string
  summary: string
  suggestions: string[]
  recommendedFocus: string
}

export interface AcademicAlternative {
  word: string
  partOfSpeech: PartOfSpeech
  formality: 'formal' | 'academic' | 'neutral'
  example: string
}

export interface QuizQuestion {
  id: string
  type: 'multiple-choice' | 'fill-in-blank' | 'matching'
  prompt: string
  options?: string[]
  answer: string
  explanation?: string
}

export interface TranslationResult {
  wordId: string
  targetLanguage: string
  translatedText: string
  alternatives: string[]
}

export interface TextAnalysisResult {
  recognizedWords: string[]
  unknownWords: string[]
  topic: string
  cefrLevel?: CefrLevel
}

export interface AIServicePort {
  enrichWord(word: Word): Promise<WordEnrichment>
  enrichWords(words: Word[]): Promise<WordEnrichment[]>
  getSimplifiedMeaning(word: Word): Promise<string>
  getCollocations(word: Word): Promise<Collocation[]>
  getUsageExamples(word: Word, count?: number): Promise<UsageExample[]>
  getCommonMistakes(word: Word): Promise<CommonMistake[]>
  generatePracticeExercises(word: Word, count?: number): Promise<PracticeExercise[]>
  generateQuiz(words: Word[], count?: number): Promise<QuizQuestion[]>
  getAcademicAlternatives(word: Word): Promise<AcademicAlternative[]>
  getCoachingAdvice(wordId: string): Promise<CoachingAdvice>
  translate(word: Word, targetLanguage: string): Promise<TranslationResult>
  analyzeText(text: string): Promise<TextAnalysisResult>
}

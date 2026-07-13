// Services
export {
  explain,
  generateVocabularyDetails,
  generateVocabularyFromTranscript,
  generateSummaryFromTranscript,
  generateListeningQuestions,
  generateShadowingScripts,
  generateDictionaryEntry,
  dictionaryCache,
} from './services'

// Prompts
export { AI_EXPLAIN_LABELS } from './prompts'
export type { AiExplainType } from './prompts'

// Prompt Registry
export { PromptRegistry, getDefaultPromptRegistry, setDefaultPromptRegistry, registerDefaultPrompts } from './prompts'
export type { RegisteredPrompt, PromptVersion } from './prompts'

// Exercise generation prompts (shared between classify.ts and learning-engine)
export {
  READING_QUESTIONS_SYSTEM_PROMPT,
  LISTENING_EXERCISE_SYSTEM_PROMPT,
  SPEAKING_PROMPTS_SYSTEM_PROMPT,
  WRITING_IDEAS_SYSTEM_PROMPT,
  GRAMMAR_EXERCISES_SYSTEM_PROMPT,
  MISTAKE_REVIEW_SYSTEM_PROMPT,
  VOCABULARY_EXTRACTION_SYSTEM_PROMPT,
  buildReadingQuestionsPrompt,
  buildListeningExercisePrompt,
  buildSpeakingPromptsPrompt,
  buildWritingIdeasPrompt,
  buildGrammarExercisesPrompt,
  buildMistakeReviewPrompt,
  buildVocabularyExtractionPrompt,
  buildReadingPassagePrompt,
  buildPracticeQuestionsPrompt,
  buildPracticeQuestionsSystemPrompt,
} from './prompts'

// Schema types and runtimes (used by extension and vocabulary enrichment)
export type {
  AiExplainResult,
  SimpleExplain,
  TranslateExplain,
  IeltsVocabResult,
  GrammarExplain,
  RewriteResult,
  ExampleSentencesResult,
  QuizResult,
  DictionaryEntry,
  VocabularyDetails,
  VocabularyQuiz,
} from './schemas'

export {
  vocabularyDetailsSchema,
  vocabularyQuizSchema,
  readingQuestionsSchema,
  listeningExerciseSchema,
  speakingPromptsSchema,
  writingIdeasSchema,
  grammarExercisesSchema,
  mistakeReviewSchema,
  vocabularyExtractionSchema,
} from './schemas'

export type {
  ReadingQuestions,
  ListeningExercise,
  SpeakingPrompts,
  WritingIdeas,
  GrammarExercises,
  MistakeReview,
  VocabularyExtraction,
} from './schemas'

// Client types
export type { ProviderConfig } from './client/types'

// Client
export { createAIClient, callAI } from './client'
export type { AIClient, AICallResult } from './client/types'

// Cache utilities
export { AiGenerateResultCache } from './utils'
export type { GenerateResultCacheOptions, GenerateResultCacheStats } from './utils'

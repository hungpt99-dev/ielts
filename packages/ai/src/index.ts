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

// Schema types (used by extension)
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
} from './schemas'

// Client types
export type { ProviderConfig } from './client/types'

// Client
export { createAIClient, callAI } from './client'
export type { AIClient, AICallResult } from './client/types'

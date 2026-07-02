// Services
export {
  explain,
  aiExplainCache,
  generateVocabularyDetails,
  generateVocabularyQuiz,
  generateArticleQuestions,
  generateVocabularyFromTranscript,
  generateSummaryFromTranscript,
  generateListeningQuestions,
  generateShadowingScripts,
  generateDictionaryEntry,
  dictionaryCache,
} from './services'

// Schemas
export {
  simpleExplainSchema,
  vietnameseExplainSchema,
  ieltsVocabSchema,
  grammarExplainSchema,
  rewriteSchema,
  exampleSentencesSchema,
  quizSchema,
  vocabularyDetailsSchema,
  vocabularyQuizSchema,
  articleQuestionSchema,
  transcriptVocabularySchema,
  transcriptSummarySchema,
  listeningQuestionSchema,
  shadowingScriptSchema,
  dictionaryEntrySchema,
} from './schemas'

// Schema types
export type {
  SimpleExplain,
  VietnameseExplain,
  IeltsVocabResult,
  GrammarExplain,
  RewriteResult,
  ExampleSentencesResult,
  QuizResult,
  AiExplainResult,
  VocabularyDetails,
  VocabularyQuiz,
  ArticleQuestion,
  ArticleQuestionSet,
  TranscriptVocabulary,
  TranscriptSummary,
  ListeningQuestions,
  ShadowingScripts,
  DictionaryEntry,
} from './schemas'

// Prompts
export { AI_EXPLAIN_LABELS, AI_EXPLAIN_ICONS, AI_EXPLAIN_PROMPTS } from './prompts'
export type { AiExplainType } from './prompts'

// Client types
export type { ProviderConfig } from './client/types'

// Client
export { createAIClient, callAI } from './client'
export type { AIClient, AICallResult } from './client/types'

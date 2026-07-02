export {
  simpleExplainSchema,
  vietnameseExplainSchema,
  ieltsVocabSchema,
  grammarExplainSchema,
  rewriteSchema,
  exampleSentencesSchema,
  quizSchema,
} from './explain'
export type {
  SimpleExplain,
  VietnameseExplain,
  IeltsVocabResult,
  GrammarExplain,
  RewriteResult,
  ExampleSentencesResult,
  QuizResult,
  AiExplainResult,
} from './explain'

export { vocabularyDetailsSchema, vocabularyQuizSchema } from './vocabulary'
export type { VocabularyDetails, VocabularyQuiz } from './vocabulary'

export { articleQuestionSchema } from './article'
export type { ArticleQuestion, ArticleQuestionSet } from './article'

export {
  transcriptVocabularySchema,
  transcriptSummarySchema,
  listeningQuestionSchema,
  shadowingScriptSchema,
} from './video'
export type {
  TranscriptVocabulary,
  TranscriptSummary,
  ListeningQuestions,
  ShadowingScripts,
} from './video'

export { dictionaryEntrySchema } from './dictionary'
export type { DictionaryEntry } from './dictionary'

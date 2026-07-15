export { AI_EXPLAIN_LABELS, AI_EXPLAIN_PROMPTS, buildExplainPrompt } from './explain'
export type { AiExplainType } from './explain'

export { buildVocabularyDetailsPrompt, buildVocabularyQuizPrompt, VOCABULARY_DETAILS_SYSTEM_PROMPT, VOCABULARY_QUIZ_SYSTEM_PROMPT } from './vocabulary'
export { buildArticleQuestionPrompt, ARTICLE_QUESTION_SYSTEM_PROMPT } from './article'
export {
  buildVocabularyFromTranscriptPrompt,
  buildSummaryFromTranscriptPrompt,
  buildListeningQuestionsPrompt,
  buildShadowingScriptsPrompt,
  TRANSCRIPT_VOCABULARY_SYSTEM_PROMPT,
  TRANSCRIPT_SUMMARY_SYSTEM_PROMPT,
  LISTENING_QUESTIONS_SYSTEM_PROMPT,
  SHADOWING_SCRIPTS_SYSTEM_PROMPT,
} from './video'
export { buildDictionaryEntryPrompt, DICTIONARY_ENTRY_SYSTEM_PROMPT } from './dictionary'
export type { PromptVersion } from './types'

// Prompt Registry
export { PromptRegistry, getDefaultPromptRegistry, setDefaultPromptRegistry } from './prompt-registry'
export type { RegisteredPrompt } from './prompt-registry'
export { registerDefaultPrompts } from './register-defaults'

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
  buildListeningPassagePrompt,
  buildPracticeQuestionsPrompt,
  buildPracticeQuestionsSystemPrompt,
} from './exercise-generation'

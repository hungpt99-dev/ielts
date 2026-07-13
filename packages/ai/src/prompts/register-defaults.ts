import { getDefaultPromptRegistry, type RegisteredPrompt } from './prompt-registry'
import {
  READING_QUESTIONS_SYSTEM_PROMPT,
  LISTENING_EXERCISE_SYSTEM_PROMPT,
  SPEAKING_PROMPTS_SYSTEM_PROMPT,
  WRITING_IDEAS_SYSTEM_PROMPT,
  GRAMMAR_EXERCISES_SYSTEM_PROMPT,
  MISTAKE_REVIEW_SYSTEM_PROMPT,
  VOCABULARY_EXTRACTION_SYSTEM_PROMPT,
} from './exercise-generation'
import { AI_EXPLAIN_LABELS, SYSTEM_PROMPTS as EXPLAIN_SYSTEM_PROMPTS } from './explain'
import type { AiExplainType } from './explain'
import {
  VOCABULARY_DETAILS_SYSTEM_PROMPT,
  VOCABULARY_QUIZ_SYSTEM_PROMPT,
} from './vocabulary'
import {
  ARTICLE_QUESTION_SYSTEM_PROMPT,
} from './article'
import {
  TRANSCRIPT_VOCABULARY_SYSTEM_PROMPT,
  TRANSCRIPT_SUMMARY_SYSTEM_PROMPT,
  LISTENING_QUESTIONS_SYSTEM_PROMPT,
  SHADOWING_SCRIPTS_SYSTEM_PROMPT,
} from './video'
import {
  DICTIONARY_ENTRY_SYSTEM_PROMPT,
} from './dictionary'

const V1 = 1

const SYSTEM_PROMPT_ENTRIES: Array<Pick<RegisteredPrompt, 'id' | 'systemPrompt'> & { description: string }> = [
  { id: 'reading-questions', systemPrompt: READING_QUESTIONS_SYSTEM_PROMPT, description: 'Generate IELTS reading comprehension questions from passage content' },
  { id: 'listening-exercise', systemPrompt: LISTENING_EXERCISE_SYSTEM_PROMPT, description: 'Generate IELTS listening gap-fill exercises from transcript' },
  { id: 'speaking-prompts', systemPrompt: SPEAKING_PROMPTS_SYSTEM_PROMPT, description: 'Generate IELTS speaking prompts (Parts 1-3)' },
  { id: 'writing-ideas', systemPrompt: WRITING_IDEAS_SYSTEM_PROMPT, description: 'Generate IELTS writing task ideas' },
  { id: 'grammar-exercises', systemPrompt: GRAMMAR_EXERCISES_SYSTEM_PROMPT, description: 'Generate IELTS grammar error-correction exercises' },
  { id: 'mistake-review', systemPrompt: MISTAKE_REVIEW_SYSTEM_PROMPT, description: 'Generate IELTS mistake review tasks from user errors' },
  { id: 'vocabulary-extraction', systemPrompt: VOCABULARY_EXTRACTION_SYSTEM_PROMPT, description: 'Extract IELTS-level vocabulary with definitions from content' },
  { id: 'vocabulary-details', systemPrompt: VOCABULARY_DETAILS_SYSTEM_PROMPT, description: 'Generate detailed vocabulary explanations with examples' },
  { id: 'vocabulary-quiz', systemPrompt: VOCABULARY_QUIZ_SYSTEM_PROMPT, description: 'Generate vocabulary quiz questions' },
  { id: 'article-questions', systemPrompt: ARTICLE_QUESTION_SYSTEM_PROMPT, description: 'Generate comprehension questions from article content' },
  { id: 'transcript-vocabulary', systemPrompt: TRANSCRIPT_VOCABULARY_SYSTEM_PROMPT, description: 'Extract vocabulary from YouTube transcript' },
  { id: 'transcript-summary', systemPrompt: TRANSCRIPT_SUMMARY_SYSTEM_PROMPT, description: 'Generate summary from YouTube transcript' },
  { id: 'listening-questions', systemPrompt: LISTENING_QUESTIONS_SYSTEM_PROMPT, description: 'Generate listening comprehension questions from transcript' },
  { id: 'shadowing-scripts', systemPrompt: SHADOWING_SCRIPTS_SYSTEM_PROMPT, description: 'Generate shadowing practice scripts from transcript' },
  { id: 'dictionary-entry', systemPrompt: DICTIONARY_ENTRY_SYSTEM_PROMPT, description: 'Generate dictionary-style entry for vocabulary word' },
]

const explainTypes: AiExplainType[] = ['simple', 'translate', 'ielts-vocab', 'grammar', 'rewrite', 'example-sentences', 'quiz']
for (const label of explainTypes) {
  SYSTEM_PROMPT_ENTRIES.push({
    id: `explain-${label}`,
    systemPrompt: EXPLAIN_SYSTEM_PROMPTS[label],
    description: AI_EXPLAIN_LABELS[label],
  })
}

export function registerDefaultPrompts(registry = getDefaultPromptRegistry()): void {
  for (const entry of SYSTEM_PROMPT_ENTRIES) {
    registry.register({
      id: entry.id,
      version: V1,
      description: entry.description,
      systemPrompt: entry.systemPrompt,
    })
  }
}

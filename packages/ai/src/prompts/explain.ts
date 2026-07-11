import type { PromptVersion } from './types'

export type AiExplainType =
  | 'simple'
  | 'translate'
  | 'ielts-vocab'
  | 'grammar'
  | 'rewrite'
  | 'example-sentences'
  | 'quiz'

export const AI_EXPLAIN_LABELS: Record<AiExplainType, string> = {
  simple: 'Simple English',
  translate: 'Translation',
  'ielts-vocab': 'IELTS Vocabulary',
  grammar: 'Grammar Explanation',
  rewrite: 'Natural Rewrite',
  'example-sentences': 'Example Sentences',
  quiz: 'Quiz Questions',
}

export const AI_EXPLAIN_ICONS: Record<AiExplainType, string> = {
  simple: '💡',
  translate: '🌐',
  'ielts-vocab': '🎯',
  grammar: '📚',
  rewrite: '✂️',
  'example-sentences': '📝',
  quiz: '❓',
}

const EXPLAIN_PROMPT_VERSION: PromptVersion = { version: 1, description: 'Initial explain prompts' }

export const AI_EXPLAIN_PROMPTS: Record<AiExplainType, string> = {
  simple: 'Explain this text in simple English that an IELTS learner can easily understand:',
  translate: 'Translate this text and explain any difficult English words:',
  'ielts-vocab': 'Analyze this text and extract IELTS-level vocabulary with meanings and examples:',
  grammar: 'Explain the grammar structures in this text, including rules and common mistakes:',
  rewrite: 'Rewrite this text in more natural English while keeping the same meaning:',
  'example-sentences': 'Create 3-5 example sentences using similar vocabulary and grammar from this text:',
  quiz: 'Create 3 quiz questions based on this text to test understanding:',
}

const SYSTEM_PROMPTS: Record<AiExplainType, string> = {
  simple: 'You are an IELTS tutor. Explain text in simple English for learners. Respond with valid JSON only.',
  translate: 'You are an IELTS tutor. Translate the text and add vocabulary notes. Respond with valid JSON only.',
  'ielts-vocab': 'You are an IELTS vocabulary expert. Extract vocabulary and provide details. Respond with valid JSON only.',
  grammar: 'You are an IELTS grammar expert. Analyze grammar structures. Respond with valid JSON only.',
  rewrite: 'You are an IELTS writing tutor. Rewrite text naturally. Respond with valid JSON only.',
  'example-sentences': 'You are an IELTS teacher. Create example sentences. Respond with valid JSON only.',
  quiz: 'You are an IELTS examiner. Create quiz questions. Respond with valid JSON only.',
}

const JSON_SCHEMAS: Record<AiExplainType, string> = {
  simple: '{"explanation": "simple explanation of the text"}',
  translate: '{"translation": "translation in the user\'s language", "vocabularyNotes": [{"word": "word", "meaning": "meaning"}]}',
  'ielts-vocab': '{"words": [{"word": "word", "meaning": "meaning", "partOfSpeech": "noun", "example": "example sentence", "synonyms": ["syn1"], "collocations": ["coll1"]}]}',
  grammar: '{"explanation": "grammar explanation", "structure": "grammar structure", "rules": ["rule1"], "commonMistakes": ["mistake1"]}',
  rewrite: '{"rewritten": "rewritten text", "changes": "what was changed", "tone": "formal/casual"}',
  'example-sentences': '{"sentences": ["sentence1"], "explanation": "notes about the sentences"}',
  quiz: '{"questions": [{"question": "question text", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "why this is correct"}]}',
}

export function buildExplainPrompt(
  type: AiExplainType,
  text: string,
): { systemPrompt: string; userPrompt: string } {
  const userPrompt = `${AI_EXPLAIN_PROMPTS[type]}\n\n"${text}"\n\nRespond with valid JSON in this exact format:\n${JSON_SCHEMAS[type]}`
  return {
    systemPrompt: SYSTEM_PROMPTS[type],
    userPrompt,
  }
}

export function getVersionInfo(): PromptVersion {
  return EXPLAIN_PROMPT_VERSION
}

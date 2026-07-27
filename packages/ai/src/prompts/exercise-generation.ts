// ─── Reading Questions ──────────────────────────────────────────────────
export const READING_QUESTIONS_SYSTEM_PROMPT =
  'You are an IELTS reading examiner. Create reading questions. Return JSON: { "questions": [{ "question": string, "type": string, "options"?: string[], "answer": string, "explanation": string }] }'

export function buildReadingQuestionsPrompt(title: string, content: string, count: number): string {
  return `Title: ${title}\n\nContent:\n${content}\n\nCreate ${count} IELTS reading questions.`
}

// ─── Listening Gap-fill ─────────────────────────────────────────────────
export const LISTENING_EXERCISE_SYSTEM_PROMPT =
  'You are an IELTS listening examiner. Return JSON: { "gaps": [{ "sentence": string, "answer": string, "hint": string }] }'

export function buildListeningExercisePrompt(content: string): string {
  return `Create a listening gap-fill exercise from:\n\n${content}`
}

// ─── Speaking Prompts ───────────────────────────────────────────────────
export const SPEAKING_PROMPTS_SYSTEM_PROMPT =
  'You are an IELTS speaking examiner. Return JSON: { "prompts": [{ "part": 1|2|3, "question": string, "followUp"?: string }] }'

export function buildSpeakingPromptsPrompt(content: string): string {
  return `Create IELTS speaking prompts based on:\n\n${content}`
}

// ─── Writing Ideas ──────────────────────────────────────────────────────
export const WRITING_IDEAS_SYSTEM_PROMPT =
  'You are an IELTS writing examiner. Return JSON: { "ideas": [{ "task": 1|2, "prompt": string, "instruction": string }] }'

export function buildWritingIdeasPrompt(content: string): string {
  return `Create IELTS writing task ideas based on:\n\n${content}`
}

// ─── Grammar Exercises ──────────────────────────────────────────────────
export const GRAMMAR_EXERCISES_SYSTEM_PROMPT =
  'You are an IELTS grammar expert. Return JSON: { "exercises": [{ "sentence": string, "error": string, "correction": string, "explanation": string }] }'

export function buildGrammarExercisesPrompt(content: string): string {
  return `Create grammar exercises based on:\n\n${content}`
}

// ─── Mistake Review Tasks ───────────────────────────────────────────────
export const MISTAKE_REVIEW_SYSTEM_PROMPT =
  'You are an IELTS tutor. Return JSON: { "tasks": [{ "type": string, "question": string, "answer": string, "explanation": string }] }'

export function buildMistakeReviewPrompt(content: string): string {
  return `Create mistake review tasks based on:\n\n${content}`
}

// ─── Vocabulary Extraction ──────────────────────────────────────────────
export const VOCABULARY_EXTRACTION_SYSTEM_PROMPT =
  'You are an IELTS vocabulary expert. Extract IELTS-level vocabulary from the given content.\nReturn JSON: { "words": [{ "word": string, "meaning": string, "partOfSpeech": string, "example": string, "synonyms": string[], "collocations": string[] }] }'

export function buildVocabularyExtractionPrompt(content: string): string {
  return `Extract IELTS vocabulary from this content:\n\n${content}`
}

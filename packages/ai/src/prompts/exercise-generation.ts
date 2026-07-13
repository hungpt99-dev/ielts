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

// ─── Learning Engine AI Tier Prompts ────────────────────────────────────
export function buildReadingPassagePrompt(difficulty: string, questionCount: number, topic?: string): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS reading tutor. Generate a complete IELTS reading passage with ${Math.max(questionCount, 3)} questions at ${difficulty} difficulty.

Return ONLY valid JSON in this exact format, no other text:
{
  "title": "passage title",
  "passage": "the reading passage content (200-400 words)",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "why this answer is correct"
    }
  ]
}`,
    userMessage: `Generate an IELTS reading passage about "${topic || 'a general topic'}" at ${difficulty} difficulty. Include a passage title, a reading passage of 200-400 words, and ${Math.max(questionCount, 3)} mixed question types (multiple-choice, true-false-not-given, gap-fill).`,
  }
}

export function buildPracticeQuestionsPrompt(skill: string, activityType: string, questionCount: number, _difficulty: string): string {
  return `Generate ${questionCount} ${activityType} questions for ${skill} practice.`
}

export function buildPracticeQuestionsSystemPrompt(skill: string, activityType: string, questionCount: number, difficulty: string): string {
  return `You are an IELTS ${skill} tutor. Generate ${questionCount} ${activityType} questions at ${difficulty} difficulty.

Return ONLY valid JSON in this exact format, no other text:
{
  "title": "exercise title",
  "questions": [
    {
      "question": "question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "why this answer is correct"
    }
  ]
}`
}

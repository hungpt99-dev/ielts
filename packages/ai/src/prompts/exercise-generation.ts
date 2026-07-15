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

export function buildListeningPassagePrompt(difficulty: string, questionCount: number, topic: string): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS listening tutor. Generate a complete IELTS listening exercise about "${topic}" with a transcript and ${questionCount} questions at ${difficulty} difficulty. The title, transcript, AND questions must ALL be directly about "${topic}".

Return ONLY valid JSON in this exact format, no other text:
{
  "title": "exercise title related to ${topic}",
  "transcript": "the listening transcript (150-250 words) about ${topic}",
  "questions": [
    {
      "type": "multiple-choice" | "gap-fill",
      "question": "question text about ${topic} (use ______ for blanks in gap-fill)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "blanks": ["answer1"],
      "explanation": "why this answer is correct"
    }
  ]
}`,
    userMessage: `Generate an IELTS listening exercise about "${topic}" at ${difficulty} difficulty. The title must be about "${topic}". The listening transcript of 150-250 words must be directly about "${topic}". The ${questionCount} questions must be based on the transcript content and also about "${topic}". Every part of the response must be about "${topic}".`,
  }
}

export function buildPracticeQuestionsPrompt(skill: string, activityType: string, questionCount: number, _difficulty: string, topic?: string): string {
  const topicClause = topic ? ` on the topic of "${topic}"` : ''
  return `Generate ${questionCount} ${activityType} questions for ${skill} practice${topicClause}.`
}

export function buildPracticeQuestionsSystemPrompt(skill: string, activityType: string, questionCount: number, difficulty: string, topic?: string): string {
  const topicClause = topic ? ` about "${topic}"` : ''
  return `You are an IELTS ${skill} tutor. Generate ${questionCount} ${activityType} questions at ${difficulty} difficulty${topicClause}.

Return ONLY valid JSON in this exact format, no other text:
{
  "title": "exercise title",
  "questions": [
    {
      "type": "multiple-choice" | "true-false-not-given" | "gap-fill",
      "question": "question text (use ______ for blanks in gap-fill)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "blanks": ["answer1", "answer2"],
      "explanation": "why this answer is correct"
    }
  ]
}
- For gap-fill type: set "options" to [], set "blanks" to the list of correct words for each blank, use ______ in the question text for each blank position
- For multiple-choice and true-false-not-given: leave "blanks" as an empty array`
}

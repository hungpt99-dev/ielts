// ─── Reading Questions ──────────────────────────────────────────────────
export const READING_QUESTIONS_SYSTEM_PROMPT =
  'You are an IELTS reading examiner. Create reading questions. Return JSON: { "questions": [{ "question": string, "type": string, "options"?: string[], "answer": string, "explanation": string }] }'

export function buildReadingQuestionsPrompt(title: string, content: string, count: number): string {
  return `Title: ${title}\n\nContent:\n${content}\n\nCreate ${count} IELTS reading questions.`
}

// ─── Listening — Stage-specific Prompts ────────────────────────────────
// Each prompt targets a specific phase of the generation pipeline.

export const LISTENING_SCENARIO_SYSTEM_PROMPT = `You are an IELTS listening test designer. Design realistic conversation scenarios.
Return JSON: { "topic": string, "setting": string, "speakers": [{ "name": string, "role": string, "accent": string, "gender": string }], "exchangeType": string }

Rules:
- Part 1: Everyday social conversation (booking, registration, enquiry). 2 speakers.
- Part 2: Social monologue (tour, announcement, orientation). 1 speaker.
- Part 3: Educational conversation. 2-3 speakers with interruptions and discussion.
- Part 4: Academic monologue. 1 speaker, formal structured lecture.
- Topics must be realistic IELTS topics: travel, education, work, accommodation, health, environment, culture.
- Exchange type must match the part.`

export function buildListeningScenarioPrompt(topic: string, part: number, band: number): string {
  return `Design an IELTS Listening Part ${part} scenario.
Topic area: ${topic}
Target band: ${band}

Return a realistic conversation scenario with setting and speaker profiles.`
}

export const LISTENING_TRANSCRIPT_SYSTEM_PROMPT = `You are a scriptwriter for IELTS listening tests. Write natural English conversations.
Return JSON: { "lines": [{ "speaker": string, "text": string, "isCorrection"?: boolean, "isDistractor"?: boolean }] }

Rules:
- Write conversational English, not written English.
- Include natural features: fillers ("well", "um", "actually"), corrections, hesitations where appropriate.
- Parts 1-2: Clear, straightforward language. Parts 3-4: More complex vocabulary and sentence structures.
- Every piece of factual information must be clearly stated after any correction.
- Distractors (wrong information) must be clearly corrected by a subsequent line.
- Numbers, names, dates, and prices should be spelled out naturally.
- The conversation should flow naturally with greetings, information exchange, and closing.`

export function buildListeningTranscriptPrompt(scenario: object, entities: object[]): string {
  return `Write a natural English conversation transcript for this IELTS listening scenario.

Scenario: ${JSON.stringify(scenario)}

The conversation should include these information items (some may have distractors that get corrected):
${entities.map((e: any, i: number) => `  ${i + 1}. ${e.category}: final answer is "${e.value}"${e.distractor ? ` — include distractor "${e.distractor.wrongValue}" then correct it` : ''}`).join('\n')}

Write the full conversation with natural turn-taking, greetings, information exchange, and closing.
After any distractor, include a clear correction so the listener knows which is the final answer.`
}

export const LISTENING_QUESTION_SYSTEM_PROMPT = `You are an IELTS listening test writer. Create questions that test listening comprehension.
Return JSON: { "layout": string, "presentation": object, "questions": object[], "instructions": string }

Rules:
- Questions must be answerable from the transcript AFTER any corrections.
- Do NOT copy transcript sentences verbatim as question prompts.
- Use IELTS layout types: "form-completion", "note-completion", "table-completion".
- Form completion: Include form title, section headers, and labeled fields each with a blank.
- Note completion: Include heading, bullet points with blanks.
- Table completion: Include column headers and rows with blanks.
- Instructions must include word limit (e.g. "Write NO MORE THAN TWO WORDS AND/OR A NUMBER").
- Question order must follow transcript order.
- Each answer must be clearly identifiable in the transcript.`

export function buildListeningQuestionPrompt(
  transcript: string,
  layout: string,
  entityCount: number,
): string {
  return `Create ${entityCount} IELTS listening questions from this transcript.

Transcript:
${transcript}

Use the "${layout}" layout style.
Return the questions with proper IELTS formatting including instructions with word limits.`
}

export const LISTENING_VALIDATION_SYSTEM_PROMPT = `You are an IELTS test validator. Verify the quality and correctness of listening exercises.
Return JSON: { "valid": boolean, "errors": string[], "warnings": string[] }

Check:
- Every answer can be found in the transcript.
- After any correction, the final answer is the corrected version.
- No duplicate answers unless intentionally testing multiple items.
- Question order follows transcript order.
- Every required fact appears in the transcript.
- Answer word lengths are appropriate for the word limit.`

export function buildListeningValidationPrompt(
  transcript: string,
  questions: object[],
): string {
  return `Validate these IELTS listening questions against the transcript.

Transcript:
${transcript}

Questions and answers:
${JSON.stringify(questions)}

Verify: answers exist in transcript, corrections are handled, questions follow audio order, no duplicates.`
}

export const LISTENING_QUALITY_SYSTEM_PROMPT = `You are an IELTS quality assurance specialist. Score listening exercises on authenticity.
Return JSON: { "totalScore": number, "dimensions": { "naturalness": number, "authenticity": number, "difficultyFit": number, "distractorQuality": number }, "issues": string[] }

Evaluate:
- Naturalness: Does the conversation sound natural? Fillers, corrections, hesitations.
- Authenticity: Does it resemble real Cambridge IELTS tests?
- Difficulty fit: Does the vocabulary and structure match the target band?
- Distractor quality: Are distractors realistic and clearly corrected?
Score each dimension 0-100. Total score is weighted average.`

export function buildListeningQualityPrompt(exercise: object): string {
  return `Score the quality of this IELTS listening exercise.

Exercise: ${JSON.stringify(exercise)}

Evaluate naturalness, authenticity, difficulty fit, and distractor quality.
Return a total score (0-100) and dimension breakdown with specific issues.`
}

// ─── Backward-compatible prompt (kept for existing flows) ──────────────
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

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

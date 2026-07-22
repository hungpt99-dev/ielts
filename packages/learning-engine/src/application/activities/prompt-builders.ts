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

export function buildListeningPassagePrompt(
  difficulty: string,
  questionCount: number,
  topic: string,
  part: number = 1,
): { systemPrompt: string; userMessage: string } {
  const partDescriptions: Record<number, string> = {
    1: 'Part 1: Conversation between two speakers in an everyday social context (e.g., booking, inquiry, arrangement). 2 speakers. Include specific details: names, dates, prices, addresses, phone numbers.',
    2: 'Part 2: ONE speaker giving information in an everyday social context (e.g., guided tour, public announcement, facility description). 1 speaker (monologue). Use natural spoken signposting.',
    3: 'Part 3: Conversation between 2-3 speakers in an educational or training context (e.g., students discussing a project with a tutor). Include discussion, evaluation, disagreement and decision-making.',
    4: 'Part 4: ONE speaker giving an academic lecture or presentation. 1 speaker (monologue). Include clear academic signposting: "firstly", "turning now to", "in contrast". Connected topic development.',
  }

  const speakerRules: Record<number, string> = {
    1: 'Exactly 2 speakers with natural turn-taking, clarifications, and brief overlaps. Use distinct speaker names.',
    2: 'Exactly 1 speaker. Use natural spoken signposting: "Let me tell you about...", "The next point is...", "Moving on to...".',
    3: '2-3 speakers. Include discussion patterns: one speaker proposes, another disagrees, they reach agreement. Use speaker names.',
    4: 'Exactly 1 speaker. Academic lecture style. Use signposting: "To begin with...", "Another important factor...", "In conclusion...".',
  }

  return {
    systemPrompt: `You are an IELTS listening task creator. Generate a complete IELTS Listening ${partDescriptions[part] || partDescriptions[1]} at ${difficulty} difficulty.

SPEAKER REQUIREMENTS: ${speakerRules[part] || speakerRules[1]}

CRITICAL RULES:
1. Generate ORIGINAL content — do NOT copy existing IELTS materials
2. Transcript MUST be a REALISTIC SPOKEN SCRIPT with speaker turns, natural language, corrections, clarifications
3. Do NOT write essay-like prose — write how people actually speak
4. Questions MUST follow the ORDER in which answers appear in the transcript
5. Include realistic spoken distractors: corrected information, changed times, rejected proposals, similar-sounding options
6. ALL answers must be directly supported by the transcript
7. Include answer timestamps for every question
8. For completion questions: specify word limit as structured data (maxWords, allowsNumber)
9. For gap-fill/completion: answers must be words/phrases HEARD in the recording
10. Never use placeholder values like "Option A", "TBD", "N/A"

TRANSCRIPT FORMAT (JSON):
{
  "title": "exercise title",
  "part": ${part},
  "speakers": [
    { "id": "speaker1", "name": "Speaker Name", "role": "speaker" }
  ],
  "segments": [
    {
      "id": "seg1",
      "speakerId": "speaker1",
      "text": "Natural spoken text with discourse markers and corrections",
      "startTimeMs": 0,
      "endTimeMs": 5000
    }
  ],
  "durationMs": totalDurationInMs,
  "taskGroups": [
    {
      "id": "group1",
      "type": "form-completion",
      "startNumber": 1,
      "endNumber": 5,
      "instructions": ["Complete the form below.", "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer."],
      "wordLimit": { "maxWords": 2, "allowsNumber": true },
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "type": "form-completion",
          "prompt": "Customer Name: _____",
          "correctAnswer": "answer text",
          "acceptableAlternatives": ["alt1"],
          "evidence": { "segmentId": "seg3", "startTimeMs": 15000, "endTimeMs": 20000, "supportingText": "relevant transcript quote" }
        }
      ]
    }
  ]
}

SUPPORTED QUESTION TYPES (use type field exactly):
- "form-completion": fill a form with words from recording
- "note-completion": complete notes
- "table-completion": complete a table
- "sentence-completion": complete sentences
- "summary-completion": complete a summary
- "multiple-choice-single": 3 options, one correct
- "multiple-choice-multiple": pick 2+ from a list
- "matching": match items from two lists
- "short-answer": short response (max 3 words)
- "map-labelling": label locations on a map/plan
- "plan-labelling": label a floor plan

For multiple-choice: Do NOT add letter prefixes (A. B. C.) to option text. Options MUST be distinct and plausible.
For completion types: Do NOT include "options" array. Include "correctAnswer" and "acceptableAlternatives" instead.
For ALL questions: Include "evidence" with segmentId and timestamps.

IMPORTANT: Questions in a task group MUST follow transcript order. Verify that evidence.startTimeMs increases for each question.`,
    
    userMessage: `Create an IELTS Listening Part ${part} exercise${topic ? ` about "${topic}"` : ''} at ${difficulty} difficulty with ${questionCount} questions divided into 1-2 task groups.`,
  }
}

export function buildPracticeQuestionsPrompt(skill: string, activityType: string, questionCount: number, _difficulty: string, topic?: string): string {
  const topicClause = topic ? ` on the topic of "${topic}"` : ''
  return `Generate ${questionCount} ${activityType} questions for ${skill} practice${topicClause}.`
}

export function buildPracticeQuestionsSystemPrompt(skill: string, activityType: string, questionCount: number, difficulty: string, topic?: string): string {
  const topicClause = topic ? ` about "${topic}"` : ''
  return `You are an IELTS ${skill} tutor. Generate ${questionCount} ${activityType} questions at ${difficulty} difficulty${topicClause}.

Return ONLY valid JSON. Each question MUST have an explicit "type" field set to one of the supported types below. DO NOT omit the type field.

SUPPORTED QUESTION TYPES AND THEIR SCHEMAS:

1. multiple-choice-single:
{
  "type": "multiple-choice-single",
  "question": "question text",
  "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
  "correctIndex": 0,
  "explanation": "why this answer is correct"
}
IMPORTANT for options: Do NOT include letter labels (A. B. C. D.) in the option text. The UI adds letters automatically.

2. true-false-not-given:
{
  "type": "true-false-not-given",
  "statement": "statement to evaluate",
  "correctAnswer": "true",
  "explanation": "explanation with evidence from passage"
}
IMPORTANT: Include a realistic mix of true, false, AND not-given answers. For groups of 4+, at least one of each.
IMPORTANT: "not-given" means the passage genuinely does not contain enough information.
IMPORTANT: "false" means the passage directly CONTRADICTS the statement.

3. yes-no-not-given:
{
  "type": "yes-no-not-given",
  "statement": "statement about the writer's views or claims",
  "correctAnswer": "yes",
  "explanation": "explanation"
}
IMPORTANT: Use ONLY for writer views/claims, NOT for factual information.

4. sentence-completion:
{
  "type": "sentence-completion",
  "sentence": "Complete this sentence about _____",
  "blanks": ["answer1"],
  "wordLimit": { "maxWords": 2, "maxNumbers": 1 },
  "explanation": "explanation"
}
IMPORTANT: Do NOT include "options" array for completion questions. Answers must appear in the passage.
IMPORTANT: Acceptable alternatives can be provided in the blanks array.

5. short-answer:
{
  "type": "short-answer",
  "question": "question text",
  "correctAnswer": "answer text",
  "acceptableAlternatives": ["alt1", "alt2"],
  "wordLimit": { "maxWords": 3, "maxNumbers": 1 },
  "explanation": "explanation"
}
IMPORTANT: Do NOT include "options" array for short answer questions.

6. matching-headings:
{
  "type": "matching-headings",
  "paragraphIds": ["A", "B", "C"],
  "headings": ["heading i: main idea", "heading ii: another idea", "heading iii: extra heading", "heading iv: unused heading"],
  "correctMatches": { "A": 0, "B": 1, "C": 2 },
  "explanation": "explanation"
}
IMPORTANT: Include MORE headings than paragraphs (at least 1-2 unused headings).
IMPORTANT: Headings must represent paragraph MAIN IDEAS, not isolated details.
IMPORTANT: Set correctMatches values to indices in the headings array.

RULES FOR ALL QUESTIONS:
- Every question MUST have a "type" field - DO NOT omit it
- Check your JSON is valid before returning
- Never use placeholder values like "Option A", "TBD", "N/A" for actual content
- For completion/short-answer: do NOT include options array
- For multiple-choice: do NOT include letter prefixes in option text
- All answers must be supported by the passage content`
}

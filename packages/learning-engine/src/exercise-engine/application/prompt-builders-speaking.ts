export function buildSpeakingPart1Prompt(
  difficulty: string,
  questionCount: number,
  topics?: string[],
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS speaking examiner. Generate Part 1 questions at ${difficulty} difficulty.

Part 1 is an introduction and interview (4-5 minutes). Questions should be about familiar topics:
- Home and accommodation
- Work or study
- Hobbies and interests
- Daily routines
- Family and friends
- Food, travel, entertainment

RULES:
- Use natural conversational topic groups of 2-3 related questions
- Start with simple questions, progress to slightly more detailed ones
- Do NOT ask abstract or debate-style questions in Part 1
- Each group should have a short topic introduction
- Include follow-up questions where natural

Return ONLY valid JSON:
{
  "part": 1,
  "title": "Part 1: Introduction and Interview",
  "estimatedMinutes": 4.5,
  "topicGroups": [
    {
      "topic": "topic name",
      "introduction": "examiner introduction line",
      "questions": [
        { "id": "q1", "text": "question text", "expectedResponseLength": "short", "followUp": "optional follow-up question" }
      ]
    }
  ]
}`,
    userMessage: `Generate ${questionCount} IELTS Speaking Part 1 questions${topics ? ` about: ${topics.join(', ')}` : ''} at ${difficulty} difficulty.`,
  }
}

export function buildSpeakingPart2Prompt(
  difficulty: string,
  topic?: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS speaking examiner. Generate a Part 2 cue card task at ${difficulty} difficulty.

Part 2 is the "long turn" (3-4 minutes including 1 minute preparation):
- The learner receives a cue card with a topic and prompts
- They have 1 minute to prepare
- They speak for 1-2 minutes
- One short follow-up question after they finish

Return ONLY valid JSON:
{
  "part": 2,
  "title": "Part 2: Long Turn",
  "cueCard": {
    "topic": "the main topic",
    "mainInstruction": "Describe ...",
    "prompts": [
      "what/where/when it was",
      "who was involved",
      "what happened",
      "explain why/how"
    ],
    "preparationSeconds": 60,
    "speakingSeconds": 120,
    "followUpQuestion": "a short follow-up question the examiner asks after the long turn"
  },
  "preparationInstructions": "You have one minute to prepare. You can make notes.",
  "speakingInstructions": "Speak for 1-2 minutes on the topic. The examiner will stop you when the time is up."
}`,
    userMessage: `Generate an IELTS Speaking Part 2 cue card${topic ? ` about "${topic}"` : ''} at ${difficulty} difficulty.`,
  }
}

export function buildSpeakingPart3Prompt(
  difficulty: string,
  part2Topic: string,
  questionCount: number,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS speaking examiner. Generate Part 3 discussion questions at ${difficulty} difficulty.

Part 3 is a two-way discussion (4-5 minutes) connected to the Part 2 topic: "${part2Topic}".

QUESTION PROGRESSION (move from concrete to abstract):
1. Personal/concrete: relate to the learner's experience
2. Social comparison: compare across groups, places, or times
3. Causes and effects: why things happen, consequences
4. Evaluation: assess, judge, evaluate
5. Prediction/implications: future developments, broader impact

RULES:
- Questions must connect to the Part 2 topic
- Each question should invite extended responses (not yes/no)
- Use natural examiner discourse markers: "Let's talk about...", "How about...", "Moving on to..."
- Avoid re-asking the Part 2 question in different words

Return ONLY valid JSON:
{
  "part": 3,
  "title": "Part 3: Two-way Discussion",
  "estimatedMinutes": 4.5,
  "connectionToPart2": "how these questions relate to the Part 2 topic",
  "questions": [
    {
      "id": "q1",
      "text": "question text",
      "discourseFunction": "personal" | "comparison" | "cause-effect" | "evaluation" | "prediction",
      "expectedResponseType": "extended",
      "sampleFollowUp": "a natural follow-up the examiner might ask"
    }
  ]
}`,
    userMessage: `Generate ${questionCount} IELTS Speaking Part 3 questions connected to the Part 2 topic "${part2Topic}" at ${difficulty} difficulty.`,
  }
}

export function buildSpeakingFullTestPrompt(
  difficulty: string,
  part2Topic?: string,
): { systemPrompt: string; userMessage: string } {
  return {
    systemPrompt: `You are an IELTS speaking examiner. Generate a COMPLETE three-part IELTS Speaking test at ${difficulty} difficulty.

The IELTS Speaking test has EXACTLY three parts in strict order:
1. Part 1 (4-5 min): Introduction and interview about familiar topics
2. Part 2 (3-4 min): Long turn with cue card, 1 min preparation, 1-2 min speaking
3. Part 3 (4-5 min): Two-way discussion connected to Part 2 topic

CRITICAL: Parts must be in order. Part 3 questions MUST relate to the Part 2 topic. Do NOT skip any part.

Return ONLY valid JSON:
{
  "title": "IELTS Speaking Full Test",
  "totalDurationMinutes": 13,
  "parts": [
    { "part": 1, ...Part 1 data as above },
    { "part": 2, ...Part 2 data as above },
    { "part": 3, ...Part 3 data as above }
  ]
}`,
    userMessage: `Generate a complete three-part IELTS Speaking test${part2Topic ? ` with Part 2 topic "${part2Topic}"` : ''} at ${difficulty} difficulty.`,
  }
}

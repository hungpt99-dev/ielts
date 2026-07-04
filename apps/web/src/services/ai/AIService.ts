import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'

const STORAGE_KEY = 'ielts-settings'

export interface AIProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AIRequestResult {
  content: string
  error: string | null
}

export interface WritingFeedbackResult {
  taskResponse: string
  coherence: string
  vocabulary: string
  grammar: string
  bandScore: number
  overallFeedback: string
  improvedVersion: string
  mistakes: Array<{
    category: 'grammar' | 'vocabulary' | 'coherence' | 'task-response'
    text: string
    correction: string
    explanation: string
  }>
}

export interface VocabExampleResult {
  sentence: string
  collocations: string[]
  synonyms: string[]
}

export interface ReadingPassageResult {
  title: string
  text: string
  questions: Array<{
    type: string
    question: string
    options?: string[]
    correctAnswer: string | number | string[]
    explanation: string
    blanks?: string[]
  }>
}

export interface SpeakingFeedbackResult {
  fluencyNotes: string
  vocabularyNotes: string
  grammarNotes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
}

export interface GrammarExercisesResult {
  exercises: Array<{
    type: string
    question: string
    options?: string[]
    correctAnswer: string | number
    explanation: string
  }>
}

function getSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function getProviderConfig(): AIProviderConfig {
  const settings = getSettings()
  const apiKey = (settings?.aiApiKey as string) || ''
  const baseUrl = (settings?.aiEndpoint as string) || OPENAI_BASE_URL
  const model = (settings?.aiModel as string) || DEFAULT_MODEL
  return { apiKey, baseUrl, model }
}

function isAIEnabled(): boolean {
  const settings = getSettings()
  if (!settings) return false
  return !!(settings?.aiEnabled && settings?.aiApiKey)
}

export function extractJSON(text: string): unknown {
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart >= 0 && jsonEnd >= 0) {
    try {
      return JSON.parse(text.slice(jsonStart, jsonEnd + 1))
    } catch {
      throw new Error('Malformed JSON object in AI response')
    }
  }
  const arrStart = text.indexOf('[')
  const arrEnd = text.lastIndexOf(']')
  if (arrStart >= 0 && arrEnd >= 0) {
    try {
      return JSON.parse(text.slice(arrStart, arrEnd + 1))
    } catch {
      throw new Error('Malformed JSON array in AI response')
    }
  }
  throw new Error('No JSON found in AI response')
}

export async function makeAIRequest(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number },
  configOverride?: AIProviderConfig,
): Promise<AIRequestResult> {
  const { apiKey, baseUrl, model } = configOverride ?? getProviderConfig()

  if (!apiKey) {
    return { content: '', error: 'API key not configured. Go to Settings to add your AI API key.' }
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const temperature = options?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? 2000

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      const status = response.status
      if (status === 401) {
        return { content: '', error: 'Invalid API key. Check your key in Settings.' }
      }
      if (status === 429) {
        return { content: '', error: 'Rate limit exceeded. Wait a moment and try again.' }
      }
      return {
        content: '',
        error: `AI API error (${status}): ${errBody || response.statusText}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    if (!content) {
      return { content: '', error: 'AI returned an empty response.' }
    }

    return { content, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { content: '', error: 'Network error. Check your internet connection and API endpoint.' }
    }
    return { content: '', error: `AI request failed: ${message}` }
  }
}

export async function testConnection(
  overrides?: Partial<AIProviderConfig>,
): Promise<{ ok: boolean; message: string; model?: string }> {
  const config = overrides
    ? { ...getProviderConfig(), ...overrides }
    : getProviderConfig()

  if (!config.apiKey) {
    return { ok: false, message: 'Enter an API key first.' }
  }

  const result = await makeAIRequest(
    'You are a helpful assistant.',
    'Reply with exactly the word "ok" and nothing else.',
    { maxTokens: 10, temperature: 0 },
    config,
  )

  if (result.error) {
    return { ok: false, message: result.error }
  }

  const trimmed = result.content.trim().toLowerCase()
  if (trimmed.includes('ok')) {
    return { ok: true, message: 'Connection successful!', model: config.model }
  }

  return { ok: false, message: 'Unexpected response from AI API.' }
}

export async function generateStudyPlan(params: {
  targetBand: number
  currentBand: number
  examDate: string
  dailyMinutes: number
  weakSkills: string[]
}): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS study planner. Help create a personalized study schedule.'
  const prompt = `Create a detailed daily IELTS study plan based on:

Target Band: ${params.targetBand}
Current Band: ${params.currentBand}
Exam Date: ${params.examDate || 'Not set'}
Daily Study Time: ${params.dailyMinutes} minutes
Weak Areas: ${params.weakSkills.join(', ') || 'None specified'}

Provide a weekly schedule with specific tasks for each day, covering vocabulary, reading, listening, writing, speaking, and grammar. Include time estimates for each task. Format as JSON with day-by-day breakdown.`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 2000 })
}

export async function generateVocabularyExample(word: string, topic?: string): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS vocabulary assistant. Always respond with valid JSON.'
  const prompt = `Generate a natural example sentence for the word "${word}"${topic ? ` on the topic of "${topic}"` : ''}. Also provide 2-3 common collocations and 2-3 synonyms. Format the response as JSON with keys: "sentence" (string), "collocations" (array of strings), "synonyms" (array of strings).`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 300 })
}

export async function generateReadingPassage(params: {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}): Promise<AIRequestResult> {
  const difficultyInstruction =
    params.difficulty === 'easy'
      ? 'Use simple vocabulary and straightforward sentence structures (IELTS band 5-6 level).'
      : params.difficulty === 'hard'
        ? 'Use complex vocabulary and sophisticated sentence structures (IELTS band 7-9 level).'
        : 'Use moderate vocabulary and mixed sentence structures (IELTS band 6-7 level).'

  const systemPrompt = 'You are an IELTS reading passage generator. Always respond with valid JSON.'
  const prompt = `Create an IELTS-style reading passage on the topic "${params.topic.trim()}".

Requirements:
- Write a passage of 250-400 words
- ${difficultyInstruction}
- Include 5-6 reading comprehension questions
- Questions should include a mix of types: multiple-choice, true/false/not given, and gap fill
- Each question must have a clear correct answer and explanation

Respond with valid JSON in this exact format:
{
  "title": "Passage title",
  "text": "Full passage text here...",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    },
    {
      "id": "q2",
      "type": "true-false-not-given",
      "question": "Statement to evaluate",
      "correctAnswer": "true",
      "explanation": "Explanation..."
    },
    {
      "id": "q3",
      "type": "gap-fill",
      "question": "Complete the sentences:",
      "blanks": ["word1", "word2"],
      "correctAnswer": ["word1", "word2"],
      "explanation": "Explanation..."
    }
  ]
}

Make sure the passage is realistic and the questions are directly answerable from the text. Do not include any text outside the JSON object.`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 2000 })
}

export async function checkWriting(essay: string, question: string, taskType: 'task1' | 'task2'): Promise<AIRequestResult> {
  const taskInstruction = taskType === 'task1'
    ? 'Task 1: The essay describes, summarizes, or explains a visual (chart, graph, table, map). Focus on whether the response accurately reports main features, makes comparisons, and stays objective.'
    : 'Task 2: The essay responds to an opinion, discussion, or problem-solution prompt. Focus on whether it presents a clear position, develops arguments, and addresses all parts of the prompt.'

  const systemPrompt = 'You are an IELTS writing examiner. Always respond with valid JSON.'
  const prompt = `Evaluate the following IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} essay.

${taskInstruction}

Question:
${question}

Essay:
${essay}

Respond with valid JSON in this exact format:
{
  "taskResponse": "Feedback on task achievement / task response (2-3 sentences)",
  "coherence": "Feedback on coherence and cohesion (2-3 sentences)",
  "vocabulary": "Feedback on vocabulary range and accuracy (2-3 sentences)",
  "grammar": "Feedback on grammatical range and accuracy (2-3 sentences)",
  "bandScore": 6.5,
  "overallFeedback": "Overall assessment and advice (2-4 sentences)",
  "improvedVersion": "A rewritten improved version of the entire essay",
  "mistakes": [
    {
      "category": "grammar" | "vocabulary" | "coherence" | "task-response",
      "text": "Original problematic text",
      "correction": "Corrected version",
      "explanation": "Why this is an improvement"
    }
  ]
}

Be specific and constructive. Provide a realistic band score between 1.0 and 9.0. Do not include any text outside the JSON object.`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 3000 })
}

export async function generateSpeakingQuestions(part: 1 | 2 | 3, topic?: string): Promise<AIRequestResult> {
  const partInstructions: Record<number, string> = {
    1: 'Part 1: Introduction and interview. Generate 4-5 short personal questions about familiar topics (work, study, home, hobbies, etc.).',
    2: 'Part 2: Individual long turn (Cue Card). Generate a cue card topic with bullet points. The candidate speaks for 1-2 minutes.',
    3: 'Part 3: Two-way discussion. Generate 3-4 abstract discussion questions related to the Part 2 topic.',
  }

  const systemPrompt = 'You are an IELTS speaking examiner. Always respond with valid JSON.'
  const prompt = `Generate IELTS Speaking ${partInstructions[part]}${topic ? ` on the topic of "${topic}".` : '.'}

Format the response as JSON:
${part === 2
    ? `{
  "cueCard": {
    "topic": "Describe...",
    "prompt": "You should say:",
    "bulletPoints": ["point 1", "point 2", "point 3", "point 4"]
  }
}`
    : `{
  "questions": ["question 1", "question 2", "question 3", "question 4"]
}`
}`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 1000 })
}

export async function getSpeakingFeedback(answer: string, question: string, part: 1 | 2 | 3): Promise<AIRequestResult> {
  const systemPrompt = 'You are an experienced IELTS speaking examiner. Provide constructive, detailed feedback in JSON format.'
  const prompt = `Evaluate the following IELTS Speaking Part ${part} response.

Question:
${question}

Answer:
${answer}

Respond with valid JSON:
{
  "scores": {
    "fluency": 6,
    "vocabulary": 6,
    "grammar": 6,
    "pronunciation": 6,
    "coherence": 6,
    "taskAchievement": 6
  },
  "bandScore": 6.0,
  "fluencyNotes": "Feedback on fluency and coherence (2-3 sentences)",
  "vocabularyNotes": "Feedback on lexical resource (2-3 sentences)",
  "grammarNotes": "Feedback on grammatical range and accuracy (2-3 sentences)",
  "pronunciationNotes": "Feedback on pronunciation (2-3 sentences)",
  "betterExpressions": "Alternative expressions or phrases the speaker could use",
  "improvedAnswer": "A model improved version of the answer"
}

Each score in "scores" must be an integer between 1 and 10. "bandScore" must be a number between 1.0 and 9.0.
Be constructive and specific. Do not include any text outside the JSON object.`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 2000 })
}

export async function explainGrammar(topic: string): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS grammar tutor. Always respond with valid JSON.'
  const prompt = `Explain the IELTS grammar topic "${topic}" with:
1. A simple, clear explanation suitable for an intermediate English learner
2. 3-4 example sentences
3. 2-3 common mistakes learners make with this topic and their corrections
4. 3 practice exercises with answers

Format as JSON with keys: "explanation", "examples" (array), "commonMistakes" (array of objects with "mistake" and "correction"), "exercises" (array of objects with "question", "options" (optional), "correctAnswer", "explanation").`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 1500 })
}

export async function generateGrammarExercises(topic: string, count?: number): Promise<AIRequestResult> {
  const exerciseCount = count || 5
  const systemPrompt = 'You are an IELTS grammar tutor. Always respond with valid JSON.'
  const prompt = `Generate ${exerciseCount} grammar practice exercises on the topic of "${topic}".

Include a mix of:
- Multiple choice questions
- Fill-in-the-blank questions
- Error correction questions

Format as JSON with key "exercises" containing an array of objects:
[
  {
    "type": "multiple-choice" | "gap-fill" | "error-correction",
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Why this is correct"
  }
]`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 2000 })
}

export async function explainMistake(mistakeText: string, skill: string): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS tutor helping a student understand their mistakes.'
  const prompt = `Explain the following ${skill} mistake in detail, as if you were a tutor:

Mistake: "${mistakeText}"

Provide:
1. Why this is a mistake
2. The correct version with explanation
3. A tip to avoid this mistake in the future
4. A similar example for practice

Format as JSON with keys: "explanation", "correction", "tip", "practiceExample".`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 1000 })
}

export async function createDailyContent(params: {
  topics: string[]
  weakSkills: string[]
  dailyMinutes: number
}): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS tutor creating daily learning content.'
  const prompt = `Create a focused daily IELTS learning plan for today based on:

Available time: ${params.dailyMinutes} minutes
Preferred topics: ${params.topics.join(', ') || 'Mixed'}
Focus areas: ${params.weakSkills.join(', ') || 'All skills'}

Include:
- 1 quick vocabulary task (5 new words with examples)
- 1 short reading or listening exercise
- 1 writing or speaking prompt
- 1 grammar point to review

Format as a JSON object with keys: "vocabulary", "reading", "writing", "grammar". Each value should be a string with a clear, actionable task.`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 1500 })
}

export async function generateListeningExercise(params: {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}): Promise<AIRequestResult> {
  const systemPrompt = 'You are an IELTS listening exercise generator. Always respond with valid JSON.'
  const prompt = `Create an IELTS-style listening transcript on the topic "${params.topic}" with comprehension questions.

The transcript should be ${params.difficulty === 'easy' ? '150-200 words' : params.difficulty === 'hard' ? '300-400 words' : '200-300 words'} long.

Include:
- 4-5 gap-fill questions (blanks in the transcript)
- 2-3 multiple choice comprehension questions

Format as JSON:
{
  "title": "Exercise title",
  "transcript": "Full transcript with [blank-1] markers",
  "questions": [
    {
      "id": "q1",
      "type": "gap-fill",
      "question": "Question about the blank",
      "correctAnswer": "answer",
      "explanation": "Explanation"
    },
    {
      "id": "q2",
      "type": "multiple-choice",
      "question": "Question?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Explanation"
    }
  ]
}`

  return makeAIRequest(systemPrompt, prompt, { maxTokens: 2000 })
}

export { getProviderConfig, isAIEnabled, getSettings }

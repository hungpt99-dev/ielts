import { DatabaseService } from '../../../services/storage/Database'
import type { VocabDifficulty } from '../../../models'
import type {
  PublicApiAiClassifyRequest,
  PublicApiAiClassifyResponse,
  PublicApiContentType,
} from '../types'

// ── Types ──────────────────────────────────────────────────

export interface AiProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AiResult<T> {
  data: T | null
  error: string | null
}

export interface ExtractedVocabulary {
  words: Array<{
    word: string
    meaning: string
    partOfSpeech: string
    example: string
    synonyms: string[]
    collocations: string[]
  }>
}

export interface ReadingQuestion {
  question: string
  type: 'multiple-choice' | 'true-false-not-given' | 'sentence-completion' | 'matching-headings' | 'short-answer'
  options?: string[]
  answer: string
  explanation: string
}

export interface ReadingQuestionsResult {
  questions: ReadingQuestion[]
}

export interface ListeningGapFill {
  sentence: string
  answer: string
  hint: string
}

export interface ListeningExerciseResult {
  gaps: ListeningGapFill[]
}

export interface SpeakingPrompt {
  part: 1 | 2 | 3
  question: string
  followUp?: string
}

export interface SpeakingPromptsResult {
  prompts: SpeakingPrompt[]
}

export interface WritingIdea {
  task: 1 | 2
  prompt: string
  instruction: string
}

export interface WritingIdeasResult {
  ideas: WritingIdea[]
}

export interface GrammarExercise {
  sentence: string
  error: string
  correction: string
  explanation: string
}

export interface GrammarExercisesResult {
  exercises: GrammarExercise[]
}

export interface MistakeReviewTask {
  type: 'vocabulary' | 'grammar' | 'pronunciation' | 'coherence' | 'task-achievement'
  question: string
  answer: string
  explanation: string
}

export interface MistakeReviewResult {
  tasks: MistakeReviewTask[]
}

// ── Helpers ──────────────────────────────────────────────────

const AI_API_KEY_STORAGE_KEY = 'ielts-ai-api-key'
const AI_BASE_URL_STORAGE_KEY = 'ielts-ai-base-url'
const AI_MODEL_STORAGE_KEY = 'ielts-ai-model'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

export function getStoredAiConfig(): AiProviderConfig {
  try {
    return {
      apiKey: localStorage.getItem(AI_API_KEY_STORAGE_KEY) ?? '',
      baseUrl: localStorage.getItem(AI_BASE_URL_STORAGE_KEY) ?? DEFAULT_BASE_URL,
      model: localStorage.getItem(AI_MODEL_STORAGE_KEY) ?? DEFAULT_MODEL,
    }
  } catch {
    return { apiKey: '', baseUrl: DEFAULT_BASE_URL, model: DEFAULT_MODEL }
  }
}

export function storeAiConfig(config: Partial<AiProviderConfig>): void {
  try {
    if (config.apiKey !== undefined) {
      localStorage.setItem(AI_API_KEY_STORAGE_KEY, config.apiKey)
    }
    if (config.baseUrl !== undefined) {
      localStorage.setItem(AI_BASE_URL_STORAGE_KEY, config.baseUrl)
    }
    if (config.model !== undefined) {
      localStorage.setItem(AI_MODEL_STORAGE_KEY, config.model)
    }
  } catch {
    // localStorage unavailable
  }
}

export function clearStoredAiConfig(): void {
  try {
    localStorage.removeItem(AI_API_KEY_STORAGE_KEY)
    localStorage.removeItem(AI_BASE_URL_STORAGE_KEY)
    localStorage.removeItem(AI_MODEL_STORAGE_KEY)
  } catch {
    // localStorage unavailable
  }
}

// ── AI API Call ─────────────────────────────────────────────

async function callAiApi(
  systemPrompt: string,
  userPrompt: string,
  config: AiProviderConfig,
): Promise<{ content: string | null; error: string | null }> {
  if (!config.apiKey) {
    return { content: null, error: 'AI API key not configured. Add your AI API key in Settings.' }
  }

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { content: null, error: 'Invalid AI API key. Check your key in Settings.' }
      }
      if (response.status === 429) {
        return { content: null, error: 'AI rate limit exceeded. Wait a moment and try again.' }
      }
      return { content: null, error: `AI API error (${response.status}). Check your provider settings.` }
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ''

    if (!content) {
      return { content: null, error: 'AI returned an empty response. Try again.' }
    }

    return { content, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return { content: null, error: 'Network error. Check your internet connection and API endpoint in Settings.' }
    }
    return { content: null, error: `AI request failed: ${message}` }
  }
}

function extractJson(content: string): string {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    const arrStart = content.indexOf('[')
    const arrEnd = content.lastIndexOf(']')
    if (arrStart !== -1 && arrEnd !== -1) {
      return content.slice(arrStart, arrEnd + 1)
    }
    throw new Error('AI response did not contain valid JSON.')
  }
  return content.slice(jsonStart, jsonEnd + 1)
}

function parseJsonSafe<T>(content: string): { data: T | null; error: string | null } {
  try {
    const json = extractJson(content)
    const parsed = JSON.parse(json)
    return { data: parsed as T, error: null }
  } catch {
    return { data: null, error: 'AI response was not valid JSON. Try again.' }
  }
}

// ── IELTS Topic and Skill Lists ────────────────────────────

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
] as const

const IELTS_SKILLS = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'] as const
const IELTS_DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']

// ── Classification ─────────────────────────────────────────

export async function classifyContent(
  request: PublicApiAiClassifyRequest,
  config: AiProviderConfig,
): Promise<AiResult<PublicApiAiClassifyResponse>> {
  const systemPrompt = `You are an IELTS content classifier. Analyze the given content and return classification metadata as JSON.

Classify into exactly one of these IELTS topics: ${IELTS_TOPICS.join(', ')}.
Classify skill as one of: ${IELTS_SKILLS.join(', ')}.
Set difficulty to one of: ${IELTS_DIFFICULTIES.join(', ')}.

Respond with valid JSON only in this format:
{
  "topic": "classified topic",
  "skill": "classified skill",
  "difficulty": "easy|medium|hard",
  "tags": ["tag1", "tag2"],
  "vocabulary": ["word1", "word2"],
  "summary": "brief summary of the content",
  "keyPhrases": ["phrase1", "phrase2"],
  "questions": ["question1", "question2"]
}`

  const userPrompt = `Title: ${request.title}\nContent Type: ${request.contentType}\n\nContent:\n${request.content}\n\nClassify this content and return the JSON metadata.`

  const { content, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  const { data, error: parseError } = parseJsonSafe<PublicApiAiClassifyResponse>(content!)
  if (parseError) return { data: null, error: parseError }

  return { data, error: null }
}

export async function classifyAndSave(
  contentId: string,
  title: string,
  content: string,
  contentType: PublicApiContentType,
  config: AiProviderConfig,
): Promise<AiResult<PublicApiAiClassifyResponse>> {
  const { data, error } = await classifyContent(
    { contentId, title, content, contentType },
    config,
  )

  if (error || !data) {
    return { data: null, error: error ?? 'Classification failed' }
  }

  try {
    await DatabaseService.updatePublicApiContent(contentId, {
      topic: data.topic,
      skill: data.skill,
      difficulty: data.difficulty,
      tags: data.tags,
      aiClassification: {
        topic: data.topic,
        skill: data.skill,
        difficulty: data.difficulty,
        tags: data.tags,
        vocabulary: data.vocabulary,
        summary: data.summary,
      },
    })
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to save classification to database',
    }
  }

  return { data, error: null }
}

// ── Vocabulary Extraction ───────────────────────────────────

export async function extractVocabulary(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<ExtractedVocabulary>> {
  const systemPrompt = `You are an IELTS vocabulary expert. Extract IELTS-level vocabulary from the given content.

For each word, provide:
- word: the vocabulary word
- meaning: English definition suitable for IELTS learners
- partOfSpeech: noun, verb, adjective, adverb, etc.
- example: example sentence using the word in IELTS context
- synonyms: array of synonyms (2-3)
- collocations: array of common collocations (2-3)

Respond with valid JSON only in this format:
{
  "words": [
    {"word": "vocabulary word", "meaning": "definition", "partOfSpeech": "noun", "example": "example sentence", "synonyms": ["syn1", "syn2"], "collocations": ["coll1", "coll2"]}
  ]
}`

  const userPrompt = `Extract IELTS vocabulary from this content:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  const { data, error: parseError } = parseJsonSafe<ExtractedVocabulary>(result!)
  if (parseError) return { data: null, error: parseError }

  if (!data?.words || data.words.length === 0) {
    return { data: null, error: 'No vocabulary words extracted. Try with different content.' }
  }

  return { data, error: null }
}

// ── Reading Questions Generation ────────────────────────────

export async function generateReadingQuestions(
  content: string,
  title: string,
  config: AiProviderConfig,
): Promise<AiResult<ReadingQuestionsResult>> {
  const systemPrompt = `You are an IELTS reading examiner. Create IELTS reading practice questions based on the given content.

Question types: multiple-choice, true-false-not-given, sentence-completion, matching-headings, short-answer.

Each question must have:
- question: the question text
- type: the question type
- options: array of 4 options (for multiple-choice only)
- answer: the correct answer
- explanation: why this answer is correct

Respond with valid JSON only in this format:
{
  "questions": [
    {"question": "question text", "type": "multiple-choice", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "explanation"}
  ]
}`

  const userPrompt = `Title: ${title}\n\nContent:\n${content}\n\nCreate 3-5 IELTS reading questions based on this content.`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<ReadingQuestionsResult>(result!)
}

// ── Listening Exercise Generation ───────────────────────────

export async function generateListeningExercise(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<ListeningExerciseResult>> {
  const systemPrompt = `You are an IELTS listening examiner. Create a listening gap-fill exercise from the given transcript.

For each gap:
- sentence: the sentence with _____ for the missing word
- answer: the missing word(s)
- hint: a brief hint about what to listen for

Make sure the gaps test IELTS listening skills like:
- Specific information (dates, numbers, names)
- Spelling
- Key vocabulary
- Prepositions and particles

Respond with valid JSON only in this format:
{
  "gaps": [
    {"sentence": "The meeting will be held on _____.", "answer": "Monday", "hint": "day of the week"}
  ]
}`

  const userPrompt = `Create a listening gap-fill exercise from this transcript:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<ListeningExerciseResult>(result!)
}

// ── Speaking Prompts Generation ─────────────────────────────

export async function generateSpeakingPrompts(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<SpeakingPromptsResult>> {
  const systemPrompt = `You are an IELTS speaking examiner. Create IELTS speaking prompts based on the given content.

IELTS Speaking has 3 parts:
- Part 1 (4-5 min): Introduction and interview about familiar topics
- Part 2 (3-4 min): Individual long turn - speak about a topic for 1-2 minutes
- Part 3 (4-5 min): Two-way discussion on abstract aspects of the topic

Respond with valid JSON only in this format:
{
  "prompts": [
    {"part": 1, "question": "Part 1 speaking question", "followUp": "optional follow-up"},
    {"part": 2, "question": "Part 2 cue card topic", "followUp": "follow-up discussion question"},
    {"part": 3, "question": "Part 3 discussion question"}
  ]
}`

  const userPrompt = `Create IELTS speaking practice prompts based on this content:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<SpeakingPromptsResult>(result!)
}

// ── Writing Ideas Generation ────────────────────────────────

export async function generateWritingIdeas(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<WritingIdeasResult>> {
  const systemPrompt = `You are an IELTS writing examiner. Create IELTS writing task prompts based on the given content.

IELTS Writing:
- Task 1 (150 words): Describe a chart, graph, table, diagram, or process
- Task 2 (250 words): Write an essay in response to a point of view, argument, or problem

Respond with valid JSON only in this format:
{
  "ideas": [
    {"task": 1, "prompt": "writing task 1 prompt", "instruction": "describe what the data shows"},
    {"task": 2, "prompt": "writing task 2 essay prompt", "instruction": "give your opinion and include examples"}
  ]
}`

  const userPrompt = `Create IELTS writing task ideas based on this content:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<WritingIdeasResult>(result!)
}

// ── Grammar Exercises Generation ────────────────────────────

export async function generateGrammarExercises(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<GrammarExercisesResult>> {
  const systemPrompt = `You are an IELTS grammar expert. Create grammar exercises from the given content.

For each exercise:
- sentence: a sentence with a grammar error
- error: what is wrong
- correction: the corrected version
- explanation: grammar rule explanation in simple English

Focus on IELTS-relevant grammar: tenses, articles, prepositions, conditionals, relative clauses, passive voice, countable/uncountable nouns.

Respond with valid JSON only in this format:
{
  "exercises": [
    {"sentence": "sentence with error", "error": "description of error", "correction": "corrected sentence", "explanation": "grammar rule explanation"}
  ]
}`

  const userPrompt = `Create grammar exercises based on this content:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<GrammarExercisesResult>(result!)
}

// ── Mistake Review Generation ───────────────────────────────

export async function generateMistakeReviewTasks(
  content: string,
  config: AiProviderConfig,
): Promise<AiResult<MistakeReviewResult>> {
  const systemPrompt = `You are an IELTS tutor creating mistake review tasks. Analyze the given content and create review tasks that help IELTS learners identify and correct common mistakes.

Task types: vocabulary, grammar, pronunciation, coherence, task-achievement

For each task:
- type: the mistake category
- question: a question or exercise identifying the mistake
- answer: the correct approach or answer
- explanation: why this is a common mistake and how to avoid it

Respond with valid JSON only in this format:
{
  "tasks": [
    {"type": "grammar", "question": "Identify the mistake in this sentence", "answer": "corrected version", "explanation": "common mistake explanation"}
  ]
}`

  const userPrompt = `Create mistake review tasks based on this content:\n\n${content}`

  const { content: result, error } = await callAiApi(systemPrompt, userPrompt, config)
  if (error) return { data: null, error }

  return parseJsonSafe<MistakeReviewResult>(result!)
}

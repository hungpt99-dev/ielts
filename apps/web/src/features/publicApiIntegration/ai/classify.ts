import { callAI, READING_QUESTIONS_SYSTEM_PROMPT, LISTENING_EXERCISE_SYSTEM_PROMPT, SPEAKING_PROMPTS_SYSTEM_PROMPT, WRITING_IDEAS_SYSTEM_PROMPT, GRAMMAR_EXERCISES_SYSTEM_PROMPT, MISTAKE_REVIEW_SYSTEM_PROMPT, VOCABULARY_EXTRACTION_SYSTEM_PROMPT, buildReadingQuestionsPrompt, buildListeningExercisePrompt, buildSpeakingPromptsPrompt, buildWritingIdeasPrompt, buildGrammarExercisesPrompt, buildMistakeReviewPrompt, buildVocabularyExtractionPrompt } from '@ielts/ai'
import type { ProviderConfig } from '@ielts/ai'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'

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

const APP_SETTINGS_KEY = 'ielts-settings'

function readAppSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function getStoredAiConfig(): AiProviderConfig {
  try {
    const settings = readAppSettings()
    return {
      apiKey: (settings?.aiApiKey as string) ?? '',
      baseUrl: (settings?.aiEndpoint as string) || OPENAI_BASE_URL,
      model: (settings?.aiModel as string) || DEFAULT_MODEL,
    }
  } catch {
    return { apiKey: '', baseUrl: OPENAI_BASE_URL, model: DEFAULT_MODEL }
  }
}

export function storeAiConfig(config: Partial<AiProviderConfig>): void {
  try {
    const current = readAppSettings() ?? {}
    if (config.apiKey !== undefined) current.aiApiKey = config.apiKey
    if (config.baseUrl !== undefined) current.aiEndpoint = config.baseUrl
    if (config.model !== undefined) current.aiModel = config.model
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(current))
  } catch {}
}

export function clearStoredAiConfig(): void {
  try {
    const current = readAppSettings() ?? {}
    delete current.aiApiKey
    delete current.aiEndpoint
    delete current.aiModel
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(current))
  } catch {}
}

function toProviderConfig(config: AiProviderConfig): ProviderConfig {
  return { apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model }
}

async function callAi(systemPrompt: string, userPrompt: string, config: AiProviderConfig) {
  if (!config.apiKey) return { content: null, error: 'AI API key not configured.' }
  return callAI(systemPrompt, userPrompt, () => toProviderConfig(config), { temperature: 0.5, maxTokens: 2000 })
}

function extractJson(content: string): string {
  const jsonStart = content.indexOf('{')
  const jsonEnd = content.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    const arrStart = content.indexOf('[')
    const arrEnd = content.lastIndexOf(']')
    if (arrStart !== -1 && arrEnd !== -1) return content.slice(arrStart, arrEnd + 1)
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
    return { data: null, error: 'AI response was not valid JSON.' }
  }
}

export async function extractVocabulary(content: string, config: AiProviderConfig): Promise<AiResult<ExtractedVocabulary>> {
  const { content: result, error } = await callAi(VOCABULARY_EXTRACTION_SYSTEM_PROMPT, buildVocabularyExtractionPrompt(content), config)
  if (error) return { data: null, error }
  const { data, error: parseError } = parseJsonSafe<ExtractedVocabulary>(result!)
  if (parseError) return { data: null, error: parseError }
  if (!data?.words || data.words.length === 0) return { data: null, error: 'No vocabulary words extracted.' }
  return { data, error: null }
}

export async function generateReadingQuestions(content: string, title: string, config: AiProviderConfig): Promise<AiResult<ReadingQuestionsResult>> {
  const result = await callAi(READING_QUESTIONS_SYSTEM_PROMPT, buildReadingQuestionsPrompt(title, content, 5), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<ReadingQuestionsResult>(result.content!)
}

export async function generateListeningExercise(content: string, config: AiProviderConfig): Promise<AiResult<ListeningExerciseResult>> {
  const result = await callAi(LISTENING_EXERCISE_SYSTEM_PROMPT, buildListeningExercisePrompt(content), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<ListeningExerciseResult>(result.content!)
}

export async function generateSpeakingPrompts(content: string, config: AiProviderConfig): Promise<AiResult<SpeakingPromptsResult>> {
  const result = await callAi(SPEAKING_PROMPTS_SYSTEM_PROMPT, buildSpeakingPromptsPrompt(content), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<SpeakingPromptsResult>(result.content!)
}

export async function generateWritingIdeas(content: string, config: AiProviderConfig): Promise<AiResult<WritingIdeasResult>> {
  const result = await callAi(WRITING_IDEAS_SYSTEM_PROMPT, buildWritingIdeasPrompt(content), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<WritingIdeasResult>(result.content!)
}

export async function generateGrammarExercises(content: string, config: AiProviderConfig): Promise<AiResult<GrammarExercisesResult>> {
  const result = await callAi(GRAMMAR_EXERCISES_SYSTEM_PROMPT, buildGrammarExercisesPrompt(content), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<GrammarExercisesResult>(result.content!)
}

export async function generateMistakeReviewTasks(content: string, config: AiProviderConfig): Promise<AiResult<MistakeReviewResult>> {
  const result = await callAi(MISTAKE_REVIEW_SYSTEM_PROMPT, buildMistakeReviewPrompt(content), config)
  if (result.error) return { data: null, error: result.error }
  return parseJsonSafe<MistakeReviewResult>(result.content!)
}

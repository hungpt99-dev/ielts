import { callAI } from '@ielts/ai'
import type { ProviderConfig } from '@ielts/ai'
import {
  readingQuestionsSchema,
  listeningExerciseSchema,
  speakingPromptsSchema,
  writingIdeasSchema,
  grammarExercisesSchema,
  mistakeReviewSchema,
  vocabularyExtractionSchema,
} from '@ielts/ai'
import type {
  ReadingQuestions,
  ListeningExercise,
  SpeakingPrompts,
  WritingIdeas,
  GrammarExercises,
  MistakeReview,
  VocabularyExtraction,
} from '@ielts/ai'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import { getLearningEngine } from '../../../services/engineBootstrap'

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
const READING_SYSTEM_PROMPT = 'You are an IELTS reading examiner. Create reading questions. Return JSON: { "questions": [{ "question": string, "type": string, "options"?: string[], "answer": string, "explanation": string }] }'
const LISTENING_SYSTEM_PROMPT = 'You are an IELTS listening examiner. Return JSON: { "gaps": [{ "sentence": string, "answer": string, "hint": string }] }'
const SPEAKING_SYSTEM_PROMPT = 'You are an IELTS speaking examiner. Return JSON: { "prompts": [{ "part": 1|2|3, "question": string, "followUp"?: string }] }'
const WRITING_SYSTEM_PROMPT = 'You are an IELTS writing examiner. Return JSON: { "ideas": [{ "task": 1|2, "prompt": string, "instruction": string }] }'
const GRAMMAR_SYSTEM_PROMPT = 'You are an IELTS grammar expert. Return JSON: { "exercises": [{ "sentence": string, "error": string, "correction": string, "explanation": string }] }'
const MISTAKE_REVIEW_SYSTEM_PROMPT = 'You are an IELTS tutor. Return JSON: { "tasks": [{ "type": string, "question": string, "answer": string, "explanation": string }] }'
const VOCABULARY_EXTRACTION_SYSTEM_PROMPT = 'You are an IELTS vocabulary expert. Extract IELTS-level vocabulary from the given content.\nReturn JSON: { "words": [{ "word": string, "meaning": string, "partOfSpeech": string, "example": string, "synonyms": string[], "collocations": string[] }] }'

function readAppSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (error) {
  console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', error);
  }
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
  } catch (error) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', error);
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
  } catch (error) {
console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', error);
  }
}

export function clearStoredAiConfig(): void {
  try {
    const current = readAppSettings() ?? {}
    delete current.aiApiKey
    delete current.aiEndpoint
    delete current.aiModel
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(current))
  } catch (error) {
console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', error);
  }
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

export async function extractVocabulary(content: string, config: AiProviderConfig): Promise<AiResult<ExtractedVocabulary>> {
  const engine = getLearningEngine()
  if (engine) {
    try {
      const result = await engine.createSessionFromContent({
        content: { id: crypto.randomUUID(), type: 'article', text: content },
        skill: 'vocabulary' as any,
        availableMinutes: 10,
      })
      if (result.status === 'success') {
        return { data: { words: [] }, error: null }
      }
    } catch (error) {
  console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', error);
    }
  }

  const { content: result, error } = await callAi(VOCABULARY_EXTRACTION_SYSTEM_PROMPT, `Extract IELTS vocabulary from this content:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = vocabularyExtractionSchema.parse(JSON.parse(json))
    return {
      data: {
        words: parsed.words.map(w => ({
          word: w.word,
          meaning: w.meaning,
          partOfSpeech: w.partOfSpeech,
          example: w.example,
          synonyms: w.synonyms,
          collocations: w.collocations,
        })),
      },
      error: null,
    }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateReadingQuestions(content: string, title: string, config: AiProviderConfig): Promise<AiResult<ReadingQuestionsResult>> {
  const { content: result, error } = await callAi(READING_SYSTEM_PROMPT, `Title: ${title}\n\nContent:\n${content}\n\nCreate 5 IELTS reading questions.`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = readingQuestionsSchema.parse(JSON.parse(json))
    return { data: { questions: parsed.questions as ReadingQuestionsResult['questions'] }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateListeningExercise(content: string, config: AiProviderConfig): Promise<AiResult<ListeningExerciseResult>> {
  const { content: result, error } = await callAi(LISTENING_SYSTEM_PROMPT, `Create a listening gap-fill exercise from:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = listeningExerciseSchema.parse(JSON.parse(json))
    return { data: { gaps: parsed.gaps }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateSpeakingPrompts(content: string, config: AiProviderConfig): Promise<AiResult<SpeakingPromptsResult>> {
  const { content: result, error } = await callAi(SPEAKING_SYSTEM_PROMPT, `Create IELTS speaking prompts based on:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = speakingPromptsSchema.parse(JSON.parse(json))
    return { data: { prompts: parsed.prompts }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateWritingIdeas(content: string, config: AiProviderConfig): Promise<AiResult<WritingIdeasResult>> {
  const { content: result, error } = await callAi(WRITING_SYSTEM_PROMPT, `Create IELTS writing task ideas based on:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = writingIdeasSchema.parse(JSON.parse(json))
    return { data: { ideas: parsed.ideas }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateGrammarExercises(content: string, config: AiProviderConfig): Promise<AiResult<GrammarExercisesResult>> {
  const { content: result, error } = await callAi(GRAMMAR_SYSTEM_PROMPT, `Create grammar exercises based on:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = grammarExercisesSchema.parse(JSON.parse(json))
    return { data: { exercises: parsed.exercises }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

export async function generateMistakeReviewTasks(content: string, config: AiProviderConfig): Promise<AiResult<MistakeReviewResult>> {
  const { content: result, error } = await callAi(MISTAKE_REVIEW_SYSTEM_PROMPT, `Create mistake review tasks based on:\n\n${content}`, config)
  if (error) return { data: null, error }
  try {
    const json = extractJson(result!)
    const parsed = mistakeReviewSchema.parse(JSON.parse(json))
    return { data: { tasks: parsed.tasks as MistakeReviewResult['tasks'] }, error: null }
  } catch (e) {
    console.error('apps/web/src/features/publicApiIntegration/ai/classify.ts error:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to parse AI response' }
  }
}

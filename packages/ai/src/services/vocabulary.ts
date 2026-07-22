import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import { buildVocabularyDetailsPrompt, buildVocabularyQuizPrompt, VOCABULARY_DETAILS_SYSTEM_PROMPT, VOCABULARY_QUIZ_SYSTEM_PROMPT } from '../prompts'
import { vocabularyDetailsSchema, vocabularyQuizSchema } from '../schemas'
import type { VocabularyDetails, VocabularyQuiz } from '../schemas'
import { AiGenerateResultCache, extractJSON } from '../utils'

const vocabularyCache = new AiGenerateResultCache<VocabularyDetails>({ ttlMs: 30 * 60 * 1000 })
const quizCache = new AiGenerateResultCache<VocabularyQuiz>({ ttlMs: 30 * 60 * 1000 })

export { vocabularyCache, quizCache }

export async function generateVocabularyDetails(
  word: string,
  sourceSentence: string,
  topic: string,
  getConfig: () => ProviderConfig,
  nativeLanguage = '',
): Promise<{ data: VocabularyDetails | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('vocab-details', word, topic, sourceSentence.slice(0, 80))
  const cached = vocabularyCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const userPrompt = buildVocabularyDetailsPrompt(word, sourceSentence, topic, nativeLanguage)

  try {
    const { content, error } = await callAI(VOCABULARY_DETAILS_SYSTEM_PROMPT, userPrompt, getConfig, {
      temperature: 0.5,
      maxTokens: 1000,
    })

    if (error) {
      if (error.includes('API key')) return { data: null, error }
      if (error.includes('401') || error.includes('Unauthorized')) {
        return { data: null, error: 'Invalid API key. Check your key in Settings.' }
      }
      return { data: null, error: error.includes('429') || error.includes('Rate limit')
        ? 'Rate limit exceeded. Wait a moment and try again.'
        : `AI request failed: ${error}` }
    }

    if (!content) return { data: null, error: 'AI returned an empty response.' }

    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return { data: null, error: 'AI response was not valid JSON.' }
    }

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
    const result = vocabularyDetailsSchema.safeParse(parsed)
    if (!result.success) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }

    vocabularyCache.set(cacheKey, result.data)
    return { data: result.data, error: null }
  } catch (err: unknown) {
    console.error('packages/ai/src/services/vocabulary.ts error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: message.includes('Failed to fetch') || message.includes('NetworkError')
      ? 'Network error. Check your internet connection and API endpoint.'
      : `AI request failed: ${message}` }
  }
}

export async function generateVocabularyQuiz(
  word: string,
  details: VocabularyDetails,
  getConfig: () => ProviderConfig,
): Promise<{ data: VocabularyQuiz | null; error: string | null }> {
  const quizKey = AiGenerateResultCache.generateKey('vocab-quiz', word)
  const cached = quizCache.get(quizKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()

  if (!config.apiKey) {
    return { data: null, error: 'API key not configured.' }
  }

  const userPrompt = buildVocabularyQuizPrompt(
    word,
    details.meaning,
    details.exampleSentence,
    details.synonyms,
    details.collocations,
  )

  try {
    const { content, error } = await callAI(VOCABULARY_QUIZ_SYSTEM_PROMPT, userPrompt, getConfig, { maxTokens: 1000 })
    if (error) return { data: null, error }

    const json = extractJSON(content!)
    const parsed = JSON.parse(json)
    const result = vocabularyQuizSchema.safeParse(parsed)
    if (!result.success) return { data: null, error: 'AI response had unexpected format.' }

    quizCache.set(quizKey, result.data)
    return { data: result.data, error: null }
  } catch (err: unknown) {
    console.error('packages/ai/src/services/vocabulary.ts error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: `AI request failed: ${message}` }
  }
}

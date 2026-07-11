import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import {
  buildVocabularyFromTranscriptPrompt,
  buildSummaryFromTranscriptPrompt,
  buildListeningQuestionsPrompt,
  buildShadowingScriptsPrompt,
} from '../prompts'
import {
  transcriptVocabularySchema,
  transcriptSummarySchema,
  listeningQuestionSchema,
  shadowingScriptSchema,
} from '../schemas'
import type {
  TranscriptVocabulary,
  TranscriptSummary,
  ListeningQuestions,
  ShadowingScripts,
} from '../schemas'
import { AiGenerateResultCache, parseAndValidate } from '../utils'

const transcriptVocabCache = new AiGenerateResultCache<TranscriptVocabulary>({ ttlMs: 30 * 60 * 1000 })
const transcriptSummaryCache = new AiGenerateResultCache<TranscriptSummary>({ ttlMs: 30 * 60 * 1000 })
const listeningQuestionsCache = new AiGenerateResultCache<ListeningQuestions>({ ttlMs: 30 * 60 * 1000 })
const shadowingScriptsCache = new AiGenerateResultCache<ShadowingScripts>({ ttlMs: 30 * 60 * 1000 })

export {
  transcriptVocabCache,
  transcriptSummaryCache,
  listeningQuestionsCache,
  shadowingScriptsCache,
}

export async function generateVocabularyFromTranscript(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: TranscriptVocabulary | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('video-vocab', videoTitle, transcript.slice(0, 80))
  const cached = transcriptVocabCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildVocabularyFromTranscriptPrompt(transcript, videoTitle)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  const result = parseAndValidate(content!, transcriptVocabularySchema)
  if (result.data) transcriptVocabCache.set(cacheKey, result.data)
  return result
}

export async function generateSummaryFromTranscript(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: TranscriptSummary | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('video-summary', videoTitle, transcript.slice(0, 80))
  const cached = transcriptSummaryCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildSummaryFromTranscriptPrompt(transcript, videoTitle)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  const result = parseAndValidate(content!, transcriptSummarySchema)
  if (result.data) transcriptSummaryCache.set(cacheKey, result.data)
  return result
}

export async function generateListeningQuestions(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: ListeningQuestions | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('video-listening', videoTitle, transcript.slice(0, 80))
  const cached = listeningQuestionsCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildListeningQuestionsPrompt(transcript, videoTitle)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  const result = parseAndValidate(content!, listeningQuestionSchema)
  if (result.data) listeningQuestionsCache.set(cacheKey, result.data)
  return result
}

export async function generateShadowingScripts(
  transcript: string,
  getConfig: () => ProviderConfig,
  nativeLanguage = '',
): Promise<{ data: ShadowingScripts | null; error: string | null }> {
  const cacheKey = AiGenerateResultCache.generateKey('video-shadowing', transcript.slice(0, 80))
  const cached = shadowingScriptsCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildShadowingScriptsPrompt(transcript, nativeLanguage)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  const result = parseAndValidate(content!, shadowingScriptSchema)
  if (result.data) shadowingScriptsCache.set(cacheKey, result.data)
  return result
}

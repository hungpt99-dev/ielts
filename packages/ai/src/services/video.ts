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
import { parseAndValidate } from '../utils'

export async function generateVocabularyFromTranscript(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: TranscriptVocabulary | null; error: string | null }> {
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

  return parseAndValidate(content!, transcriptVocabularySchema)
}

export async function generateSummaryFromTranscript(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: TranscriptSummary | null; error: string | null }> {
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

  return parseAndValidate(content!, transcriptSummarySchema)
}

export async function generateListeningQuestions(
  transcript: string,
  videoTitle: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: ListeningQuestions | null; error: string | null }> {
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

  return parseAndValidate(content!, listeningQuestionSchema)
}

export async function generateShadowingScripts(
  transcript: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: ShadowingScripts | null; error: string | null }> {
  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured. Add your AI API key in Settings.' }
  }

  const { systemPrompt, userPrompt } = buildShadowingScriptsPrompt(transcript)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 2000,
    temperature: 0.4,
  })
  if (error) return { data: null, error }

  return parseAndValidate(content!, shadowingScriptSchema)
}

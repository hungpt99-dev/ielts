import { z } from 'zod'
import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import { buildExplainPrompt } from '../prompts'
import type { AiExplainType } from '../prompts'
import {
  simpleExplainSchema,
  vietnameseExplainSchema,
  ieltsVocabSchema,
  grammarExplainSchema,
  rewriteSchema,
  exampleSentencesSchema,
  quizSchema,
} from '../schemas'
import type { AiExplainResult } from '../schemas'
import { AiCache } from '../utils'
import { extractJSON } from '../utils'

const typeSchemas: Record<AiExplainType, z.ZodTypeAny> = {
  simple: simpleExplainSchema,
  translate: vietnameseExplainSchema,
  'ielts-vocab': ieltsVocabSchema,
  grammar: grammarExplainSchema,
  rewrite: rewriteSchema,
  'example-sentences': exampleSentencesSchema,
  quiz: quizSchema,
}

export const aiExplainCache = new AiCache<AiExplainResult>()

export async function explain(
  type: AiExplainType,
  text: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: AiExplainResult | null; error: string | null }> {
  const cacheKey = `${type}:${text}`
  const cached = aiExplainCache.get(cacheKey)
  if (cached) return { data: cached, error: null }

  const schema = typeSchemas[type]
  const { systemPrompt, userPrompt } = buildExplainPrompt(type, text)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig)
  if (error) return { data: null, error }

  try {
    const json = extractJSON(content!)
    const parsed = JSON.parse(json)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      return { data: null, error: 'AI response had unexpected format. Try again.' }
    }
    aiExplainCache.set(cacheKey, result.data as AiExplainResult)
    return { data: result.data as AiExplainResult, error: null }
  } catch {
    return { data: null, error: 'AI response was not valid JSON. Try again.' }
  }
}

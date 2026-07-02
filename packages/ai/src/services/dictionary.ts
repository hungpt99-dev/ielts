import { callAI } from '../client'
import type { ProviderConfig } from '../client/types'
import { buildDictionaryEntryPrompt } from '../prompts'
import { dictionaryEntrySchema } from '../schemas'
import type { DictionaryEntry } from '../schemas'
import { AiCache, parseAndValidate } from '../utils'

class DictionaryCache {
  private cache = new AiCache<DictionaryEntry>(30 * 60 * 1000)

  get(word: string, context?: string): DictionaryEntry | null {
    const key = context ? `${word}|${context.slice(0, 80)}` : word
    return this.cache.get(key)
  }

  set(word: string, context: string | undefined, data: DictionaryEntry): void {
    const key = context ? `${word}|${context.slice(0, 80)}` : word
    this.cache.set(key, data)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const dictionaryCache = new DictionaryCache()

export async function generateDictionaryEntry(
  selectedWord: string,
  contextSentence: string,
  getConfig: () => ProviderConfig,
): Promise<{ data: DictionaryEntry | null; error: string | null }> {
  const cached = dictionaryCache.get(selectedWord, contextSentence)
  if (cached) return { data: cached, error: null }

  const config = getConfig()
  if (!config.apiKey) {
    return { data: null, error: 'API key not configured.' }
  }

  const { systemPrompt, userPrompt } = buildDictionaryEntryPrompt(selectedWord, contextSentence)

  const { content, error } = await callAI(systemPrompt, userPrompt, getConfig, {
    maxTokens: 800,
    temperature: 0.3,
  })
  if (error) return { data: null, error }

  const result = parseAndValidate(content!, dictionaryEntrySchema)
  if (result.data) {
    dictionaryCache.set(selectedWord, contextSentence, result.data)
  }
  return result
}

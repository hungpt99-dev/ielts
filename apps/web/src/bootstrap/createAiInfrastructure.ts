import { AiConfigurationResolver, createAIClient as createBaseAIClient } from '@ielts/ai'
import type { AiCredentialProvider, ResolvedAiConnectionConfig } from '@ielts/ai'
import type { AiUserSettings } from '@ielts/settings'
import { DEFAULT_APP_CONFIG, AI_PROVIDER_DEFINITIONS, STORAGE_KEYS, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'

export function mapNativeLanguage(lang: string | undefined): string {
  if (!lang || lang === '' || lang.toLowerCase() === 'auto') return 'english'
  const lower = lang.toLowerCase()
  const map: Record<string, string> = {
    vi: 'vietnamese', vietnamese: 'vietnamese',
    en: 'english', english: 'english',
    ar: 'arabic', arabic: 'arabic',
    bn: 'bengali', bengali: 'bengali',
    nl: 'dutch', dutch: 'dutch',
    fr: 'french', french: 'french',
    de: 'german', german: 'german',
    el: 'greek', greek: 'greek',
    hi: 'hindi', hindi: 'hindi',
    id: 'indonesian', indonesian: 'indonesian',
    it: 'italian', italian: 'italian',
    ja: 'japanese', japanese: 'japanese',
    ko: 'korean', korean: 'korean',
    ms: 'malay', malay: 'malay',
    fa: 'persian', persian: 'persian',
    pl: 'polish', polish: 'polish',
    pt: 'portuguese', portuguese: 'portuguese',
    ru: 'russian', russian: 'russian',
    es: 'spanish', spanish: 'spanish',
    sw: 'swahili', swahili: 'swahili',
    tl: 'tagalog', tagalog: 'tagalog',
    ta: 'tamil', tamil: 'tamil',
    th: 'thai', thai: 'thai',
    tr: 'turkish', turkish: 'turkish',
    ur: 'urdu', urdu: 'urdu',
    'chinese': 'chinese', 'chinese (simplified)': 'chinese',
    'chinese (traditional)': 'chinese',
  }
  return map[lower] ?? 'english'
}

export function createAiCredentialProvider(): AiCredentialProvider {
  return {
      async getCredential(providerId) {
        try {
          const key = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${providerId}`)
          if (key) return { apiKey: key }
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          if (!raw) return undefined
          const config = JSON.parse(raw)
          const flatKey = config?.aiApiKey
          if (flatKey) return { apiKey: flatKey }
          return undefined
        } catch { return undefined }
      },
    async storeCredential() {},
    async clearCredential() {},
  }
}

export async function resolveAiConfig(): Promise<ResolvedAiConnectionConfig> {
  const credentialProvider = createAiCredentialProvider()
  const resolver = new AiConfigurationResolver(
    credentialProvider,
    DEFAULT_APP_CONFIG.ai,
  )

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    const userSettings: AiUserSettings = raw
      ? { providerId: DEFAULT_AI_PROVIDER_ID, ...JSON.parse(raw)?.ai }
      : { providerId: DEFAULT_AI_PROVIDER_ID }
    const cred = await credentialProvider.getCredential(userSettings.providerId)
    console.log('[AiConfig] settings key found:', !!raw, 'provider:', userSettings.providerId, 'credential found:', !!cred)
    const resolved = await resolver.resolve(userSettings)
    console.log('[AiConfig] resolved apiKey present:', !!resolved.apiKey)
    return resolved
  } catch (err) {
    console.error('[AiConfig] fallback due to:', err)
    return {
      providerId: DEFAULT_AI_PROVIDER_ID,
      adapterType: 'openai-compatible',
      apiUrl: AI_PROVIDER_DEFINITIONS.openai.defaultApiUrl ?? '',
      model: DEFAULT_APP_CONFIG.ai.defaultModel,
      timeoutMs: DEFAULT_APP_CONFIG.ai.timeoutMs,
      maxRetries: DEFAULT_APP_CONFIG.ai.maxRetries,
      temperature: DEFAULT_APP_CONFIG.ai.temperature,
    }
  }
}

export function createAIClient(): TutorAIClient {
  let resolvedConfigCache: ResolvedAiConnectionConfig | null = null
  const aiClient = createBaseAIClient()

  async function getResolvedConfig() {
    if (resolvedConfigCache) return resolvedConfigCache
    resolvedConfigCache = await resolveAiConfig()
    return resolvedConfigCache
  }

  return {
    async generateStructured(request: any) {
      const config = await getResolvedConfig()
      const result = await aiClient.complete(
        [
          { role: 'system', content: request.systemPrompt ?? '' },
          { role: 'user', content: request.userMessage ?? '' },
        ],
        {
          apiKey: config.apiKey ?? '',
          baseUrl: config.apiUrl,
          model: config.model,
          temperature: request.temperature ?? config.temperature,
          maxTokens: request.maxTokens ?? 2048,
        },
        {
          temperature: request.temperature ?? config.temperature,
          maxTokens: request.maxTokens ?? 2048,
        },
      )
      if (result.content) {
        const json = extractJsonFromResponse(result.content)
        if (json) {
          try { return { success: true as const, data: JSON.parse(json) } }
          catch { /* fall through to raw response */ }
        }
        try { return { success: true as const, data: JSON.parse(result.content) } }
        catch {
          console.warn('[generateStructured] JSON parse failed, wrapping raw content')
          return { success: true as const, data: { response: result.content } }
        }
      }
      console.warn('[generateStructured] No content returned. Error:', result.error)
      return { success: false as const, error: { code: 'ai_failed', message: result.error ?? 'AI call failed', recoverable: true } }
    },
  }
}

function extractJsonFromResponse(text: string): string | null {
  const trimmed = text.trim()
  const codeFence = /^```(?:json)?\s*\n([\s\S]*?)\n\s*```$/m
  const match = trimmed.match(codeFence)
  if (match) return match[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return null
}

export async function readConfigFromSettings() {
  try {
    const config = await resolveAiConfig()
    return {
      apiKey: config.apiKey ?? '',
      baseUrl: config.apiUrl,
      model: config.model,
    }
  } catch {
    return { apiKey: '', baseUrl: AI_PROVIDER_DEFINITIONS.openai.defaultApiUrl ?? '', model: DEFAULT_APP_CONFIG.ai.defaultModel }
  }
}

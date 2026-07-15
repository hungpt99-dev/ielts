import { callAI, vocabularyDetailsSchema, AiConfigurationResolver } from '@ielts/ai'
import type { VocabularyDetails } from '@ielts/ai'
import type { AiUserSettings } from '@ielts/settings'
import { DEFAULT_APP_CONFIG, DEFAULT_AI_API_URL, STORAGE_KEYS, AI_PROVIDER_DEFINITIONS } from '@ielts/config'

export interface EnrichResult {
  lemma?: string
  meaning?: string
  pronunciation?: string
  partOfSpeech?: string
  exampleSentence?: string
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  wordFamily?: string[]
  cefrLevel?: string
  ieltsRelevance?: string
}

interface VocabWordForm {
  word: string
  pos: string
  meaning: string
  pronunciation: string
  verbConjugation?: {
    base: string
    pastSimple: string
    pastParticiple: string
    presentParticiple: string
    thirdPersonSingular: string
  }
}

function urlSafe(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function encodeWordForm(form: VocabWordForm): string {
  return JSON.stringify(form)
}

const _vocabAiResolver = new AiConfigurationResolver(
  {
    async getCredential() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
        if (!raw) return undefined
        const config = JSON.parse(raw)
        if (config?.ai?.providerId && config.ai.providerId !== 'openai') {
          const key = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${config.ai.providerId}`)
          return key ? { apiKey: key } : undefined
        }
        const parsed = JSON.parse(raw)
        const key = parsed?.aiApiKey || parsed?.ai?.apiKey
        return key ? { apiKey: key } : undefined
      } catch { return undefined }
    },
    async storeCredential() {},
    async clearCredential() {},
  },
  DEFAULT_APP_CONFIG.ai,
)

function getAiConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    if (!raw) return null
    const config = JSON.parse(raw)
    const ai = (config?.ai as Record<string, unknown>) ?? {}
    const providerId = (ai?.providerId as string) ?? 'openai'
    const storedKey = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${providerId}`)
    const apiKey = (ai?.apiKey as string) ?? (config?.aiApiKey as string) ?? storedKey ?? ''
    if (!apiKey) return null
    const customUrl = ai?.customApiUrl as string | undefined
    const providerDefault = AI_PROVIDER_DEFINITIONS[providerId as keyof typeof AI_PROVIDER_DEFINITIONS]?.defaultApiUrl
    const defaultUrl = providerDefault ?? DEFAULT_AI_API_URL
    const baseUrl = customUrl && urlSafe(customUrl) ? customUrl : defaultUrl
    return {
      apiKey,
      baseUrl,
      model: (ai?.model as string) ?? DEFAULT_APP_CONFIG.ai.defaultModel,
    }
  } catch {
    return null
  }
}

export async function enrichVocabulary(word: string, topic?: string): Promise<{ data: EnrichResult | null; error: string | null }> {
  const config = getAiConfig()
  if (!config) return { data: null, error: 'AI API key not configured' }

  const topicHint = topic ? ` on the topic of "${topic}"` : ''
  const systemPrompt = 'You are an IELTS vocabulary expert. Always respond with valid JSON only, no markdown.'
  const userPrompt = `Analyze the IELTS vocabulary word "${word}"${topicHint}. Return a JSON object with ALL fields filled:

Required fields:
- "meaning": clear English definition
- "pronunciation": IPA pronunciation string
- "partOfSpeech": one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner, phrasal verb, idiom
- "exampleSentence": natural IELTS-level example sentence
- "collocations": array of 2-3 common collocations
- "synonyms": array of 2-3 synonyms
- "antonyms": array of 1-2 antonyms (empty array if none exist)
- "wordFamily": array of related word forms (e.g. ["ubiquity", "ubiquitously"])
- "cefrLevel": one of: A1, A2, B1, B2, C1, C2
- "ieltsRelevance": one of: low, medium, high`

  const { content, error } = await callAI(systemPrompt, userPrompt, () => config, {
    temperature: 0.3,
    maxTokens: 2000,
  })

  if (error) return { data: null, error }
  if (!content) return { data: null, error: 'AI returned an empty response' }

  try {
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return { data: null, error: 'AI returned an unexpected format' }

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
    const validated = vocabularyDetailsSchema.safeParse(parsed)
    if (!validated.success) return { data: null, error: 'AI response had unexpected format' }

    const lemma = await normalizeToLemma(word).catch(() => word)
    const details = validated.data

    const enriched: EnrichResult = { lemma }

    if (details.meaning) enriched.meaning = details.meaning
    if (details.pronunciation) enriched.pronunciation = details.pronunciation
    if (details.partOfSpeech) enriched.partOfSpeech = details.partOfSpeech
    if (details.exampleSentence) enriched.exampleSentence = details.exampleSentence

    enriched.collocations = details.collocations
    enriched.synonyms = details.synonyms
    enriched.antonyms = details.antonyms

    if (parsed.cefrLevel && typeof parsed.cefrLevel === 'string') enriched.cefrLevel = parsed.cefrLevel
    if (parsed.ieltsRelevance && typeof parsed.ieltsRelevance === 'string') enriched.ieltsRelevance = parsed.ieltsRelevance

    if (Array.isArray(parsed.wordFamily)) {
      enriched.wordFamily = parsed.wordFamily.map((f: unknown) => {
        if (typeof f === 'string') return f
        const form = f as Record<string, unknown>
        if (form.word && form.pos) return encodeWordForm(form as unknown as VocabWordForm)
        return String(form.word || '')
      }).filter(Boolean)
    }

    return { data: enriched, error: null }
  } catch (error) {
    console.error('apps/web/src/services/ai/vocabularyEnrichmentService.ts error:', error);
    return { data: null, error: 'Failed to parse AI response' }
  }
}

export async function normalizeToLemma(word: string): Promise<string> {
  if (!word.trim()) return word
  const clean = word.trim().toLowerCase()
  const config = getAiConfig()
  if (!config) return clean

  const systemPrompt = 'You are a linguist. Respond with a single word only — the dictionary lemma form.'
  const prompt = `What is the dictionary lemma of "${clean}"? Example: running→run, better→good, mice→mouse, studied→study. Respond with only the lemma.`

  const result = await callAI(systemPrompt, prompt, () => config, {
    maxTokens: 50,
    temperature: 0,
  })

  if (result.error || !result.content) return clean
  return result.content.trim().toLowerCase().replace(/[^a-z-]/g, '') || clean
}

export async function generateExample(word: string, topic?: string): Promise<{ data: VocabularyDetails | null; error: string | null }> {
  const config = getAiConfig()
  if (!config) return { data: null, error: 'AI API key not configured' }

  const topicHint = topic ? ` on the topic of "${topic}"` : ''
  const systemPrompt = 'You are an IELTS vocabulary expert. Always respond with valid JSON only, no markdown.'
  const userPrompt = `Analyze the IELTS vocabulary word "${word}"${topicHint}. Return a JSON object with ALL of these fields:

- "meaning": clear English definition suitable for IELTS learners
- "pronunciation": IPA pronunciation (e.g. "/juːˈbɪk.wɪ.təs/")
- "partOfSpeech": one of: noun, verb, adjective, adverb
- "exampleSentence": natural IELTS-level example sentence
- "collocations": array of 2-3 common collocations
- "synonyms": array of 2-3 synonyms
- "antonyms": array of 1-2 antonyms if they exist, empty array otherwise
- "wordFamily": array of related word forms (e.g. ["ubiquity", "ubiquitously"])
- "cefrLevel": estimated CEFR level as one of: A1, A2, B1, B2, C1, C2
- "ieltsRelevance": estimated IELTS relevance as one of: low, medium, high`

  const { content, error } = await callAI(systemPrompt, userPrompt, () => config, {
    temperature: 0.3,
    maxTokens: 800,
  })

  if (error) return { data: null, error }
  if (!content) return { data: null, error: 'Empty response from AI' }

  try {
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) return { data: null, error: 'AI returned an unexpected format' }

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1))
    const validated = vocabularyDetailsSchema.safeParse(parsed)
    if (!validated.success) return { data: null, error: 'AI response had unexpected format' }

    return { data: validated.data, error: null }
  } catch (error) {
    console.error('apps/web/src/services/ai/vocabularyEnrichmentService.ts error:', error);
    return { data: null, error: 'Failed to parse AI response' }
  }
}

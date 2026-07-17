import { createAIClient, vocabularyDetailsSchema, AiConfigurationResolver } from '@ielts/ai'
import type { VocabularyDetails } from '@ielts/ai'
import { DEFAULT_APP_CONFIG } from '@ielts/config'
import { LocalStorageCredentialStore, loadUserConfiguration } from '@ielts/settings'

const aiClient = createAIClient()

export interface EnrichResult {
  lemma?: string
  meaning?: string
  translation?: string
  pronunciation?: string
  partOfSpeech?: string
  exampleSentence?: string
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  wordFamily?: string[]
  verbConjugation?: VocabWordForm['verbConjugation']
  cefrLevel?: string
  ieltsRelevance?: string
  difficulty?: string
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

function encodeWordForm(form: VocabWordForm): string {
  return JSON.stringify(form)
}

const _credentialStore = new LocalStorageCredentialStore()
const _configResolver = new AiConfigurationResolver(_credentialStore, DEFAULT_APP_CONFIG.ai)

async function getAiConfig(): Promise<{ apiKey: string; baseUrl: string; model: string } | null> {
  try {
    const userConfig = loadUserConfiguration()
    const aiSettings = userConfig.ai
    if (!aiSettings) return null
    const resolved = await _configResolver.resolve(aiSettings)
    if (!resolved.apiKey) return null
    return {
      apiKey: resolved.apiKey,
      baseUrl: resolved.apiUrl,
      model: resolved.model,
    }
  } catch {
    return null
  }
}

export async function enrichVocabulary(word: string, topic?: string): Promise<{ data: EnrichResult | null; error: string | null }> {
  const config = await getAiConfig()
  if (!config) return { data: null, error: 'AI API key not configured' }

  const topicHint = topic ? ` on the topic of "${topic}"` : ''
  const systemPrompt = 'You are an IELTS vocabulary expert. Always respond with valid JSON only, no markdown.'
  const userPrompt = `Analyze the IELTS vocabulary word "${word}"${topicHint}. Return a JSON object with ALL fields filled:

- "meaning": clear English definition
- "translation": translation in the learner's native language (empty string if unknown)
- "pronunciation": IPA pronunciation string
- "partOfSpeech": one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner, phrasal verb, idiom
- "exampleSentence": natural IELTS-level example sentence
- "collocations": array of 2-3 common collocations
- "synonyms": array of 2-3 synonyms
- "antonyms": array of 1-2 antonyms (empty array if none exist)
- "wordFamily": array of word form objects, each with: "word" (the form), "pos" (part of speech), "pronunciation" (IPA), "meaning" (short definition). For verbs also include "verbConjugation" object with base/pastSimple/pastParticiple/presentParticiple/thirdPersonSingular
- "verbConjugation": for the main word if it is a verb, object with base/pastSimple/pastParticiple/presentParticiple/thirdPersonSingular
- "cefrLevel": one of A1, A2, B1, B2, C1, C2
- "ieltsRelevance": one of low, medium, high
- "difficulty": one of easy, medium, hard`

  const { content, error } = await aiClient.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    config,
    {
      temperature: 0.3,
      maxTokens: 4000,
    },
  )

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
    if (details.translation) enriched.translation = details.translation
    if (details.pronunciation) enriched.pronunciation = details.pronunciation
    if (details.partOfSpeech) enriched.partOfSpeech = details.partOfSpeech
    if (details.exampleSentence) enriched.exampleSentence = details.exampleSentence

    enriched.collocations = details.collocations
    enriched.synonyms = details.synonyms
    enriched.antonyms = details.antonyms

    if (details.cefrLevel) enriched.cefrLevel = details.cefrLevel
    if (details.ieltsRelevance) enriched.ieltsRelevance = details.ieltsRelevance
    if (details.difficulty) enriched.difficulty = details.difficulty
    if (details.verbConjugation) enriched.verbConjugation = details.verbConjugation

    if (Array.isArray(parsed.wordFamily)) {
      enriched.wordFamily = parsed.wordFamily.map((f: unknown) => {
        if (typeof f === 'string') return f
        const form = f as Record<string, unknown>
        if (form.word && form.pos) return encodeWordForm(form as unknown as VocabWordForm)
        if (form.word) return String(form.word)
        return ''
      }).filter(Boolean) as string[]
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
  const config = await getAiConfig()
  if (!config) return clean

  const systemPrompt = 'You are a linguist. Respond with a single word only — the dictionary lemma form.'
  const prompt = `What is the dictionary lemma of "${clean}"? Example: running→run, better→good, mice→mouse, studied→study. Respond with only the lemma.`

  const result = await aiClient.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    config,
    {
      maxTokens: 50,
      temperature: 0,
    },
  )

  if (result.error || !result.content) return clean
  return result.content.trim().toLowerCase().replace(/[^a-z-]/g, '') || clean
}

export async function generateExample(word: string, topic?: string): Promise<{ data: VocabularyDetails | null; error: string | null }> {
  const config = await getAiConfig()
  if (!config) return { data: null, error: 'AI API key not configured' }

  const topicHint = topic ? ` on the topic of "${topic}"` : ''
  const systemPrompt = 'You are an IELTS vocabulary expert. Always respond with valid JSON only, no markdown.'
  const userPrompt = `Analyze the IELTS vocabulary word "${word}"${topicHint}. Return a JSON object with ALL of these fields:

- "meaning": clear English definition suitable for IELTS learners
- "translation": translation in the learner's native language (optional, empty string if unknown)
- "pronunciation": IPA pronunciation (e.g. "/juːˈbɪk.wɪ.təs/")
- "partOfSpeech": one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner, phrasal verb, idiom
- "exampleSentence": natural IELTS-level example sentence
- "collocations": array of 2-3 common collocations
- "synonyms": array of 2-3 synonyms
- "antonyms": array of 1-2 antonyms if they exist, empty array otherwise
- "wordFamily": array of related word forms. Each item must be an object with fields: "word" (the form), "pos" (part of speech), "pronunciation" (IPA string), "meaning" (short definition). For verbs also include "verbConjugation": {"base":"...","pastSimple":"...","pastParticiple":"...","presentParticiple":"...","thirdPersonSingular":"..."}. Example: [{"word":"boot","pos":"noun","pronunciation":"/buːt/","meaning":"A type of footwear"},{"word":"boot","pos":"verb","pronunciation":"/buːt/","meaning":"To start a computer","verbConjugation":{"base":"boot","pastSimple":"booted","pastParticiple":"booted","presentParticiple":"booting","thirdPersonSingular":"boots"}}]
- "verbConjugation": (only for verbs) object with base, pastSimple, pastParticiple, presentParticiple, thirdPersonSingular fields
- "cefrLevel": estimated CEFR level as one of: A1, A2, B1, B2, C1, C2
- "ieltsRelevance": estimated IELTS relevance as one of: low, medium, high
- "difficulty": estimated difficulty as one of: easy, medium, hard`

  const { content, error } = await aiClient.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    config,
    {
      temperature: 0.3,
      maxTokens: 4000,
    },
  )

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

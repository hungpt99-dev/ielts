import { createAIClient } from '@ielts/ai'
import { safeFetchProviderConfig } from '../utils/safe-chrome'

const aiClient = createAIClient()

export interface VocabWordForm {
  word: string
  pos: string
  pronunciation: string
  meaning: string
  verbConjugation?: {
    base: string
    pastSimple: string
    pastParticiple: string
    presentParticiple: string
    thirdPersonSingular: string
  }
}

export interface VocabEnrichResult {
  word: string
  meaning: string
  translation: string
  pronunciation: string
  partOfSpeech: string
  wordFamily: VocabWordForm[]
  collocations: string[]
  cefrLevel: string
  ieltsUsage: string
  contextualExamples: string[]
  synonyms: string[]
  antonyms: string[]
  exampleSentence: string
  exampleSentences?: string[]
  difficulty: string
  ieltsRelevance: string
}

export interface ExplainResult {
  explanation: string
  examples: string[]
  relatedWords: string[]
}

export interface IeltsVocabResult {
  word: string
  ieltsBand: number
  bandLevel: string
  topic: string
  usage: string[]
  tips: string
}

export interface ExampleSentencesResult {
  sentences: string[]
}

const ENRICH_SYSTEM_PROMPT = `You are an IELTS vocabulary expert. For the given word, provide comprehensive information in JSON format.
Include:
- "meaning": clear English definition suitable for IELTS learners
- "translation": translation to the learner's native language (if context indicates a language)
- "pronunciation": IPA pronunciation
- "partOfSpeech": part of speech (noun, verb, adjective, adverb, etc.)
- "wordFamily": array of related word form objects, each with:
  "word" (the form), "pos" (part of speech), "pronunciation" (IPA), "meaning" (short definition)
  For verbs also include "verbConjugation" object with base/pastSimple/pastParticiple/presentParticiple/thirdPersonSingular
- "collocations": array of 2-3 common collocations with this word
- "cefrLevel": one of A1, A2, B1, B2, C1, C2
- "synonyms": array of 2-3 synonyms
- "antonyms": array of 1-2 antonyms (empty array if none exist)
- "exampleSentence": one natural example sentence using the word
- "difficulty": one of easy, medium, hard
- "ieltsRelevance": one of low, medium, high`

export async function enrichVocabulary(word: string, context?: string): Promise<VocabEnrichResult> {
  const empty = (): VocabEnrichResult => ({
    word, meaning: '', translation: '', pronunciation: '', partOfSpeech: '',
    wordFamily: [], collocations: [], cefrLevel: '', ieltsUsage: '',
    contextualExamples: [], synonyms: [], antonyms: [], exampleSentence: '',
    difficulty: 'medium', ieltsRelevance: '',
  })

  const providerConfig = await safeFetchProviderConfig()
  if (!providerConfig.apiKey) return empty()

  const result = await aiClient.complete(
    [
      { role: 'system', content: ENRICH_SYSTEM_PROMPT },
      { role: 'user', content: `Word: ${word}${context ? `\nContext: ${context.slice(0, 500)}` : ''}` },
    ],
    providerConfig,
    { temperature: 0.3, maxTokens: 2000 },
  )
  if (result.error || !result.content) return empty()

  try {
    let content = result.content.trim()
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      content = fenceMatch[1].trim()
    }
    const parsed = JSON.parse(content) as Record<string, unknown>

    const normalizeWordFamily = (raw: unknown): VocabWordForm[] => {
      if (!Array.isArray(raw)) return []
      return raw.map((item: unknown) => {
        if (typeof item === 'string') return { word: item, pos: '', pronunciation: '', meaning: '' }
        if (typeof item === 'object' && item !== null) {
          const wf = item as Record<string, unknown>
          return {
            word: String(wf.word ?? ''),
            pos: String(wf.pos ?? ''),
            pronunciation: String(wf.pronunciation ?? ''),
            meaning: String(wf.meaning ?? ''),
            verbConjugation: wf.verbConjugation && typeof wf.verbConjugation === 'object'
              ? {
                base: String((wf.verbConjugation as Record<string, unknown>).base ?? ''),
                pastSimple: String((wf.verbConjugation as Record<string, unknown>).pastSimple ?? ''),
                pastParticiple: String((wf.verbConjugation as Record<string, unknown>).pastParticiple ?? ''),
                presentParticiple: String((wf.verbConjugation as Record<string, unknown>).presentParticiple ?? ''),
                thirdPersonSingular: String((wf.verbConjugation as Record<string, unknown>).thirdPersonSingular ?? ''),
              }
              : undefined,
          }
        }
        return { word: String(item), pos: '', pronunciation: '', meaning: '' }
      })
    }

    const wordFamily = normalizeWordFamily(parsed.wordFamily)

    return {
      word: String(parsed.word ?? word),
      meaning: String(parsed.meaning ?? ''),
      translation: String(parsed.translation ?? ''),
      pronunciation: String(parsed.pronunciation ?? ''),
      partOfSpeech: String(parsed.partOfSpeech ?? ''),
      wordFamily,
      collocations: Array.isArray(parsed.collocations) ? parsed.collocations.map(String) : [],
      cefrLevel: String(parsed.cefrLevel ?? ''),
      ieltsUsage: String(parsed.ieltsUsage ?? ''),
      contextualExamples: Array.isArray(parsed.contextualExamples) ? parsed.contextualExamples.map(String) : [],
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms.map(String) : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms.map(String) : [],
      exampleSentence: String(parsed.exampleSentence ?? ''),
      difficulty: String(parsed.difficulty || 'medium'),
      ieltsRelevance: String(parsed.ieltsRelevance || 'medium'),
    }
  } catch (error) {
    console.error('apps/extension/src/services/aiEnrichmentService.ts error:', error);
    return { ...empty(), meaning: result.content.slice(0, 200) }
  }
}

function encodeWordForm(wf: VocabWordForm): string {
  return JSON.stringify({
    word: wf.word,
    pos: wf.pos,
    pronunciation: wf.pronunciation,
    meaning: wf.meaning,
    ...(wf.verbConjugation ? { verbConjugation: wf.verbConjugation } : {}),
  })
}

export { encodeWordForm }

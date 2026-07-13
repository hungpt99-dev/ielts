import { callAI } from '@ielts/ai'
import { safeFetchProviderConfig } from '../utils/safe-chrome'

export interface VocabEnrichResult {
  word: string
  meaning: string
  translation: string
  pronunciation: string
  partOfSpeech: string
  wordFamily: string[]
  collocations: string[]
  cefrLevel: string
  ieltsUsage: string
  contextualExamples: string[]
  synonyms: string[]
  antonyms: string[]
  exampleSentence: string
  exampleSentences?: string[]
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

export async function enrichVocabulary(word: string, context?: string): Promise<VocabEnrichResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    'You are an IELTS vocabulary assistant. Return JSON with: meaning, pronunciation, partOfSpeech, wordFamily, collocations, cefrLevel, synonyms, antonyms, exampleSentence.',
    `Word: ${word}${context ? ` Context: ${context.slice(0, 500)}` : ''}`,
    () => providerConfig,
    { temperature: 0.3, maxTokens: 1000 },
  )
  if (result.error || !result.content) {
    return { word, meaning: '', translation: '', pronunciation: '', partOfSpeech: '', wordFamily: [], collocations: [], cefrLevel: '', ieltsUsage: '', contextualExamples: [], synonyms: [], antonyms: [], exampleSentence: '' }
  }
  try {
    const parsed = JSON.parse(result.content) as Record<string, unknown>
    return {
      word: String(parsed.word ?? word),
      meaning: String(parsed.meaning ?? ''),
      translation: String(parsed.translation ?? ''),
      pronunciation: String(parsed.pronunciation ?? ''),
      partOfSpeech: String(parsed.partOfSpeech ?? ''),
      wordFamily: Array.isArray(parsed.wordFamily) ? parsed.wordFamily as string[] : [],
      collocations: Array.isArray(parsed.collocations) ? parsed.collocations as string[] : [],
      cefrLevel: String(parsed.cefrLevel ?? ''),
      ieltsUsage: String(parsed.ieltsUsage ?? ''),
      contextualExamples: Array.isArray(parsed.contextualExamples) ? parsed.contextualExamples as string[] : [],
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms as string[] : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms as string[] : [],
      exampleSentence: String(parsed.exampleSentence ?? ''),
    }
  } catch {
    return { word, meaning: result.content.slice(0, 200), translation: '', pronunciation: '', partOfSpeech: '', wordFamily: [], collocations: [], cefrLevel: '', ieltsUsage: '', contextualExamples: [], synonyms: [], antonyms: [], exampleSentence: '' }
  }
}

export async function explainText(text: string, _language?: string): Promise<ExplainResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    'You are an IELTS text explainer. Explain the text simply. Return JSON: { "explanation": string, "examples": string[], "relatedWords": string[] }',
    `Explain this:\n${text.slice(0, 2000)}`,
    () => providerConfig,
    { temperature: 0.3, maxTokens: 800 },
  )
  if (result.error || !result.content) return { explanation: '', examples: [], relatedWords: [] }
  try {
    const parsed = JSON.parse(result.content) as Record<string, unknown>
    return {
      explanation: String(parsed.explanation ?? result.content),
      examples: Array.isArray(parsed.examples) ? parsed.examples as string[] : [],
      relatedWords: Array.isArray(parsed.relatedWords) ? parsed.relatedWords as string[] : [],
    }
  } catch {
    return { explanation: result.content, examples: [], relatedWords: [] }
  }
}

export async function analyzeIeltsVocab(word: string, _context?: string): Promise<IeltsVocabResult> {
  return { word, ieltsBand: 5, bandLevel: '', topic: 'general', usage: [], tips: '' }
}

export async function generateExamples(word: string, _count: number = 3): Promise<ExampleSentencesResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    'You are an IELTS vocabulary examples generator. Return JSON: { "sentences": string[] }',
    `Generate example sentences using "${word}" suitable for IELTS level.`,
    () => providerConfig,
    { temperature: 0.5, maxTokens: 500 },
  )
  if (result.error || !result.content) return { sentences: [] }
  try {
    const parsed = JSON.parse(result.content) as Record<string, unknown>
    return { sentences: Array.isArray(parsed.sentences) ? parsed.sentences as string[] : [result.content.slice(0, 200)] }
  } catch {
    return { sentences: [result.content.slice(0, 200)] }
  }
}

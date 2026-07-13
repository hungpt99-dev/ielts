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

export async function enrichVocabulary(
  word: string,
  context?: string,
): Promise<VocabEnrichResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    `You are an IELTS vocabulary assistant. Enrich the given word with detailed information.
Return JSON: {
  "word": string, "meaning": string, "pronunciation": string, "partOfSpeech": string,
  "wordFamily": string[], "collocations": string[], "cefrLevel": string,
  "ieltsUsage": string, "contextualExamples": string[], "synonyms": string[], "antonyms": string[]
}`,
    `Word: ${word}${context ? `\nContext: ${context?.slice(0, 500)}` : ''}`,
    () => providerConfig,
    { temperature: 0.3, maxTokens: 1000 },
  )
  if (result.error || !result.content) {
    return { word, meaning: '', translation: '', pronunciation: '', partOfSpeech: '', wordFamily: [], collocations: [], cefrLevel: '', ieltsUsage: '', contextualExamples: [], synonyms: [], antonyms: [], exampleSentence: '' }
  }
      try { return JSON.parse(result.content) }
      catch { return { word, meaning: result.content.slice(0, 200), translation: '', pronunciation: '', partOfSpeech: '', wordFamily: [], collocations: [], cefrLevel: '', ieltsUsage: '', contextualExamples: [], synonyms: [], antonyms: [], exampleSentence: '' } }
}

export async function explainText(
  text: string,
  language?: string,
): Promise<ExplainResult> {
  const lang = language ?? 'english'
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    `You are an IELTS text explainer. Explain the text simply.
Return JSON: { "explanation": string, "examples": string[], "relatedWords": string[] }
Respond in ${lang}.`,
    `Explain this:\n${text.slice(0, 2000)}`,
    () => providerConfig,
    { temperature: 0.3, maxTokens: 800 },
  )
  if (result.error || !result.content) return { explanation: '', examples: [], relatedWords: [] }
  try { return JSON.parse(result.content) }
  catch { return { explanation: result.content, examples: [], relatedWords: [] } }
}

export async function analyzeIeltsVocab(
  word: string,
  context?: string,
): Promise<IeltsVocabResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    `You are an IELTS vocabulary analyzer. Analyze the IELTS relevance of this word.
Return JSON: { "word": string, "ieltsBand": number (1-9), "topic": string, "usage": string }`,
    `Word: ${word}${context ? `\nContext: ${context?.slice(0, 500)}` : ''}`,
    () => providerConfig,
    { temperature: 0.3, maxTokens: 400 },
  )
  if (result.error || !result.content) return { word, ieltsBand: 5, bandLevel: '', topic: 'general', usage: [], tips: '' }
  try { return JSON.parse(result.content) }
  catch { return { word, ieltsBand: 5, bandLevel: '', topic: 'general', usage: [], tips: '' } }
}

export async function generateExamples(
  word: string,
  count: number = 3,
): Promise<ExampleSentencesResult> {
  const providerConfig = await safeFetchProviderConfig()
  const result = await callAI(
    `You are an IELTS vocabulary examples generator.
Return JSON: { "sentences": string[] }`,
    `Generate ${count} example sentences using the word "${word}" suitable for IELTS level.`,
    () => providerConfig,
    { temperature: 0.5, maxTokens: 500 },
  )
  if (result.error || !result.content) return { sentences: [] }
  try { return JSON.parse(result.content) }
  catch { return { sentences: [result.content.slice(0, 200)] } }
}

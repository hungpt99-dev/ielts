import { createAIClient } from '@ielts/ai'
import { safeFetchProviderConfig, safeStorageGet, safeStorageSet } from '../../../utils/safe-chrome'
import { StorageAdapter } from '../../infrastructure/persistence/StorageAdapter'

const aiClient = createAIClient()

export interface VerbConjugation {
  base: string
  pastSimple: string
  pastParticiple: string
  presentParticiple: string
  thirdPersonSingular: string
}

export interface VocabEntry {
  id: string
  word: string
  meaning?: string
  translation?: string
  partOfSpeech?: string
  pronunciation?: string
  exampleSentence?: string
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  wordFamily?: string[]
  verbConjugation?: VerbConjugation
  difficulty?: string
  topic?: string
  sourceVideoId: string
  sourceTimestamp: number
  sourceSentence: string
  savedAt: string
}

export interface WordDetails {
  word: string
  meaning: string
  translation?: string
  partOfSpeech?: string
  pronunciation?: string
  exampleSentence?: string
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  wordFamily?: string[]
  verbConjugation?: VerbConjugation
  difficulty?: string
  topic?: string
}

const VOCABULARY_STORAGE_KEY = 'yt-learning-vocabulary'

export class VocabularyService {
  private storageAdapter: StorageAdapter

  constructor(storageAdapter: StorageAdapter) {
    this.storageAdapter = storageAdapter
  }

  async getWordDetails(word: string, contextSentence?: string): Promise<WordDetails> {
    const existing = await this.findExisting(word)
    if (existing) {
      return this.toWordDetails(existing)
    }

    const aiResult = await this.tryFetchFromAI(word, contextSentence)
    if (aiResult) return aiResult

    return {
      word,
      meaning: '',
    }
  }

  async saveWord(
    word: string,
    sentence: string,
    videoId: string,
    timestamp: number,
  ): Promise<VocabEntry> {
    const existing = await this.findExisting(word)
    if (existing) {
      if (!existing.sourceVideoId && videoId) {
        existing.sourceVideoId = videoId
      }
      if (!existing.sourceSentence && sentence) {
        existing.sourceSentence = sentence
      }
      existing.sourceTimestamp = timestamp

      const all = await this.loadAll()
      const idx = all.findIndex(v => v.id === existing.id)
      if (idx !== -1) all[idx] = existing
      await this.saveAll(all)

      this.storageAdapter.saveVocabularyToWebApp({
        word: existing.word,
        meaning: existing.meaning ?? '',
        sourceVideoId: existing.sourceVideoId,
        sourceTimestamp: existing.sourceTimestamp,
        sourceSentence: existing.sourceSentence,
      }).catch(() => {})

      return existing
    }

    const details = await this.tryFetchFromAI(word, sentence)
    const now = new Date().toISOString()
    const entry: VocabEntry = {
      id: crypto.randomUUID(),
      word,
      meaning: details?.meaning ?? '',
      translation: details?.translation,
      partOfSpeech: details?.partOfSpeech,
      pronunciation: details?.pronunciation,
      exampleSentence: details?.exampleSentence,
      collocations: details?.collocations,
      synonyms: details?.synonyms,
      antonyms: details?.antonyms,
      wordFamily: details?.wordFamily,
      difficulty: details?.difficulty,
      topic: details?.topic,
      sourceVideoId: videoId,
      sourceTimestamp: timestamp,
      sourceSentence: sentence,
      savedAt: now,
    }

    const all = await this.loadAll()
    all.push(entry)
    await this.saveAll(all)

    this.storageAdapter.saveVocabularyToWebApp({
      word: entry.word,
      meaning: entry.meaning ?? '',
      sourceVideoId: entry.sourceVideoId,
      sourceTimestamp: entry.sourceTimestamp,
      sourceSentence: entry.sourceSentence,
    }).catch(() => {})

    return entry
  }

  async getSavedVocabularyForVideo(videoId: string): Promise<VocabEntry[]> {
    const all = await this.loadAll()
    return all.filter(v => v.sourceVideoId === videoId)
  }

  async getAllVocabulary(): Promise<VocabEntry[]> {
    return this.loadAll()
  }

  async deleteWord(id: string): Promise<void> {
    const all = await this.loadAll()
    const filtered = all.filter(v => v.id !== id)
    await this.saveAll(filtered)
  }

  private async findExisting(word: string): Promise<VocabEntry | undefined> {
    const all = await this.loadAll()
    return all.find(v => v.word.toLowerCase() === word.toLowerCase())
  }

  private async tryFetchFromAI(word: string, contextSentence?: string): Promise<WordDetails | null> {
    const systemPrompt = 'You are an English vocabulary assistant for IELTS learners. Return ONLY valid JSON, no markdown, no code fences.'
    const contextPart = contextSentence
      ? `Context sentence: "${contextSentence}"\n`
      : ''
    const userPrompt = `Analyze this word for IELTS learners: "${word}"\n${contextPart}Provide: meaning, translation, partOfSpeech, pronunciation, exampleSentence (string), collocations (array of strings), synonyms (array of strings), antonyms (array of strings), wordFamily (array of strings), difficulty (A1-C2 or IELTS band), topic. If the word is a verb, also provide verbConjugation with base, pastSimple, pastParticiple, presentParticiple, thirdPersonSingular fields.`

    const providerConfig = await safeFetchProviderConfig()
    const result = await aiClient.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      providerConfig,
      { temperature: 0.3 },
    )
    if (result.error || !result.content) return null

    try {
      const parsed = JSON.parse(result.content)
      const rawVc = parsed.verbConjugation
      const verbConjugation = rawVc && typeof rawVc === 'object' && !Array.isArray(rawVc)
        ? {
            base: String(rawVc.base || ''),
            pastSimple: String(rawVc.pastSimple || ''),
            pastParticiple: String(rawVc.pastParticiple || ''),
            presentParticiple: String(rawVc.presentParticiple || ''),
            thirdPersonSingular: String(rawVc.thirdPersonSingular || ''),
          }
        : undefined
      return {
        word: parsed.word ?? word,
        meaning: parsed.meaning ?? '',
        translation: parsed.translation,
        partOfSpeech: parsed.partOfSpeech,
        pronunciation: parsed.pronunciation,
        exampleSentence: parsed.exampleSentence,
        collocations: parsed.collocations,
        synonyms: parsed.synonyms,
        antonyms: parsed.antonyms,
        wordFamily: parsed.wordFamily,
        verbConjugation,
        difficulty: parsed.difficulty,
        topic: parsed.topic,
      }
    } catch (error) {
      console.error('apps/extension/src/youtube-learning/application/services/VocabularyService.ts error:', error);
      return null
    }
  }

  private async loadAll(): Promise<VocabEntry[]> {
    try {
      const result = await safeStorageGet<VocabEntry[]>(VOCABULARY_STORAGE_KEY)
      return result?.[VOCABULARY_STORAGE_KEY] ?? []
    } catch (error) {
      console.error('apps/extension/src/youtube-learning/application/services/VocabularyService.ts error:', error);
      return []
    }
  }

  private async saveAll(entries: VocabEntry[]): Promise<void> {
    await safeStorageSet({ [VOCABULARY_STORAGE_KEY]: entries })
  }

  private toWordDetails(entry: VocabEntry): WordDetails {
    return {
      word: entry.word,
      meaning: entry.meaning ?? '',
      translation: entry.translation,
      partOfSpeech: entry.partOfSpeech,
      pronunciation: entry.pronunciation,
      exampleSentence: entry.exampleSentence,
      collocations: entry.collocations,
      synonyms: entry.synonyms,
      antonyms: entry.antonyms,
      wordFamily: entry.wordFamily,
      difficulty: entry.difficulty,
      topic: entry.topic,
    }
  }
}

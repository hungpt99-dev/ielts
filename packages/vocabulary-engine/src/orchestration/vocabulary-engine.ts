import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { ReviewRating } from '../domain/value-objects/review-rating'
import type { VocabularyRepository, VocabReviewRepository, ClockPort } from '../ports'
import { ReviewEngine, type RateWordResult, type ReviewQueueItem } from '../application/review-engine'
import { SearchEngine, type VocabularyFilter } from '../application/search-engine'
import { AnalyticsService, type VocabularyStats } from '../application/analytics-service'
import { KnowledgeGraph } from '../application/knowledge-graph'
import { WordDetailService } from '../application/word-detail'
import { PracticeEngine, type VocabExercisePrompt } from '../application/practice-engine'
import type { WordRelationship } from '../domain/entities/word-relationship'
import type { RelatedWord } from '../domain/entities/word'

export interface VocabularyEngineDependencies {
  vocabularyRepository: VocabularyRepository
  vocabReviewRepository: VocabReviewRepository
  clock?: ClockPort
}

export interface WordInput {
  word: string
  meaning: string
  topic: string
  translation?: string
  pronunciation?: string
  partOfSpeech?: string
  exampleSentence?: string
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  wordFamily?: string[]
  personalNote?: string
  difficulty?: VocabularyEntry['difficulty']
  status?: VocabularyEntry['status']
  cefrLevel?: VocabularyEntry['cefrLevel']
  ieltsRelevance?: VocabularyEntry['ieltsRelevance']
  tags?: string[]
  sourceSentence?: string
  pageTitle?: string
  pageUrl?: string
  addedToReview?: boolean
  reviewId?: string
}

export class VocabularyEngine {
  private readonly vocabularyRepository: VocabularyRepository
  private readonly reviewEngine: ReviewEngine
  private readonly searchEngine: SearchEngine
  private readonly analytics: AnalyticsService
  private readonly knowledgeGraph: KnowledgeGraph
  private readonly practiceEngine: PracticeEngine
  private readonly wordDetail: WordDetailService

  constructor(deps: VocabularyEngineDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
    this.reviewEngine = new ReviewEngine(deps)
    this.searchEngine = new SearchEngine(deps)
    this.analytics = new AnalyticsService(deps)
    this.knowledgeGraph = new KnowledgeGraph(deps)
    this.practiceEngine = new PracticeEngine()
    this.wordDetail = new WordDetailService(deps)
  }

  // ── Word CRUD ──────────────────────────────────────────────────────

  async getAllWords(): Promise<VocabularyEntry[]> {
    return this.vocabularyRepository.findAll()
  }

  async getWordById(id: string): Promise<VocabularyEntry | undefined> {
    return this.vocabularyRepository.findById(id)
  }

  async addWord(input: WordInput): Promise<VocabularyEntry> {
    const all = await this.vocabularyRepository.findAll()
    const lowered = input.word.toLowerCase()
    const duplicate = all.find(e => e.word.toLowerCase() === lowered)

    if (duplicate) {
      const now = new Date().toISOString()
      const merged: VocabularyEntry = {
        ...duplicate,
        ...input,
        id: duplicate.id,
        createdAt: duplicate.createdAt,
        updatedAt: now,
      }
      await this.vocabularyRepository.bulkUpsert([merged])
      return merged
    }

    const now = new Date().toISOString()
    return this.vocabularyRepository.create({
      word: input.word,
      meaning: input.meaning,
      translation: input.translation ?? '',
      pronunciation: input.pronunciation ?? '',
      partOfSpeech: input.partOfSpeech ?? '',
      topic: input.topic,
      exampleSentence: input.exampleSentence ?? '',
      collocations: input.collocations ?? [],
      synonyms: input.synonyms ?? [],
      antonyms: input.antonyms ?? [],
      wordFamily: input.wordFamily ?? [],
      personalNote: input.personalNote ?? '',
      difficulty: input.difficulty ?? 'medium',
      status: input.status ?? 'new',
      cefrLevel: input.cefrLevel ?? '',
      ieltsRelevance: input.ieltsRelevance ?? '',
      tags: input.tags ?? [],
      sourceSentence: input.sourceSentence ?? '',
      pageTitle: input.pageTitle ?? '',
      pageUrl: input.pageUrl ?? '',
      addedToReview: input.addedToReview ?? true,
      reviewId: input.reviewId ?? '',
      createdAt: now,
      updatedAt: now,
    })
  }

  async updateWord(id: string, changes: Partial<VocabularyEntry>): Promise<void> {
    await this.vocabularyRepository.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    })
  }

  async deleteWord(id: string): Promise<void> {
    await this.vocabularyRepository.delete(id)
  }

  async upsertWord(word: string, changes: Partial<WordInput>): Promise<VocabularyEntry> {
    const existing = await this.searchByWord(word)
    const found = existing.find(e => e.word.toLowerCase() === word.toLowerCase())
    if (found) {
      const now = new Date().toISOString()
      const merged: VocabularyEntry = { ...found, ...changes, updatedAt: now }
      await this.vocabularyRepository.bulkUpsert([merged])
      return merged
    }
    const meaning = changes.meaning ?? ''
    if (!meaning) {
      throw new Error(`Cannot create vocabulary entry for "${word}" without a meaning`)
    }
    return this.addWord({
      word,
      meaning,
      topic: changes.topic ?? 'general',
      ...changes,
    })
  }

  // ── Review ─────────────────────────────────────────────────────────

  buildReviewQueue(): Promise<ReviewQueueItem[]> {
    return this.reviewEngine.buildReviewQueue()
  }

  getDueReviewItems(): Promise<ReviewQueueItem[]> {
    return this.reviewEngine.getDueReviewItems()
  }

  rateWord(entry: VocabularyEntry, rating: ReviewRating): Promise<RateWordResult> {
    return this.reviewEngine.rateWord(entry, rating)
  }

  getDueCount(): Promise<number> {
    return this.reviewEngine.getDueCount()
  }

  // ── Search ─────────────────────────────────────────────────────────

  search(filter: VocabularyFilter = {}): Promise<VocabularyEntry[]> {
    return this.searchEngine.search(filter)
  }

  searchByWord(query: string): Promise<VocabularyEntry[]> {
    return this.searchEngine.searchByWord(query)
  }

  // ── Analytics ──────────────────────────────────────────────────────

  getStats(): Promise<VocabularyStats> {
    return this.analytics.getStats()
  }

  // ── Knowledge Graph ────────────────────────────────────────────────

  getRelationships(): Promise<WordRelationship[]> {
    return this.knowledgeGraph.buildRelationships()
  }

  getRelatedWords(word: string): Promise<WordRelationship[]> {
    return this.knowledgeGraph.getRelatedWords(word)
  }

  getWordsByTopic(topic: string): Promise<VocabularyEntry[]> {
    return this.knowledgeGraph.findWordsRelatedByTopic(topic)
  }

  // ── Practice ───────────────────────────────────────────────────────

  generateExercises(entries: VocabularyEntry[], count?: number): VocabExercisePrompt[] {
    return this.practiceEngine.generateExercisesFromVocabulary(entries, count)
  }

  // ── Word Detail ────────────────────────────────────────────────────

  async getWordDetail(id: string): Promise<{
    word: VocabularyEntry
    review: VocabReviewEntry | null
    relatedWords: RelatedWord[]
  } | undefined> {
    const relationships = await this.knowledgeGraph.buildRelationships()
    return this.wordDetail.getWordDetail(id, relationships)
  }
}

export function createVocabularyEngine(deps: VocabularyEngineDependencies): VocabularyEngine {
  return new VocabularyEngine(deps)
}

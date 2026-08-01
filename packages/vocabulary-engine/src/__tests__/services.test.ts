import { describe, it, expect, beforeEach } from 'vitest'
import { SearchEngine } from '../application/search-engine'
import { AnalyticsService } from '../application/analytics-service'
import { KnowledgeGraph } from '../application/knowledge-graph'
import { PracticeEngine } from '../application/practice-engine'
import { WordDetailService } from '../application/word-detail'
import { InMemoryVocabularyRepository, InMemoryVocabReviewRepository } from '../infrastructure/in-memory-repositories'
import type { VocabularyEntry } from '@ielts/storage'

function makeVocab(overrides: Partial<VocabularyEntry> = {}): Omit<VocabularyEntry, 'id'> & { id?: string } {
  const now = new Date().toISOString()
  return {
    word: 'test',
    meaning: 'a procedure intended to establish quality',
    translation: '',
    pronunciation: '',
    partOfSpeech: 'noun',
    topic: 'general',
    exampleSentence: 'This is a test.',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium',
    status: 'new',
    cefrLevel: '',
    ieltsRelevance: '',
    tags: [],
    sourceSentence: '',
    pageTitle: '',
    pageUrl: '',
    addedToReview: true,
    reviewId: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('SearchEngine', () => {
  let repository: InMemoryVocabularyRepository
  let search: SearchEngine

  beforeEach(async () => {
    repository = new InMemoryVocabularyRepository()
    await repository.create(makeVocab({ word: 'apple', topic: 'food', status: 'learning', difficulty: 'easy' }))
    await repository.create(makeVocab({ word: 'car', topic: 'transport', status: 'new', difficulty: 'hard' }))
    search = new SearchEngine({ vocabularyRepository: repository })
  })

  it('searches by word', async () => {
    const results = await search.searchByWord('app')
    expect(results.map(e => e.word)).toEqual(['apple'])
  })

  it('filters by topic and status', async () => {
    const results = await search.search({ topic: 'transport' })
    expect(results.map(e => e.word)).toEqual(['car'])
  })

  it('filters by difficulty', async () => {
    const results = await search.search({ difficulty: 'easy' })
    expect(results.map(e => e.word)).toEqual(['apple'])
  })
})

describe('AnalyticsService', () => {
  it('computes stats from entries and reviews', async () => {
    const vocabularyRepository = new InMemoryVocabularyRepository()
    const vocabReviewRepository = new InMemoryVocabReviewRepository()
    await vocabularyRepository.create(makeVocab({ word: 'a', status: 'new' }))
    await vocabularyRepository.create(makeVocab({ word: 'b', status: 'learning' }))
    await vocabularyRepository.create(makeVocab({ word: 'c', status: 'mastered', difficulty: 'hard' }))
    const analytics = new AnalyticsService({ vocabularyRepository, vocabReviewRepository })
    const stats = await analytics.computeStats()
    expect(stats.total).toBe(3)
    expect(stats.newCount).toBe(1)
    expect(stats.learning).toBe(1)
    expect(stats.mastered).toBe(1)
    expect(stats.hardCount).toBe(1)
  })
})

describe('KnowledgeGraph', () => {
  it('builds relationships from stored fields', async () => {
    const repository = new InMemoryVocabularyRepository()
    await repository.create(makeVocab({
      word: 'happy',
      synonyms: ['joyful'],
      antonyms: ['sad'],
      collocations: ['smile'],
      wordFamily: ['happily'],
      topic: 'emotion',
    }))
    await repository.create(makeVocab({ word: 'joyful', topic: 'emotion' }))
    await repository.create(makeVocab({ word: 'sad', topic: 'emotion' }))
    await repository.create(makeVocab({ word: 'smile', topic: 'emotion' }))
    await repository.create(makeVocab({ word: 'happily', topic: 'emotion' }))

    const graph = new KnowledgeGraph({ vocabularyRepository: repository })
    const rels = await graph.buildRelationships()
    const happyRels = rels.filter(r => r.sourceWord === 'happy')
    expect(happyRels.map(r => `${r.targetWord}:${r.relationshipType}`).sort()).toEqual([
      'happily:word-family',
      'joyful:synonym',
      'sad:antonym',
      'smile:collocation',
    ])
  })

  it('ignores relationships to words not in the collection', async () => {
    const repository = new InMemoryVocabularyRepository()
    await repository.create(makeVocab({ word: 'happy', synonyms: ['unknown-word'] }))
    const graph = new KnowledgeGraph({ vocabularyRepository: repository })
    const rels = await graph.buildRelationships()
    expect(rels).toHaveLength(0)
  })
})

describe('WordDetailService', () => {
  it('resolves related words from relationships', async () => {
    const vocabularyRepository = new InMemoryVocabularyRepository()
    const vocabReviewRepository = new InMemoryVocabReviewRepository()
    const happy = await vocabularyRepository.create(makeVocab({ word: 'happy' }))
    await vocabularyRepository.create(makeVocab({ word: 'joyful' }))

    const service = new WordDetailService({ vocabularyRepository, vocabReviewRepository })
    const detail = await service.getWordDetail(happy.id, [
      { sourceWord: 'happy', targetWord: 'joyful', relationshipType: 'synonym' },
    ])
    expect(detail?.relatedWords).toEqual([
      { word: 'joyful', relationshipType: 'synonym' },
    ])
  })

  it('returns undefined for a missing word', async () => {
    const service = new WordDetailService({
      vocabularyRepository: new InMemoryVocabularyRepository(),
      vocabReviewRepository: new InMemoryVocabReviewRepository(),
    })
    const detail = await service.getWordDetail('missing-id', [])
    expect(detail).toBeUndefined()
  })
})

describe('PracticeEngine', () => {
  it('generates fallback prompts when no words are provided', () => {
    const engine = new PracticeEngine()
    const prompts = engine.generateExercisesFromVocabulary([])
    expect(prompts).toHaveLength(1)
    expect(prompts[0].wordsToUse).toHaveLength(5)
  })

  it('generates prompts from saved words', () => {
    const engine = new PracticeEngine()
    const entries = [
      makeVocab({ word: 'sustainable', meaning: 'able to continue', topic: 'environment' }),
      makeVocab({ word: 'pollution', meaning: 'harmful waste', topic: 'environment' }),
    ] as VocabularyEntry[]
    const prompts = engine.generateExercisesFromVocabulary(entries, 2)
    expect(prompts).toHaveLength(2)
    expect(prompts.flatMap(p => p.wordsToUse)).toEqual(['sustainable', 'pollution'])
    expect(prompts[0].topic).toContain('environment')
  })
})

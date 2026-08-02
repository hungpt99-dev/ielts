import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Word, VocabularyState } from '../../domain'
import type { ReviewHistoryEntry, SpacedRepetitionInfo, ReviewRecord, MasteryProfile } from '../../domain/policies'
import {
  AntonymSchema,
  CollocationSchema,
  MasteryProfileSchema,
  ReviewRecordSchema,
  SearchIndexStatsSchema,
  SearchInputSchema,
  SearchResultSchema,
  SpacedRepetitionInfoSchema,
  SynonymSchema,
  VocabularyStateSchema,
  WordSchema,
} from '../index'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

export const _wordTypeMatches: Equal<Word, z.infer<typeof WordSchema>> = true
export const _vocabularyStateTypeMatches: Equal<VocabularyState, z.infer<typeof VocabularyStateSchema>> = true
export const _spacedRepetitionTypeMatches: Equal<SpacedRepetitionInfo, z.infer<typeof SpacedRepetitionInfoSchema>> = true
export const _reviewHistoryTypeMatches: Equal<ReviewHistoryEntry, z.infer<typeof SpacedRepetitionInfoSchema>['history'][number]> = true
export const _reviewRecordTypeMatches: Equal<ReviewRecord, z.infer<typeof ReviewRecordSchema>> = true
export const _masteryProfileTypeMatches: Equal<MasteryProfile, z.infer<typeof MasteryProfileSchema>> = true
export const _collocationTypeMatches: Equal<import('../../domain/value-objects').Collocation, z.infer<typeof CollocationSchema>> = true
export const _synonymTypeMatches: Equal<import('../../domain/value-objects').Synonym, z.infer<typeof SynonymSchema>> = true
export const _antonymTypeMatches: Equal<import('../../domain/value-objects').Antonym, z.infer<typeof AntonymSchema>> = true

const now = new Date('2026-01-01T00:00:00.000Z')

const wordFixture: Word = {
  id: 'w1',
  text: 'ubiquitous',
  normalizedWord: 'ubiquitous',
  lemma: 'ubiquitous',
  partOfSpeech: 'adjective',
  definition: 'Present everywhere.',
  cefrLevel: 'C2',
  ieltsRelevance: 'high',
  collocations: [
    { id: 'c1', pattern: 'ubiquitous in', wordId: 'w1', frequency: 0.9, register: 'ACADEMIC', examples: ['x'] },
  ],
  synonyms: [
    { id: 's1', wordId: 'w1', synonymOf: 'widespread', similarityScore: 0.8 },
  ],
  antonyms: [
    { id: 'a1', wordId: 'w1', antonymOf: 'rare', type: 'GRADABLE' },
  ],
  wordFamily: [
    { id: 'wf1', rootId: 'w1', word: 'ubiquitously', partOfSpeech: 'adverb', suffix: '-ly', definition: 'In a ubiquitous manner' },
  ],
  commonMistakes: [
    { id: 'cm1', wordId: 'w1', mistake: 'ubiquitus', correction: 'ubiquitous', explanation: 'Spelling', type: 'SPELLING' },
  ],
  usageExamples: [
    { id: 'ue1', wordId: 'w1', text: 'Smartphones are ubiquitous.', source: 'READING', register: 'NEUTRAL', isIeltsExample: true },
  ],
  inflections: [],
  tags: ['technology'],
  topics: ['society'],
  createdAt: now,
  updatedAt: now,
}

const spacedRepetitionFixture: SpacedRepetitionInfo = {
  interval: 6,
  easeFactor: 2.5,
  repetitions: 2,
  stability: 60,
  difficulty: 0.3,
  nextReviewDate: now,
  lastReviewDate: now,
  history: [
    { date: now, rating: 'GOOD', responseTimeMs: 2500, confidenceScore: 0.5, context: 'FLASHCARD' },
  ],
}

const vocabularyStateFixture: VocabularyState = {
  wordId: 'w1',
  lifecyclePhase: 'REVIEWING',
  masteryScore: 50,
  spacedRepetitionInfo: spacedRepetitionFixture,
  interactionCount: 5,
  correctProductionCount: 2,
  consecutiveAgainRatings: 0,
  createdAt: now,
  updatedAt: now,
}

const masteryProfileFixture: MasteryProfile = {
  wordId: 'w1',
  skills: {
    READING: { score: 60, lastInteractionDate: now },
    LISTENING: { score: 40, lastInteractionDate: null },
    WRITING: { score: 20, lastInteractionDate: now },
    SPEAKING: { score: 30, lastInteractionDate: null },
  },
  overallMastery: 42,
}

describe('word.schema', () => {
  it('accepts a valid word', () => {
    expect(WordSchema.safeParse(wordFixture).success).toBe(true)
  })

  it('rejects an empty lemma', () => {
    expect(WordSchema.safeParse({ ...wordFixture, lemma: '' }).success).toBe(false)
  })

  it('rejects an invalid CEFR level', () => {
    expect(WordSchema.safeParse({ ...wordFixture, cefrLevel: 'C3' }).success).toBe(false)
  })

  it('rejects an invalid ieltsRelevance', () => {
    expect(WordSchema.safeParse({ ...wordFixture, ieltsRelevance: 'very-high' }).success).toBe(false)
  })

  it('rejects an invalid partOfSpeech', () => {
    expect(WordSchema.safeParse({ ...wordFixture, partOfSpeech: 'noun-ish' }).success).toBe(false)
  })
})

describe('vocabulary-state.schema', () => {
  it('accepts a valid vocabulary state', () => {
    expect(VocabularyStateSchema.safeParse(vocabularyStateFixture).success).toBe(true)
  })

  it('rejects masteryScore out of range', () => {
    expect(VocabularyStateSchema.safeParse({ ...vocabularyStateFixture, masteryScore: 101 }).success).toBe(false)
    expect(VocabularyStateSchema.safeParse({ ...vocabularyStateFixture, masteryScore: -1 }).success).toBe(false)
  })

  it('rejects an invalid lifecycle phase', () => {
    expect(VocabularyStateSchema.safeParse({ ...vocabularyStateFixture, lifecyclePhase: 'EXPLORING' }).success).toBe(false)
  })
})

describe('spaced-repetition.schema', () => {
  it('accepts a valid spaced repetition info', () => {
    expect(SpacedRepetitionInfoSchema.safeParse(spacedRepetitionFixture).success).toBe(true)
  })

  it('rejects a non-positive interval', () => {
    expect(SpacedRepetitionInfoSchema.safeParse({ ...spacedRepetitionFixture, interval: 0 }).success).toBe(false)
    expect(SpacedRepetitionInfoSchema.safeParse({ ...spacedRepetitionFixture, interval: -2 }).success).toBe(false)
  })

  it('rejects an easeFactor below 1.3', () => {
    expect(SpacedRepetitionInfoSchema.safeParse({ ...spacedRepetitionFixture, easeFactor: 1.2 }).success).toBe(false)
  })

  it('rejects a negative responseTimeMs in history', () => {
    const history = [{ date: now, rating: 'GOOD', responseTimeMs: -100, confidenceScore: 0.5, context: 'FLASHCARD' }]
    expect(SpacedRepetitionInfoSchema.safeParse({ ...spacedRepetitionFixture, history }).success).toBe(false)
  })

  it('rejects an invalid review rating', () => {
    const history = [{ date: now, rating: 'AWESOME', responseTimeMs: 100, confidenceScore: 0.5, context: 'FLASHCARD' }]
    expect(SpacedRepetitionInfoSchema.safeParse({ ...spacedRepetitionFixture, history }).success).toBe(false)
  })
})

describe('review-record.schema', () => {
  it('accepts a valid review record', () => {
    expect(ReviewRecordSchema.safeParse({ skill: 'READING', date: now, correct: true }).success).toBe(true)
  })

  it('rejects an invalid skill', () => {
    expect(ReviewRecordSchema.safeParse({ skill: 'GRAMMAR', date: now, correct: true }).success).toBe(false)
  })
})

describe('mastery-profile.schema', () => {
  it('accepts a valid mastery profile', () => {
    expect(MasteryProfileSchema.safeParse(masteryProfileFixture).success).toBe(true)
  })

  it('rejects a per-skill score above 100', () => {
    const profile = {
      ...masteryProfileFixture,
      skills: { ...masteryProfileFixture.skills, READING: { score: 101, lastInteractionDate: null } },
    }
    expect(MasteryProfileSchema.safeParse(profile).success).toBe(false)
  })

  it('rejects an overall mastery out of range', () => {
    expect(MasteryProfileSchema.safeParse({ ...masteryProfileFixture, overallMastery: -5 }).success).toBe(false)
  })
})

describe('relationship schemas', () => {
  it('accepts valid collocation, synonym and antonym', () => {
    expect(CollocationSchema.safeParse(wordFixture.collocations[0]).success).toBe(true)
    expect(SynonymSchema.safeParse(wordFixture.synonyms[0]).success).toBe(true)
    expect(AntonymSchema.safeParse(wordFixture.antonyms[0]).success).toBe(true)
  })

  it('rejects a negative collocation frequency', () => {
    expect(CollocationSchema.safeParse({ ...wordFixture.collocations[0], frequency: -0.1 }).success).toBe(false)
  })

  it('rejects a similarityScore out of range', () => {
    expect(SynonymSchema.safeParse({ ...wordFixture.synonyms[0], similarityScore: 1.5 }).success).toBe(false)
  })

  it('rejects an invalid antonym type', () => {
    expect(AntonymSchema.safeParse({ ...wordFixture.antonyms[0], type: 'SYNONYMOUS' }).success).toBe(false)
  })
})

describe('search.schema', () => {
  it('accepts valid search input', () => {
    expect(SearchInputSchema.safeParse({ query: 'u', limit: 10 }).success).toBe(true)
  })

  it('rejects an empty query', () => {
    expect(SearchInputSchema.safeParse({ query: '   ' }).success).toBe(false)
  })

  it('accepts a search result', () => {
    expect(SearchResultSchema.safeParse({ word: wordFixture, score: 0.9 }).success).toBe(true)
  })

  it('rejects a search score out of range', () => {
    expect(SearchResultSchema.safeParse({ word: wordFixture, score: 1.1 }).success).toBe(false)
  })

  it('accepts search index stats', () => {
    const stats = { totalWords: 10, totalSynonyms: 5, totalAntonyms: 2, totalCollocations: 8, indexedAt: now }
    expect(SearchIndexStatsSchema.safeParse(stats).success).toBe(true)
  })

  it('rejects negative index stats', () => {
    const stats = { totalWords: -1, totalSynonyms: 0, totalAntonyms: 0, totalCollocations: 0, indexedAt: now }
    expect(SearchIndexStatsSchema.safeParse(stats).success).toBe(false)
  })
})

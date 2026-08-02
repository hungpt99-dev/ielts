import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import {
  VOCABULARY_STORES,
  VOCABULARY_SCHEMA_VERSION,
  vocabularyTableSchemas,
} from '../schema-vocabulary'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

function fixtures(): Record<string, unknown> {
  const now = new Date().toISOString()
  return {
    words: {
      id: 'word-1',
      text: 'abandon',
      normalizedWord: 'abandon',
      lemma: 'abandon',
      language: 'en',
      partOfSpeech: 'verb',
      definition: 'to leave completely',
      simplifiedMeaning: '',
      pronunciation: '',
      translation: '',
      cefr: 'B1',
      ieltsFrequency: 'high',
      topic: 'travel',
      difficulty: 'medium',
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
    vocabularyStates: {
      id: 'vs-1',
      wordId: 'word-1',
      lifecycle: 'DISCOVERED',
      masteryScore: 12,
      addedAt: now,
      discoveredFrom: 'READING',
      tags: ['exam'],
      interactionCount: 2,
      correctProductionCount: 1,
      consecutiveAgainRatings: 0,
      lastInteractionAt: now,
      lastStudyAt: null,
      createdAt: now,
      updatedAt: now,
    },
    interactions: {
      id: 'int-1',
      wordId: 'word-1',
      type: 'EXPOSURE',
      skill: 'READING',
      correct: true,
      timestamp: now,
    },
    spacedRepetitionInfo: {
      id: 'sr-1',
      wordId: 'word-1',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      stability: 10,
      difficulty: 0.5,
      nextReviewAt: now,
      lastReviewedAt: now,
      totalReviews: 0,
      history: [],
    },
    reviewRecords: {
      id: 'rr-1',
      wordId: 'word-1',
      reviewedAt: now,
      rating: 'GOOD',
      reviewMode: 'FLASHCARD',
      responseTimeMs: 2000,
      confidenceScore: 0.6,
      skill: 'READING',
      correct: true,
    },
    masteryProfiles: {
      id: 'mp-1',
      wordId: 'word-1',
      skills: {
        READING: { score: 50, lastInteractionDate: now },
        LISTENING: { score: 40, lastInteractionDate: now },
        WRITING: { score: 30, lastInteractionDate: null },
        SPEAKING: { score: 30, lastInteractionDate: null },
      },
      overallMastery: 35,
      updatedAt: now,
    },
    collocations: {
      id: 'col-1',
      wordId: 'word-1',
      pattern: 'abandon + ship',
      frequency: 5,
      register: 'NEUTRAL',
      examples: ['They had to abandon ship.'],
    },
    synonyms: {
      id: 'syn-1',
      wordId: 'word-1',
      synonymOf: 'desert',
      nuance: '',
      similarityScore: 0.8,
    },
    antonyms: {
      id: 'ant-1',
      wordId: 'word-1',
      antonymOf: 'keep',
      type: 'GRADABLE',
    },
    wordFamily: {
      id: 'wf-1',
      rootId: 'word-1',
      word: 'abandonment',
      partOfSpeech: 'noun',
      suffix: 'ment',
      definition: 'the act of abandoning',
      pronunciation: '',
    },
    commonMistakes: {
      id: 'cm-1',
      wordId: 'word-1',
      mistake: 'abandond',
      correction: 'abandoned',
      explanation: 'missing an a',
      type: 'SPELLING',
    },
    usageExamples: {
      id: 'ue-1',
      wordId: 'word-1',
      text: 'The crew abandoned the burning ship.',
      source: 'READING',
      sourceId: '',
      timestamp: '',
      register: 'NEUTRAL',
      context: '',
      isIeltsExample: true,
    },
    inflections: {
      id: 'inf-1',
      wordId: 'word-1',
      form: 'abandoned',
      type: 'PAST',
    },
    wordConnections: {
      id: 'wc-1',
      fromWordId: 'word-1',
      toWordId: 'word-2',
      relationship: 'SYNONYM',
      weight: 0.8,
      metadata: {},
    },
    topicClusters: {
      id: 'tc-1',
      topic: 'travel',
      centralWords: ['abandon'],
      relatedWords: ['journey'],
      depth: 1,
    },
    searchIndex: {
      id: 'si-1',
      wordId: 'word-1',
      tokens: ['abandon'],
      ngrams: ['aba', 'aban', 'aband'],
      indexedAt: now,
    },
  }
}

describe('schema-vocabulary', () => {
  beforeEach(() => {
    setupDb()
  })

  afterEach(() => {
    destroyDb()
  })

  it('registers all 16 tables in the bumped database version', () => {
    expect(VOCABULARY_STORES).toHaveProperty('words')
    expect(APP_SCHEMA.currentVersion).toBe(VOCABULARY_SCHEMA_VERSION)

    const latest = APP_SCHEMA.versions.find(v => v.number === APP_SCHEMA.currentVersion)
    expect(latest).toBeDefined()
    expect(Object.keys(latest!.stores)).toHaveLength(16)
    for (const [name, schema] of Object.entries(VOCABULARY_STORES)) {
      expect(latest!.stores[name]).toBe(schema)
    }
  })

  it('defines a row schema for each table', () => {
    expect(Object.keys(vocabularyTableSchemas)).toHaveLength(16)
    for (const name of Object.keys(VOCABULARY_STORES)) {
      expect(vocabularyTableSchemas[name]).toBeDefined()
    }
  })

  it('leaves existing tables untouched', () => {
    const version1 = APP_SCHEMA.versions.find(v => v.number === 1)
    expect(version1).toBeDefined()
    expect(version1!.stores['vocabulary']).toBeDefined()
    expect(version1!.stores['vocabularyReviews']).toBeDefined()

    const latest = APP_SCHEMA.versions.find(v => v.number === APP_SCHEMA.currentVersion)!
    expect(latest.stores['vocabulary']).toBeUndefined()
    expect(latest.stores['vocabularyReviews']).toBeUndefined()
  })

  it('can open and write to every new table', async () => {
    const db = getDb()
    const data = fixtures()

    for (const [name, row] of Object.entries(data)) {
      const schema = vocabularyTableSchemas[name]
      const parsed = schema.safeParse(row)
      expect(parsed.success, `${name} row should validate`).toBe(true)

      await db.table(name).add(row)
      const stored = await db.table(name).get((row as { id: string }).id)
      expect(stored).toBeDefined()
      expect(stored?.id).toBe((row as { id: string }).id)
    }
  })
})

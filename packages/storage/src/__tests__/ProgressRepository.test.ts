import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { ProgressRecordRepository, TopicProgressRepository, MockTestRepository, GrammarNoteRepository } from '../repositories'
import type { ProgressRecord, TopicProgress, MockTestEntry, GrammarNote } from '../repositories/ProgressRepository'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('progressRecords').clear()
  await db.table('topicsProgress').clear()
  await db.table('mockTests').clear()
  await db.table('grammarNotes').clear()
}

function makeProgress(overrides: Partial<ProgressRecord> = {}): Omit<ProgressRecord, 'id'> {
  const now = new Date().toISOString()
  return {
    date: now,
    skill: 'reading',
    metric: 'accuracy',
    value: 75,
    unit: 'percent',
    notes: '',
    tags: [],
    createdAt: now,
    ...overrides,
  } as Omit<ProgressRecord, 'id'>
}

function makeTopicProgress(overrides: Partial<TopicProgress> = {}): Omit<TopicProgress, 'id'> {
  const now = new Date().toISOString()
  return {
    topicId: 'topic-1',
    topic: 'Education',
    progressPercent: 50,
    vocabularyCount: 10,
    readingCount: 5,
    listeningCount: 3,
    writingCount: 2,
    speakingCount: 1,
    weakPoints: [],
    lastReviewedAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<TopicProgress, 'id'>
}

function makeMockTest(overrides: Partial<MockTestEntry> = {}): Omit<MockTestEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    date: now,
    listeningScore: 6.5,
    readingScore: 7.0,
    writingBand: 6.0,
    speakingBand: 6.5,
    overallBand: 6.5,
    notes: '',
    weakAreas: [],
    improvementPlan: '',
    createdAt: now,
    ...overrides,
  } as Omit<MockTestEntry, 'id'>
}

function makeGrammarNote(overrides: Partial<GrammarNote> = {}): Omit<GrammarNote, 'id'> {
  const now = new Date().toISOString()
  return {
    topic: 'Present Perfect',
    explanation: 'Used for past actions with present relevance.',
    exampleSentences: [],
    commonMistakes: [],
    correctedExamples: [],
    personalNote: '',
    relatedSkill: 'writing',
    status: 'reviewing',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<GrammarNote, 'id'>
}

describe('ProgressRecordRepository', () => {
  let repo: ProgressRecordRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new ProgressRecordRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByDateRange', () => {
    it('finds records within date range', async () => {
      await repo.create(makeProgress({ date: '2024-01-15T00:00:00.000Z' }))
      await repo.create(makeProgress({ date: '2024-06-15T00:00:00.000Z' }))
      const results = await repo.findByDateRange('2024-01-01', '2024-03-31')
      expect(results).toHaveLength(1)
    })
  })

  describe('findBySkill', () => {
    it('filters by skill', async () => {
      await repo.create(makeProgress({ skill: 'reading', metric: 'accuracy', value: 80 }))
      await repo.create(makeProgress({ skill: 'listening', metric: 'accuracy', value: 70 }))
      const results = await repo.findBySkill('reading')
      expect(results).toHaveLength(1)
      expect(results[0].value).toBe(80)
    })
  })
})

describe('TopicProgressRepository', () => {
  let repo: TopicProgressRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new TopicProgressRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByTopicId', () => {
    it('finds by topic ID (via direct table query)', async () => {
      const created = await repo.create(makeTopicProgress({ topicId: 'edu', topic: 'Education' }))
      expect(created.topicId).toBe('edu')
      const all = await repo.findAll()
      expect(all.length).toBeGreaterThanOrEqual(1)
      expect(all.some(t => t.topicId === 'edu')).toBe(true)
    })
  })
})

describe('MockTestRepository', () => {
  let repo: MockTestRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new MockTestRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  it('creates and retrieves mock tests', async () => {
    const entry = await repo.create(makeMockTest({ overallBand: 7.5 }))
    expect(entry.overallBand).toBe(7.5)
    const found = await repo.findById(entry.id)
    expect(found).toBeDefined()
  })
})

describe('GrammarNoteRepository', () => {
  let repo: GrammarNoteRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new GrammarNoteRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByTopic', () => {
    it('finds by topic', async () => {
      await repo.create(makeGrammarNote({ topic: 'Past Simple' }))
      const results = await repo.findByTopic('Past Simple')
      expect(results).toHaveLength(1)
    })
  })

  describe('findByStatus', () => {
    it('filters by status', async () => {
      await repo.create(makeGrammarNote({ topic: 'Weak Topic', status: 'weak' }))
      await repo.create(makeGrammarNote({ topic: 'Mastered Topic', status: 'mastered' }))
      const results = await repo.findByStatus('mastered')
      expect(results).toHaveLength(1)
    })
  })
})

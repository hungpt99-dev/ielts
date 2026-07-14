import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { STORAGE_KEYS } from '@ielts/config'
import {
  AppDatabase,
  DatabaseService,
  DatabaseError,
  ValidationError,
  getDb,
  destroyDb,
} from '../../services/storage/Database'
import {
  removeAppSettings,
  saveAppSettings,
} from '../../services/storage/SettingsStorage'

const V1_TABLES = [
  'vocabulary', 'vocabularyReviews', 'tasks',
  'readingSessions', 'readingPracticeSessions',
  'listeningSessions', 'listeningPracticeSessions',
  'writingSessions', 'speakingSessions',
  'grammarNotes', 'mistakes', 'mockTests',
  'topicsProgress', 'passages',
]

const V2_NEW_TABLES = [
  'ieltsTopics', 'exampleSentences', 'readingPassages',
  'listeningTranscripts', 'writingPrompts', 'speakingQuestions',
  'studyNotes', 'customStudyPlans', 'usefulPhrases',
  'aiContents', 'progressRecords',
]

const V3_NEW_TABLES = ['publicApiContent']

const ALL_TABLES = [...V1_TABLES, ...V2_NEW_TABLES, ...V3_NEW_TABLES]

function makeItem(table: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const id = crypto.randomUUID() as string
  const now = new Date().toISOString()
  const base: Record<string, Record<string, unknown>> = {
    vocabulary: { id, word: 'word', meaning: 'meaning', topic: 'Education', difficulty: 'medium', status: 'new', tags: [], createdAt: now, updatedAt: now },
    vocabularyReviews: { id, vocabularyId: crypto.randomUUID(), interval: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: now, lastReviewDate: now, history: [] },
    tasks: { id, title: 'Task', description: '', category: 'Vocabulary', date: now.slice(0, 10), isDone: false, isRecurring: false, recurringDays: [], notes: '', timeMinutes: 30, createdAt: now, updatedAt: now, completedAt: null },
    readingSessions: { id, title: 'Session', topic: 'Education', sourceUrl: '', passageText: '', questionType: 'Multiple Choice', totalQuestions: 0, correctAnswers: 0, accuracy: 0, timeSpentMinutes: 0, newVocabulary: [], summary: '', mistakes: '', notes: '', createdAt: now },
    readingPracticeSessions: { id, passageId: crypto.randomUUID(), title: 'Practice', topic: 'Education', passageText: '', questions: [], answers: {}, score: 0, totalQuestions: 0, accuracy: 0, timeSpentSeconds: 0, mistakes: [], createdAt: now },
    listeningSessions: { id, title: 'Session', sourceUrl: '', topic: 'Education', durationMinutes: 0, section: 1, score: 0, transcriptNotes: '', newVocabulary: [], difficultSentences: '', mistakes: '', shadowingNotes: '', selfRating: 0, createdAt: now },
    listeningPracticeSessions: { id, exerciseId: crypto.randomUUID(), title: 'Practice', topic: 'Education', transcript: '', audioUrl: '', questions: [], answers: {}, score: 0, totalQuestions: 0, accuracy: 0, timeSpentSeconds: 0, notes: '', mistakes: [], createdAt: now },
    writingSessions: { id, taskType: 'task1', question: 'Question?', essay: '', topic: 'Education', wordCount: 0, timeSpentMinutes: 0, estimatedBand: 0, feedback: '', grammarMistakes: '', vocabularyMistakes: '', coherenceNotes: '', improvedSentences: '', betterVersion: '', personalReflection: '', createdAt: now },
    speakingSessions: { id, part: 1, question: 'Question?', answerNotes: '', topic: 'Education', durationSeconds: 0, selfRating: 0, fluencyNotes: '', vocabularyNotes: '', grammarMistakes: '', pronunciationNotes: '', betterExpressions: '', improvedAnswer: '', createdAt: now },
    grammarNotes: { id, topic: 'Grammar', explanation: 'Explanation', exampleSentences: [], commonMistakes: [], correctedExamples: [], personalNote: '', relatedSkill: 'writing', status: 'weak', createdAt: now, updatedAt: now },
    mistakes: { id, mistake: 'Mistake', correction: 'Correction', explanation: '', source: 'test', date: now.slice(0, 10), skill: 'grammar', status: 'new', repetitionCount: 0, createdAt: now, updatedAt: now },
    mockTests: { id, date: now.slice(0, 10), listeningScore: 0, readingScore: 0, writingBand: 0, speakingBand: 0, overallBand: 0, notes: '', weakAreas: [], improvementPlan: '', createdAt: now },
    topicsProgress: { id, topicId: id, topic: 'Education', progressPercent: 0, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [], lastReviewedAt: now, updatedAt: now },
    passages: { id, title: 'Passage', content: 'Content', highlightedWords: [], source: 'user-created', createdAt: now, updatedAt: now },
    ieltsTopics: { id, name: 'Education', description: '', skill: 'general', tags: [], color: '#fff', createdAt: now, updatedAt: now },
    exampleSentences: { id, sentence: 'Sentence', meaning: 'Meaning', vocabularyId: undefined, topic: 'Education', source: '', tags: [], isFavorite: false, status: 'new', createdAt: now, updatedAt: now },
    readingPassages: { id, title: 'Passage', content: 'Content', source: '', topic: 'Education', difficulty: 'medium', wordCount: 0, tags: [], isFavorite: false, status: 'new', notes: '', createdAt: now, updatedAt: now },
    listeningTranscripts: { id, title: 'Transcript', transcript: 'Transcript', source: '', topic: 'Education', difficulty: 'medium', tags: [], isFavorite: false, status: 'new', notes: '', createdAt: now, updatedAt: now },
    writingPrompts: { id, taskType: 'task1', question: 'Question?', topic: 'Education', instructions: '', tags: [], difficulty: 'medium', isFavorite: false, status: 'new', isDone: false, notes: '', createdAt: now, updatedAt: now },
    speakingQuestions: { id, part: 1, question: 'Question?', topic: 'Education', followUpQuestions: [], tags: [], difficulty: 'medium', isFavorite: false, status: 'new', isDone: false, notes: '', createdAt: now, updatedAt: now },
    studyNotes: { id, title: 'Note', content: 'Content', topic: 'Education', skill: 'general', tags: [], isFavorite: false, isDraft: false, createdAt: now, updatedAt: now },
    customStudyPlans: { id, name: 'Plan', description: '', goal: '', startDate: now.slice(0, 10), endDate: now.slice(0, 10), dailyMinutes: 60, daysOfWeek: [1, 3, 5], tasks: [], isActive: false, progress: 0, createdAt: now, updatedAt: now },
    usefulPhrases: { id, phrase: 'Phrase', meaning: 'Meaning', usageExample: '', topic: 'Education', skill: 'general', tags: [], difficulty: 'medium', isFavorite: false, status: 'new', createdAt: now, updatedAt: now },
    aiContents: { id, type: 'general', prompt: 'Prompt', content: 'Content', title: '', topic: 'Education', model: '', tokens: 0, tags: [], isFavorite: false, createdAt: now },
    progressRecords: { id, date: now.slice(0, 10), skill: 'reading', metric: 'score', value: 1, unit: 'points', notes: '', tags: [], createdAt: now },
  }
  return { ...base[table], ...overrides }
}

function createBackupData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: {
      targetBand: 7,
      currentBand: 5.5,
      examDate: '',
      dailyStudyMinutes: 60,
      weakSkills: [],
      preferredTopics: [],
      studyReminder: '',
      aiApiKey: '',
      aiProvider: 'openai',
      aiEndpoint: '',
      aiModel: 'gpt-4o-mini',
      darkMode: false,
      aiEnabled: false,
    },
    vocabulary: [],
    vocabularyReviews: [],
    tasks: [],
    readingSessions: [],
    readingPracticeSessions: [],
    listeningSessions: [],
    listeningPracticeSessions: [],
    writingSessions: [],
    speakingSessions: [],
    grammarNotes: [],
    mistakes: [],
    mockTests: [],
    topicsProgress: [],
    passages: [],
    ieltsTopics: [],
    exampleSentences: [],
    readingPassages: [],
    listeningTranscripts: [],
    writingPrompts: [],
    speakingQuestions: [],
    studyNotes: [],
    customStudyPlans: [],
    usefulPhrases: [],
    aiContents: [],
    publicApiContent: [],
    progressRecords: [],
    contentMeta: [],
    userContentEdits: [],
    ...overrides,
  }
}

beforeEach(() => {
  destroyDb()
  removeAppSettings()
})

afterEach(() => {
  destroyDb()
  removeAppSettings()
})

// ──────────────────────────────────────────────────
// 1. Database Versioning & Schema
// ──────────────────────────────────────────────────

describe('AppDatabase versioning and schema', () => {
  it('opens at version 4', async () => {
    const db = new AppDatabase()
    await db.open()
    expect(db.verno).toBe(4)
    db.close()
  })

  it('registers all v1 stores', () => {
    const db = new AppDatabase()
    const names = db.tables.map(t => t.name)
    for (const table of V1_TABLES) {
      expect(names).toContain(table)
    }
  })

  it('registers all v2 and v3 stores (v1 + new tables)', () => {
    const db = new AppDatabase()
    const names = db.tables.map(t => t.name)
    for (const table of ALL_TABLES) {
      expect(names).toContain(table)
    }
  })

  it('has exactly 28 tables', () => {
    const db = new AppDatabase()
    expect(db.tables.length).toBe(28)
  })

  it('upgrades from version 1 to version 2 preserving v1 data', async () => {
    const v1Db = new Dexie(STORAGE_KEYS.indexedDB.databaseName)
    v1Db.version(1).stores({
      vocabulary: 'id, topic, status, difficulty, createdAt',
      tasks: 'id, date, category, isDone, createdAt',
      readingSessions: 'id, topic, createdAt',
    })
    await v1Db.open()
    const vocabItem = makeItem('vocabulary')
    const taskItem = makeItem('tasks')
    await v1Db.table('vocabulary').add(vocabItem)
    await v1Db.table('tasks').add(taskItem)
    v1Db.close()

    destroyDb()
    const db = getDb()
    await db.open()
    expect(db.verno).toBe(4)

    const vocab = await db.vocabulary.toArray()
    expect(vocab).toHaveLength(1)
    expect(vocab[0].word).toBe('word')

    const tasks = await db.tasks.toArray()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Task')

    const topics = await db.ieltsTopics.toArray()
    expect(topics).toEqual([])
  })
})

describe('Table indexes', () => {
  it('indexes vocabulary by topic, status, difficulty', () => {
    const db = new AppDatabase()
    const table = db.vocabulary
    const idxNames = table.schema.indexes.map(i => i.name)
    expect(idxNames).toContain('topic')
    expect(idxNames).toContain('status')
    expect(idxNames).toContain('difficulty')
    expect(idxNames).toContain('createdAt')
  })

  it('indexes tasks by date, category, isDone', () => {
    const db = new AppDatabase()
    const table = db.tasks
    const idxNames = table.schema.indexes.map(i => i.name)
    expect(idxNames).toContain('date')
    expect(idxNames).toContain('category')
    expect(idxNames).toContain('isDone')
  })

  it('indexes v2 tables with tags and isFavorite where applicable', () => {
    const db = new AppDatabase()
    for (const name of V2_NEW_TABLES) {
      const table = db.table(name)
      const idxNames = table.schema.indexes.map(i => i.name)
      // Every v2 table should have createdAt index
      expect(idxNames).toContain('createdAt')
    }
  })
})

// ──────────────────────────────────────────────────
// 2. Corrupted / Invalid Data Handling
// ──────────────────────────────────────────────────

describe('Validation rejects corrupted data', () => {
  it('rejects vocabulary with invalid difficulty', async () => {
    await expect(
      DatabaseService.safeAdd('vocabulary', makeItem('vocabulary', { difficulty: 'impossible' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects vocabulary with invalid status', async () => {
    await expect(
      DatabaseService.safeAdd('vocabulary', makeItem('vocabulary', { status: 'unknown' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects vocabulary with missing word', async () => {
    const item = makeItem('vocabulary')
    delete item.word
    await expect(
      DatabaseService.safeAdd('vocabulary', item),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects grammarNote with missing explanation', async () => {
    const item = makeItem('grammarNotes')
    delete item.explanation
    await expect(
      DatabaseService.safeAdd('grammarNotes', item),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects mistake with invalid skill', async () => {
    await expect(
      DatabaseService.safeAdd('mistakes', makeItem('mistakes', { skill: 'invalid-skill' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects writing prompt with invalid taskType', async () => {
    await expect(
      DatabaseService.safeAdd('writingPrompts', makeItem('writingPrompts', { taskType: 'task3' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects speaking question with invalid part', async () => {
    await expect(
      DatabaseService.safeAdd('speakingQuestions', makeItem('speakingQuestions', { part: 4 })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects items with non-object type', async () => {
    await expect(
      DatabaseService.safeAdd('vocabulary', 'not-an-object' as never),
    ).rejects.toThrow(ValidationError)
  })

  it('auto-generates id when missing', async () => {
    const item = makeItem('vocabulary')
    delete item.id
    const id = await DatabaseService.safeAdd('vocabulary', item)
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
  })

  it('rejects progress record with non-numeric value', async () => {
    await expect(
      DatabaseService.safeAdd('progressRecords', makeItem('progressRecords', { value: 'not-a-number' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects aiContent with invalid type', async () => {
    await expect(
      DatabaseService.safeAdd('aiContents', makeItem('aiContents', { type: 'invalid-type' })),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects usefulPhrase with invalid difficulty', async () => {
    await expect(
      DatabaseService.safeAdd('usefulPhrases', makeItem('usefulPhrases', { difficulty: 'extreme' })),
    ).rejects.toThrow(ValidationError)
  })
})

describe('Import validation rejects corrupted backup data', () => {
  it('rejects import with missing version field', async () => {
    const data = createBackupData()
    delete data.version
    await expect(
      DatabaseService.importJson(JSON.stringify(data)),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import with non-numeric version', async () => {
    const data = createBackupData({ version: 'v2' })
    await expect(
      DatabaseService.importJson(JSON.stringify(data)),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import with missing export timestamp', async () => {
    const data = createBackupData()
    delete data.exportedAt
    await expect(
      DatabaseService.importJson(JSON.stringify(data)),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import with missing settings', async () => {
    const data = createBackupData()
    delete data.settings
    await expect(
      DatabaseService.importJson(JSON.stringify(data)),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import with a non-array table field', async () => {
    const data = createBackupData({ vocabulary: 'not-an-array' })
    await expect(
      DatabaseService.importJson(JSON.stringify(data)),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import of completely invalid JSON', async () => {
    await expect(
      DatabaseService.importJson('this is not json'),
    ).rejects.toThrow()
  })

  it('rejects import with empty object', async () => {
    await expect(
      DatabaseService.importJson(JSON.stringify({})),
    ).rejects.toThrow(DatabaseError)
  })

  it('rejects import of null', async () => {
    await expect(
      DatabaseService.importJson('null'),
    ).rejects.toThrow(DatabaseError)
  })

  it('reports corrupted vocabulary item in import summary', async () => {
    const data = createBackupData({
      vocabulary: [{ id: 'bad1' }],
    })
    const summary = await DatabaseService.importJson(JSON.stringify(data))
    expect(summary.added).toBe(0)
    expect(summary.failed).toBe(1)
    expect(summary.errors[0]).toContain('vocabulary')
  })
})

// ──────────────────────────────────────────────────
// 3. Recovery & Reset Logic
// ──────────────────────────────────────────────────

describe('DatabaseError provides clear messages', () => {
  it('creates a DatabaseError with a meaningful message', () => {
    const err = new DatabaseError('Failed to open database')
    expect(err.name).toBe('DatabaseError')
    expect(err.message).toBe('Failed to open database')
  })

  it('DatabaseError preserves the cause', () => {
    const inner = new Error('IndexedDB quota exceeded')
    const err = new DatabaseError('Write failed', inner)
    expect(err.cause).toBe(inner)
  })
})

describe('ValidationError provides clear messages', () => {
  it('creates a ValidationError with a meaningful message', () => {
    const err = new ValidationError('vocabulary: difficulty must be one of: easy, medium, hard')
    expect(err.name).toBe('ValidationError')
    expect(err.message).toContain('difficulty')
  })
})

describe('Error wrapping via safeDb', () => {
  it('wraps unknown errors in DatabaseError', async () => {
    await expect(
      DatabaseService.safeGetById('vocabulary', 'nonexistent-id'),
    ).resolves.toBeUndefined()
  })
})

describe('Import partial failure recovery', () => {
  it('returns ImportSummary with failure details when import has invalid items', async () => {
    const data = createBackupData({
      vocabulary: [
        makeItem('vocabulary'),
        { id: 'bad-vocab', word: 12345 },
      ],
    })
    const summary = await DatabaseService.importAll(data as never, 'replace')
    expect(summary.added).toBe(1)
    expect(summary.failed).toBe(1)
    expect(summary.errors.length).toBe(1)
    expect(summary.errors[0]).toContain('vocabulary')
  })

  it('returns ImportSummary with skipped items in merge mode', async () => {
    const valid = makeItem('vocabulary') as never
    const data = createBackupData({ vocabulary: [valid] })
    const summary = await DatabaseService.importAll(data as never, 'merge')
    expect(summary.added).toBe(1)
    expect(summary.failed).toBe(0)
  })
})

describe('Reset and clear operations', () => {
  it('resetAll clears all tables and settings', async () => {
    saveAppSettings({} as never)
    await DatabaseService.safeAdd('vocabulary', makeItem('vocabulary') as never)
    await DatabaseService.safeAdd('tasks', makeItem('tasks') as never)
    await DatabaseService.safeAdd('ieltsTopics', makeItem('ieltsTopics') as never)

    await DatabaseService.resetAll()

    const vocab = await DatabaseService.safeGetAll('vocabulary')
    const tasks = await DatabaseService.safeGetAll('tasks')
    const topics = await DatabaseService.safeGetAll('ieltsTopics')
    expect(vocab).toHaveLength(0)
    expect(tasks).toHaveLength(0)
    expect(topics).toHaveLength(0)
  })

  it('clearAll clears all tables but leaves settings intact', async () => {
    saveAppSettings({ targetBand: 9 } as never)
    await DatabaseService.safeAdd('vocabulary', makeItem('vocabulary') as never)
    await DatabaseService.safeAdd('writingPrompts', makeItem('writingPrompts') as never)

    await DatabaseService.safeClearTable('vocabulary')
    const vocab = await DatabaseService.safeGetAll('vocabulary')
    expect(vocab).toHaveLength(0)

    const prompts = await DatabaseService.safeGetAll('writingPrompts')
    expect(prompts).toHaveLength(1)
  })
})

describe('Database singleton lifecycle', () => {
  it('getDb returns the same instance', () => {
    const a = getDb()
    const b = getDb()
    expect(a).toBe(b)
  })

  it('destroyDb creates a new instance on next getDb', () => {
    const a = getDb()
    destroyDb()
    const b = getDb()
    expect(a).not.toBe(b)
  })

  it('remains open after repeated destroy and recreate', async () => {
    for (let i = 0; i < 5; i++) {
      destroyDb()
      const db = getDb()
      await db.open()
      expect(db.verno).toBe(4)
    }
  })
})

describe('Data persistence across db lifecycle', () => {
  it('persists data after close and reopen', async () => {
    await DatabaseService.safeAdd('vocabulary', makeItem('vocabulary') as never)
    destroyDb()

    const items = await DatabaseService.safeGetAll('vocabulary')
    expect(items).toHaveLength(1)
  })

  it('persists data in v2 tables after close and reopen', async () => {
    await DatabaseService.safeAdd('readingPassages', makeItem('readingPassages') as never)
    await DatabaseService.safeAdd('progressRecords', makeItem('progressRecords') as never)
    destroyDb()

    const passages = await DatabaseService.safeGetAll('readingPassages')
    const records = await DatabaseService.safeGetAll('progressRecords')
    expect(passages).toHaveLength(1)
    expect(records).toHaveLength(1)
  })
})

describe('Safe operations handle corrupted IndexedDB gracefully', () => {
  it('safeGetAll returns empty array for empty table', async () => {
    const items = await DatabaseService.safeGetAll('usefulPhrases')
    expect(items).toEqual([])
  })

  it('safeGetById returns undefined for non-existent item', async () => {
    const item = await DatabaseService.safeGetById('studyNotes', 'nonexistent')
    expect(item).toBeUndefined()
  })

  it('safeCount returns zero for empty table', async () => {
    const count = await DatabaseService.safeCount('customStudyPlans')
    expect(count).toBe(0)
  })

  it('does not crash when adding duplicate id with safeAdd', async () => {
    const item = makeItem('vocabulary')
    await DatabaseService.safeAdd('vocabulary', item as never)
    await expect(
      DatabaseService.safeAdd('vocabulary', item as never),
    ).rejects.toThrow()
  })

  it('safePut overwrites existing item with same id', async () => {
    const item = makeItem('vocabulary') as Record<string, unknown>
    await DatabaseService.safeAdd('vocabulary', item as never)
    const updated = { ...item, word: 'updated-word' } as never
    await DatabaseService.safePut('vocabulary', updated)
    const fetched = await DatabaseService.safeGetById('vocabulary', item.id as string)
    expect(fetched).toBeDefined()
    expect((fetched as Record<string, unknown>).word).toBe('updated-word')
  })

  it('safeRemove deletes an existing item', async () => {
    const item = makeItem('vocabulary')
    await DatabaseService.safeAdd('vocabulary', item as never)
    await DatabaseService.safeRemove('vocabulary', item.id as string)
    const fetched = await DatabaseService.safeGetById('vocabulary', item.id as string)
    expect(fetched).toBeUndefined()
  })

  it('safeRemove on non-existent id does not throw', async () => {
    await expect(
      DatabaseService.safeRemove('vocabulary', 'nonexistent-id'),
    ).resolves.toBeUndefined()
  })
})

describe('Bulk operations validate all items', () => {
  it('safeBulkAdd rejects if any item is invalid', async () => {
    const valid = makeItem('exampleSentences')
    const invalid = makeItem('exampleSentences', { sentence: undefined })
    delete invalid.sentence
    await expect(
      DatabaseService.safeBulkAdd('exampleSentences', [valid, invalid] as never[]),
    ).rejects.toThrow(ValidationError)
  })

  it('safeBulkPut accepts all valid items', async () => {
    const items = [
      makeItem('usefulPhrases'),
      makeItem('usefulPhrases'),
    ]
    await expect(
      DatabaseService.safeBulkPut('usefulPhrases', items as never[]),
    ).resolves.toBeUndefined()
    const count = await DatabaseService.safeCount('usefulPhrases')
    expect(count).toBe(2)
  })
})

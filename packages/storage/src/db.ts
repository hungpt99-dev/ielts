import Dexie, { type DexieOptions, type Table } from 'dexie'
import type { AppDatabaseSchema } from './migrations'
import { StorageError, DatabaseClosedError } from './errors'

export const DB_NAME = 'ielts-journey'

export interface IDatabase {
  vocabulary: Table<Record<string, unknown>, string>
  vocabularyReviews: Table<Record<string, unknown>, string>
  tasks: Table<Record<string, unknown>, string>
  readingSessions: Table<Record<string, unknown>, string>
  readingPracticeSessions: Table<Record<string, unknown>, string>
  listeningSessions: Table<Record<string, unknown>, string>
  listeningPracticeSessions: Table<Record<string, unknown>, string>
  writingSessions: Table<Record<string, unknown>, string>
  speakingSessions: Table<Record<string, unknown>, string>
  grammarNotes: Table<Record<string, unknown>, string>
  mistakes: Table<Record<string, unknown>, string>
  mockTests: Table<Record<string, unknown>, string>
  topicsProgress: Table<Record<string, unknown>, string>
  passages: Table<Record<string, unknown>, string>
  ieltsTopics: Table<Record<string, unknown>, string>
  exampleSentences: Table<Record<string, unknown>, string>
  readingPassages: Table<Record<string, unknown>, string>
  listeningTranscripts: Table<Record<string, unknown>, string>
  writingPrompts: Table<Record<string, unknown>, string>
  speakingQuestions: Table<Record<string, unknown>, string>
  studyNotes: Table<Record<string, unknown>, string>
  customStudyPlans: Table<Record<string, unknown>, string>
  usefulPhrases: Table<Record<string, unknown>, string>
  aiContents: Table<Record<string, unknown>, string>
  publicApiContent: Table<Record<string, unknown>, string>
  progressRecords: Table<Record<string, unknown>, string>
  contentMeta: Table<Record<string, unknown>, string>
  userContentEdits: Table<Record<string, unknown>, string>
}

export class AppDatabase extends Dexie implements IDatabase {
  vocabulary!: Table<Record<string, unknown>, string>
  vocabularyReviews!: Table<Record<string, unknown>, string>
  tasks!: Table<Record<string, unknown>, string>
  readingSessions!: Table<Record<string, unknown>, string>
  readingPracticeSessions!: Table<Record<string, unknown>, string>
  listeningSessions!: Table<Record<string, unknown>, string>
  listeningPracticeSessions!: Table<Record<string, unknown>, string>
  writingSessions!: Table<Record<string, unknown>, string>
  speakingSessions!: Table<Record<string, unknown>, string>
  grammarNotes!: Table<Record<string, unknown>, string>
  mistakes!: Table<Record<string, unknown>, string>
  mockTests!: Table<Record<string, unknown>, string>
  topicsProgress!: Table<Record<string, unknown>, string>
  passages!: Table<Record<string, unknown>, string>
  ieltsTopics!: Table<Record<string, unknown>, string>
  exampleSentences!: Table<Record<string, unknown>, string>
  readingPassages!: Table<Record<string, unknown>, string>
  listeningTranscripts!: Table<Record<string, unknown>, string>
  writingPrompts!: Table<Record<string, unknown>, string>
  speakingQuestions!: Table<Record<string, unknown>, string>
  studyNotes!: Table<Record<string, unknown>, string>
  customStudyPlans!: Table<Record<string, unknown>, string>
  usefulPhrases!: Table<Record<string, unknown>, string>
  aiContents!: Table<Record<string, unknown>, string>
  publicApiContent!: Table<Record<string, unknown>, string>
  progressRecords!: Table<Record<string, unknown>, string>
  contentMeta!: Table<Record<string, unknown>, string>
  userContentEdits!: Table<Record<string, unknown>, string>

  constructor(schema: AppDatabaseSchema, options?: DexieOptions) {
    super(DB_NAME, options)

    for (const version of schema.versions) {
      this.version(version.number).stores(version.stores)
    }
  }
}
let dbInstance: AppDatabase | null = null
let lastSchema: AppDatabaseSchema | null = null

export function initDb(schema: AppDatabaseSchema, options?: DexieOptions): AppDatabase {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
  lastSchema = schema
  dbInstance = new AppDatabase(schema, options)
  return dbInstance
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    if (lastSchema) {
      dbInstance = new AppDatabase(lastSchema)
    } else {
      throw new DatabaseClosedError()
    }
  }
  return dbInstance
}

export function destroyDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function isDbOpen(): boolean {
  return dbInstance !== null
}

export async function safeDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('Database is closed')) {
      getDb()
      return await fn()
    }
    throw new StorageError(`Database operation failed: ${msg}`, error)
  }
}

export const TABLE_NAMES: (keyof IDatabase)[] = [
  'vocabulary',
  'vocabularyReviews',
  'tasks',
  'readingSessions',
  'readingPracticeSessions',
  'listeningSessions',
  'listeningPracticeSessions',
  'writingSessions',
  'speakingSessions',
  'grammarNotes',
  'mistakes',
  'mockTests',
  'topicsProgress',
  'passages',
  'ieltsTopics',
  'exampleSentences',
  'readingPassages',
  'listeningTranscripts',
  'writingPrompts',
  'speakingQuestions',
  'studyNotes',
  'customStudyPlans',
  'usefulPhrases',
  'aiContents',
  'publicApiContent',
  'progressRecords',
  'contentMeta',
  'userContentEdits',
]

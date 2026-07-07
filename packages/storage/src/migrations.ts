import type { IDatabase } from './db'
import { getDb, safeDb } from './db'
import { MigrationError } from './errors'

export interface StorageVersion {
  number: number
  stores: Record<string, string>
  upgrade?: (tx: IDatabase) => void | Promise<void>
}

export interface AppDatabaseSchema {
  currentVersion: number
  versions: StorageVersion[]
}

export const CURRENT_DB_VERSION = 7

export const APP_SCHEMA: AppDatabaseSchema = {
  currentVersion: CURRENT_DB_VERSION,
  versions: [
    {
      number: 1,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
      },
    },
    {
      number: 2,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
      },
    },
    {
      number: 3,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
      },
    },
    {
      number: 4,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
        contentMeta: 'id, packId, packVersion, seededAt',
        userContentEdits: 'id, originalId, userItemId, contentType, tableName, editedAt',
      },
    },
    {
      number: 5,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
        contentMeta: 'id, packId, packVersion, seededAt',
        userContentEdits: 'id, originalId, userItemId, contentType, tableName, editedAt',
        speakingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        writingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        readingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        listeningExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
      },
    },
    {
      number: 6,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
        contentMeta: 'id, packId, packVersion, seededAt',
        userContentEdits: 'id, originalId, userItemId, contentType, tableName, editedAt',
        speakingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        writingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        readingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        listeningExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        artifacts: 'id, url, category, *tags, isFavorite, createdAt',
      },
    },
    {
      number: 7,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        progressRecords: 'id, date, skill, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
        contentMeta: 'id, packId, packVersion, seededAt',
        userContentEdits: 'id, originalId, userItemId, contentType, tableName, editedAt',
        speakingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        writingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        readingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        listeningExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        artifacts: 'id, url, category, *tags, isFavorite, createdAt',
        learningEvents: 'id, eventType, source, timestamp, sessionId, syncStatus, createdAt',
      },
    },
  ],
}

const STORED_VERSION_KEY = 'schema_version'

export function getSchemaForVersion(version: number): StorageVersion | undefined {
  return APP_SCHEMA.versions.find(v => v.number === version)
}

export function getStoreNamesForVersion(version: number): string[] {
  const schema = getSchemaForVersion(version)
  return schema ? Object.keys(schema.stores) : []
}

export async function getAppliedVersion(): Promise<number> {
  try {
    const raw = localStorage.getItem(STORED_VERSION_KEY)
    if (raw !== null) {
      const v = parseInt(raw, 10)
      return isNaN(v) ? 0 : v
    }
  } catch {}
  return 0
}

export async function setAppliedVersion(version: number): Promise<void> {
  try {
    localStorage.setItem(STORED_VERSION_KEY, String(version))
  } catch (e) {
    console.error('Failed to persist schema version:', e)
  }
}

export async function applyMigrations(): Promise<void> {
  const db = getDb()
  const appliedVersion = await getAppliedVersion()

  if (appliedVersion >= CURRENT_DB_VERSION) return

  const pending = APP_SCHEMA.versions.filter(
    v => v.number > appliedVersion && v.number <= CURRENT_DB_VERSION,
  )

  for (const version of pending) {
    if (version.upgrade) {
      try {
        await safeDb(async () => {
          await version.upgrade!(db)
        })
      } catch (error) {
        throw new MigrationError(
          `Migration to version ${version.number} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        )
      }
    }
    await setAppliedVersion(version.number)
  }
}

export function clearAppliedVersion(): void {
  try {
    localStorage.removeItem(STORED_VERSION_KEY)
  } catch {}
}

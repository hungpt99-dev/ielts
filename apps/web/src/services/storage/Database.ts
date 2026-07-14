import type { Table } from 'dexie'
import type {
  VocabularyEntry,
  VocabReviewEntry,
  TaskEntry,
  ReadingSession,
  ReadingPracticeSession,
  ListeningSession,
  ListeningPracticeSession,
  WritingSession,
  SpeakingSession,
  GrammarNote,
  MistakeEntry,
  MockTestEntry,
  TopicProgress,
  PassageEntry,
  IeltsTopic,
  ExampleSentence,
  ReadingPassage,
  ListeningTranscript,
  WritingPrompt,
  SpeakingQuestion,
  StudyNote,
  CustomStudyPlan,
  UsefulPhrase,
  AiContent,
  ProgressRecord,
  PublicApiImportedContent,
  AppExportData,
} from '../../models'
import { clearAllLocalStorage } from './SettingsStorage'
import { STORAGE_KEYS } from '@ielts/config'

import { ValidationError } from '@ielts/storage'
export { ValidationError } from '@ielts/storage'
export type { PaginationParams, PaginatedResult } from '@ielts/storage'

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}
export type { ImportMode, ImportSummary } from '@ielts/storage'

import {
  initDb as initStorageDb,
  getDb as getStorageDb,
  destroyDb as destroyStorageDb,
  isDbOpen,
  TABLE_NAMES,
  APP_SCHEMA,
  safeDb,
  VocabularyRepository,
  VocabReviewRepository,
  MistakeRepository,
  TaskRepository,
  ReadingSessionRepository,
  ListeningSessionRepository,
  WritingSessionRepository,
  SpeakingSessionRepository,
  ReadingPracticeSessionRepository,
  ListeningPracticeSessionRepository,
  GrammarNoteRepository,
  MockTestRepository,
  ProgressRecordRepository,
  TopicProgressRepository,
  AiContentRepository,
  CustomStudyPlanRepository,
  ExampleSentenceRepository,
  IeltsTopicRepository,
  ListeningTranscriptRepository,
  PassageEntryRepository,
  PublicApiContentRepository,
  ReadingPassageRepository,
  SpeakingQuestionRepository,
  StudyNoteRepository,
  UsefulPhraseRepository,
  WritingPromptRepository,
  SpeakingExerciseRepository,
  WritingExerciseRepository,
  ReadingExerciseRepository,
  ListeningExerciseRepository,
  ArtifactRepository,
  exportAllData,
  importBackup,
  clearAllTables,
} from '@ielts/storage'
import { AppDatabase as StorageAppDatabase } from '@ielts/storage'
export interface IDatabase {
  vocabulary: Table<VocabularyEntry, string>
  vocabularyReviews: Table<VocabReviewEntry, string>
  tasks: Table<TaskEntry, string>
  readingSessions: Table<ReadingSession, string>
  readingPracticeSessions: Table<ReadingPracticeSession, string>
  listeningSessions: Table<ListeningSession, string>
  listeningPracticeSessions: Table<ListeningPracticeSession, string>
  writingSessions: Table<WritingSession, string>
  speakingSessions: Table<SpeakingSession, string>
  grammarNotes: Table<GrammarNote, string>
  mistakes: Table<MistakeEntry, string>
  mockTests: Table<MockTestEntry, string>
  topicsProgress: Table<TopicProgress, string>
  passages: Table<PassageEntry, string>
  ieltsTopics: Table<IeltsTopic, string>
  exampleSentences: Table<ExampleSentence, string>
  readingPassages: Table<ReadingPassage, string>
  listeningTranscripts: Table<ListeningTranscript, string>
  writingPrompts: Table<WritingPrompt, string>
  speakingQuestions: Table<SpeakingQuestion, string>
  studyNotes: Table<StudyNote, string>
  customStudyPlans: Table<CustomStudyPlan, string>
  usefulPhrases: Table<UsefulPhrase, string>
  aiContents: Table<AiContent, string>
  publicApiContent: Table<PublicApiImportedContent, string>
  progressRecords: Table<ProgressRecord, string>
  speakingExercises: Table<AiContent, string>
  writingExercises: Table<AiContent, string>
  readingExercises: Table<AiContent, string>
  listeningExercises: Table<AiContent, string>
}

export class AppDatabase extends StorageAppDatabase {
  constructor() {
    super(APP_SCHEMA)
  }
}

export type DatabaseStats = Record<string, string | number>

let dbInitialized = false

export function getDb(): ReturnType<typeof getStorageDb> {
  if (!dbInitialized || !isDbOpen()) {
    initStorageDb(APP_SCHEMA)
    dbInitialized = true
  }
  return getStorageDb()
}

export function destroyDb(): void {
  destroyStorageDb()
  dbInitialized = false
}

const repo = {
  vocabulary: new VocabularyRepository(),
  vocabularyReviews: new VocabReviewRepository(),
  tasks: new TaskRepository(),
  readingSessions: new ReadingSessionRepository(),
  readingPracticeSessions: new ReadingPracticeSessionRepository(),
  listeningSessions: new ListeningSessionRepository(),
  listeningPracticeSessions: new ListeningPracticeSessionRepository(),
  writingSessions: new WritingSessionRepository(),
  speakingSessions: new SpeakingSessionRepository(),
  grammarNotes: new GrammarNoteRepository(),
  mistakes: new MistakeRepository(),
  mockTests: new MockTestRepository(),
  topicsProgress: new TopicProgressRepository(),
  passages: new PassageEntryRepository(),
  ieltsTopics: new IeltsTopicRepository(),
  exampleSentences: new ExampleSentenceRepository(),
  readingPassages: new ReadingPassageRepository(),
  listeningTranscripts: new ListeningTranscriptRepository(),
  writingPrompts: new WritingPromptRepository(),
  speakingQuestions: new SpeakingQuestionRepository(),
  studyNotes: new StudyNoteRepository(),
  customStudyPlans: new CustomStudyPlanRepository(),
  usefulPhrases: new UsefulPhraseRepository(),
  aiContents: new AiContentRepository(),
  publicApiContent: new PublicApiContentRepository(),
  progressRecords: new ProgressRecordRepository(),
  speakingExercises: new SpeakingExerciseRepository(),
  writingExercises: new WritingExerciseRepository(),
  readingExercises: new ReadingExerciseRepository(),
  listeningExercises: new ListeningExerciseRepository(),
  artifacts: new ArtifactRepository(),
}

type RepoMap = typeof repo
type TableName = keyof RepoMap

function getRepo(table: keyof IDatabase) {
  const r = repo[table as TableName]
  if (!r) throw new Error(`Unknown table: ${table}`)
  return r
}

async function safeDbLocal<T>(fn: () => Promise<T>): Promise<T> {
  try {
    if (!isDbOpen()) {
      getDb()
    }
    return await safeDb(fn)
  } catch (error) {
    console.error('apps/web/src/services/storage/Database.ts error:', error);
    if (error instanceof DatabaseError || error instanceof ValidationError) throw error
    throw new DatabaseError(
      error instanceof Error ? error.message : 'Database operation failed',
      error,
    )
  }
}

export const DatabaseService = {

  async safeGetAll<T>(table: keyof IDatabase): Promise<T[]> {
    return safeDbLocal(async () => {
      return (await getRepo(table).findAll()) as unknown as T[]
    })
  },

  async safeGetAllPaginated<T>(table: keyof IDatabase, params?: { page?: number; pageSize?: number }): Promise<PaginatedResult<T>> {
    return safeDbLocal(async () => {
      return (await getRepo(table).findAllPaginated(params)) as unknown as PaginatedResult<T>
    })
  },

  async safeGetById<T>(table: keyof IDatabase, id: string): Promise<T | undefined> {
    return safeDbLocal(async () => {
      return (await getRepo(table).findById(id)) as unknown as T | undefined
    })
  },

  async safeAdd<T extends Record<string, unknown>>(table: keyof IDatabase, item: T): Promise<string> {
    return safeDbLocal(async () => {
      const entry = await getRepo(table).create(item as never)
      return entry.id
    })
  },

  async safePut<T extends Record<string, unknown>>(table: keyof IDatabase, item: T): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).bulkUpsert([item as never])
    })
  },

  async safeUpdate<T>(table: keyof IDatabase, id: string, changes: Partial<T>): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, changes as never)
    })
  },

  async safeRemove(table: keyof IDatabase, id: string): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).delete(id)
    })
  },

  async safeClearTable(table: keyof IDatabase): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).clear()
    })
  },

  async safeCount(table: keyof IDatabase): Promise<number> {
    return safeDbLocal(async () => {
      return await getRepo(table).count()
    })
  },

  async safeBulkAdd<T extends Record<string, unknown>>(table: keyof IDatabase, items: T[]): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).bulkCreate(items as never[])
    })
  },

  async safeBulkPut<T extends Record<string, unknown>>(table: keyof IDatabase, items: T[]): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).bulkUpsert(items as never[])
    })
  },

  async safeQueryByIndex<T>(table: keyof IDatabase, index: string, value: unknown): Promise<T[]> {
    return safeDbLocal(async () => {
      return (await getRepo(table).queryByIndex(index, value)) as unknown as T[]
    })
  },

  async safeQueryByDateRange<T extends { createdAt: string }>(
    table: keyof IDatabase,
    start: string,
    end: string,
  ): Promise<T[]> {
    return safeDbLocal(async () => {
      return (await getRepo(table).findByDateRange('createdAt', start, end)) as unknown as T[]
    })
  },

  async addVocabulary(item: Omit<VocabularyEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<VocabularyEntry> {
    const result = await safeDbLocal(async () => {
      return (await repo.vocabulary.create(item as never)) as unknown as VocabularyEntry
    })

    return result
  },

  async updateVocabulary(id: string, changes: Partial<VocabularyEntry>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.vocabulary.update(id, changes as never)
    })
  },

  async addIeltsTopic(item: Omit<IeltsTopic, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<IeltsTopic> {
    return safeDbLocal(async () => {
      return (await repo.ieltsTopics.create(item as never)) as unknown as IeltsTopic
    })
  },

  async updateIeltsTopic(id: string, changes: Partial<IeltsTopic>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.ieltsTopics.update(id, changes as never)
    })
  },

  async addExampleSentence(item: Omit<ExampleSentence, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ExampleSentence> {
    return safeDbLocal(async () => {
      return (await repo.exampleSentences.create(item as never)) as unknown as ExampleSentence
    })
  },

  async updateExampleSentence(id: string, changes: Partial<ExampleSentence>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.exampleSentences.update(id, changes as never)
    })
  },

  async addReadingPassage(item: Omit<ReadingPassage, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ReadingPassage> {
    return safeDbLocal(async () => {
      return (await repo.readingPassages.create(item as never)) as unknown as ReadingPassage
    })
  },

  async updateReadingPassage(id: string, changes: Partial<ReadingPassage>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.readingPassages.update(id, changes as never)
    })
  },

  async addListeningTranscript(item: Omit<ListeningTranscript, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ListeningTranscript> {
    return safeDbLocal(async () => {
      return (await repo.listeningTranscripts.create(item as never)) as unknown as ListeningTranscript
    })
  },

  async updateListeningTranscript(id: string, changes: Partial<ListeningTranscript>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.listeningTranscripts.update(id, changes as never)
    })
  },

  async addWritingPrompt(item: Omit<WritingPrompt, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<WritingPrompt> {
    return safeDbLocal(async () => {
      return (await repo.writingPrompts.create(item as never)) as unknown as WritingPrompt
    })
  },

  async updateWritingPrompt(id: string, changes: Partial<WritingPrompt>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.writingPrompts.update(id, changes as never)
    })
  },

  async addSpeakingQuestion(item: Omit<SpeakingQuestion, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<SpeakingQuestion> {
    return safeDbLocal(async () => {
      return (await repo.speakingQuestions.create(item as never)) as unknown as SpeakingQuestion
    })
  },

  async updateSpeakingQuestion(id: string, changes: Partial<SpeakingQuestion>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.speakingQuestions.update(id, changes as never)
    })
  },

  async addStudyNote(item: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<StudyNote> {
    return safeDbLocal(async () => {
      return (await repo.studyNotes.create(item as never)) as unknown as StudyNote
    })
  },

  async updateStudyNote(id: string, changes: Partial<StudyNote>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.studyNotes.update(id, changes as never)
    })
  },

  async addCustomStudyPlan(item: Omit<CustomStudyPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CustomStudyPlan> {
    return safeDbLocal(async () => {
      return (await repo.customStudyPlans.create(item as never)) as unknown as CustomStudyPlan
    })
  },

  async updateCustomStudyPlan(id: string, changes: Partial<CustomStudyPlan>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.customStudyPlans.update(id, changes as never)
    })
  },

  async addUsefulPhrase(item: Omit<UsefulPhrase, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UsefulPhrase> {
    return safeDbLocal(async () => {
      return (await repo.usefulPhrases.create(item as never)) as unknown as UsefulPhrase
    })
  },

  async updateUsefulPhrase(id: string, changes: Partial<UsefulPhrase>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.usefulPhrases.update(id, changes as never)
    })
  },

  async addAiContent(item: Omit<AiContent, 'id' | 'createdAt'> & { id?: string }): Promise<AiContent> {
    return safeDbLocal(async () => {
      return (await repo.aiContents.create(item as never)) as unknown as AiContent
    })
  },

  async addPublicApiContent(item: Omit<PublicApiImportedContent, 'id' | 'importedAt'> & { id?: string; importedAt?: string }): Promise<PublicApiImportedContent> {
    return safeDbLocal(async () => {
      return (await repo.publicApiContent.create(item as never)) as unknown as PublicApiImportedContent
    })
  },

  async updatePublicApiContent(id: string, changes: Partial<PublicApiImportedContent>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.publicApiContent.update(id, changes as never)
    })
  },

  async addProgressRecord(item: Omit<ProgressRecord, 'id' | 'createdAt'> & { id?: string }): Promise<ProgressRecord> {
    return safeDbLocal(async () => {
      return (await repo.progressRecords.create(item as never)) as unknown as ProgressRecord
    })
  },

  async addGrammarNote(item: Omit<GrammarNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<GrammarNote> {
    return safeDbLocal(async () => {
      return (await repo.grammarNotes.create(item as never)) as unknown as GrammarNote
    })
  },

  async updateGrammarNote(id: string, changes: Partial<GrammarNote>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.grammarNotes.update(id, changes as never)
    })
  },

  async addMistake(item: Omit<MistakeEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<MistakeEntry> {
    const result = await safeDbLocal(async () => {
      return (await repo.mistakes.create(item as never)) as unknown as MistakeEntry
    })

    return result
  },

  async updateMistake(id: string, changes: Partial<MistakeEntry>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.mistakes.update(id, changes as never)
    })
  },

  async addTask(item: Omit<TaskEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TaskEntry> {
    return safeDbLocal(async () => {
      return (await repo.tasks.create(item as never)) as unknown as TaskEntry
    })
  },

  async updateTask(id: string, changes: Partial<TaskEntry>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.tasks.update(id, changes as never)
    })
  },

  async addReadingSession(item: Omit<ReadingSession, 'id' | 'createdAt'> & { id?: string }): Promise<ReadingSession> {
    return safeDbLocal(async () => {
      return (await repo.readingSessions.create(item as never)) as unknown as ReadingSession
    })
  },

  async addListeningSession(item: Omit<ListeningSession, 'id' | 'createdAt'> & { id?: string }): Promise<ListeningSession> {
    return safeDbLocal(async () => {
      return (await repo.listeningSessions.create(item as never)) as unknown as ListeningSession
    })
  },

  async addWritingSession(item: Omit<WritingSession, 'id' | 'createdAt'> & { id?: string }): Promise<WritingSession> {
    return safeDbLocal(async () => {
      return (await repo.writingSessions.create(item as never)) as unknown as WritingSession
    })
  },

  async addSpeakingSession(item: Omit<SpeakingSession, 'id' | 'createdAt'> & { id?: string }): Promise<SpeakingSession> {
    return safeDbLocal(async () => {
      return (await repo.speakingSessions.create(item as never)) as unknown as SpeakingSession
    })
  },

  async addPassageEntry(item: Omit<PassageEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PassageEntry> {
    return safeDbLocal(async () => {
      return (await repo.passages.create(item as never)) as unknown as PassageEntry
    })
  },

  async updatePassageEntry(id: string, changes: Partial<PassageEntry>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.passages.update(id, changes as never)
    })
  },

  async addVocabReviewEntry(item: Omit<VocabReviewEntry, 'id'> & { id?: string }): Promise<VocabReviewEntry> {
    return safeDbLocal(async () => {
      return (await repo.vocabularyReviews.create(item as never)) as unknown as VocabReviewEntry
    })
  },

  async updateVocabReviewEntry(id: string, changes: Partial<VocabReviewEntry>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.vocabularyReviews.update(id, changes as never)
    })
  },

  async addReadingPracticeSession(item: Omit<ReadingPracticeSession, 'id' | 'createdAt'> & { id?: string }): Promise<ReadingPracticeSession> {
    return safeDbLocal(async () => {
      return (await repo.readingPracticeSessions.create(item as never)) as unknown as ReadingPracticeSession
    })
  },

  async addListeningPracticeSession(item: Omit<ListeningPracticeSession, 'id' | 'createdAt'> & { id?: string }): Promise<ListeningPracticeSession> {
    return safeDbLocal(async () => {
      return (await repo.listeningPracticeSessions.create(item as never)) as unknown as ListeningPracticeSession
    })
  },

  async addMockTest(item: Omit<MockTestEntry, 'id' | 'createdAt'> & { id?: string }): Promise<MockTestEntry> {
    return safeDbLocal(async () => {
      return (await repo.mockTests.create(item as never)) as unknown as MockTestEntry
    })
  },

  async addTopicProgress(item: Omit<TopicProgress, 'id' | 'lastReviewedAt' | 'updatedAt'> & { id?: string; lastReviewedAt?: string }): Promise<TopicProgress> {
    return safeDbLocal(async () => {
      return (await repo.topicsProgress.create(item as never)) as unknown as TopicProgress
    })
  },

  async updateTopicProgress(id: string, changes: Partial<TopicProgress>): Promise<void> {
    return safeDbLocal(async () => {
      await repo.topicsProgress.update(id, {
        ...changes,
        lastReviewedAt: new Date().toISOString(),
      } as never)
    })
  },

  async getAll<T>(table: keyof IDatabase): Promise<T[]> {
    return this.safeGetAll<T>(table)
  },

  async getAllPaginated<T>(table: keyof IDatabase, params?: { page?: number; pageSize?: number }): Promise<PaginatedResult<T>> {
    return this.safeGetAllPaginated<T>(table, params)
  },

  async getById<T>(table: keyof IDatabase, id: string): Promise<T | undefined> {
    return this.safeGetById<T>(table, id)
  },

  async add<T>(table: keyof IDatabase, item: T): Promise<string> {
    return this.safeAdd(table, item as Record<string, unknown>)
  },

  async put<T>(table: keyof IDatabase, item: T): Promise<void> {
    return this.safePut(table, item as Record<string, unknown>)
  },

  async update<T>(table: keyof IDatabase, id: string, changes: Partial<T>): Promise<void> {
    return this.safeUpdate(table, id, changes)
  },

  async remove(table: keyof IDatabase, id: string): Promise<void> {
    return this.safeRemove(table, id)
  },

  async clearTable(table: keyof IDatabase): Promise<void> {
    return this.safeClearTable(table)
  },

  async count(table: keyof IDatabase): Promise<number> {
    return this.safeCount(table)
  },

  async bulkAdd<T>(table: keyof IDatabase, items: T[]): Promise<void> {
    return this.safeBulkAdd(table, items as Record<string, unknown>[])
  },

  async bulkPut<T>(table: keyof IDatabase, items: T[]): Promise<void> {
    return this.safeBulkPut(table, items as Record<string, unknown>[])
  },

  async queryByIndex<T>(table: keyof IDatabase, index: string, value: unknown): Promise<T[]> {
    return this.safeQueryByIndex(table, index, value)
  },

  async queryByDateRange<T extends { createdAt: string }>(
    table: keyof IDatabase,
    start: string,
    end: string,
  ): Promise<T[]> {
    return this.safeQueryByDateRange(table, start, end)
  },

  async addTag(table: keyof IDatabase, id: string, tag: string): Promise<void> {
    return safeDbLocal(async () => {
      const item = await getRepo(table).findByIdOrThrow(id)
      const tags = Array.isArray((item as Record<string, unknown>).tags)
        ? [...((item as Record<string, unknown>).tags as string[])]
        : []
      if (!tags.includes(tag)) {
        tags.push(tag)
        await getRepo(table).update(id, { tags } as never)
      }
    })
  },

  async removeTag(table: keyof IDatabase, id: string, tag: string): Promise<void> {
    return safeDbLocal(async () => {
      const item = await getRepo(table).findByIdOrThrow(id)
      const tags = Array.isArray((item as Record<string, unknown>).tags)
        ? ((item as Record<string, unknown>).tags as string[]).filter(t => t !== tag)
        : []
      await getRepo(table).update(id, { tags } as never)
    })
  },

  async setTags(table: keyof IDatabase, id: string, tags: string[]): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { tags } as never)
    })
  },

  async filterByTag<T>(table: keyof IDatabase, tag: string): Promise<T[]> {
    return safeDbLocal(async () => {
      const all = await this.safeGetAll<T>(table)
      return all.filter(item => {
        const t = item as Record<string, unknown>
        return Array.isArray(t.tags) && (t.tags as string[]).includes(tag)
      })
    })
  },

  async filterByTags<T>(table: keyof IDatabase, tags: string[], mode: 'any' | 'all' = 'any'): Promise<T[]> {
    return safeDbLocal(async () => {
      const all = await this.safeGetAll<T>(table)
      return all.filter(item => {
        const t = item as Record<string, unknown>
        const itemTags = Array.isArray(t.tags) ? t.tags as string[] : []
        return mode === 'any'
          ? tags.some(tag => itemTags.includes(tag))
          : tags.every(tag => itemTags.includes(tag))
      })
    })
  },

  async getAllTags(table: keyof IDatabase): Promise<string[]> {
    return safeDbLocal(async () => {
      const all = await this.safeGetAll(table)
      const tagSet = new Set<string>()
      for (const item of all) {
        const t = item as Record<string, unknown>
        if (Array.isArray(t.tags)) {
          for (const tag of t.tags as string[]) {
            tagSet.add(tag)
          }
        }
      }
      return Array.from(tagSet).sort()
    })
  },

  async markAsFavorite(table: keyof IDatabase, id: string, isFavorite: boolean = true): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { isFavorite } as never)
    })
  },

  async setDifficulty(table: keyof IDatabase, id: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { difficulty } as never)
    })
  },

  async setLearningStatus(table: keyof IDatabase, id: string, status: string): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { status } as never)
    })
  },

  async markAsLearned(table: keyof IDatabase, id: string): Promise<void> {
    return safeDbLocal(async () => {
      const item = await getRepo(table).findByIdOrThrow(id)
      const record = item as Record<string, unknown>
      if (record.status) {
        await getRepo(table).update(id, { status: 'mastered' } as never)
      }
    })
  },

  async markAsNeedsReview(table: keyof IDatabase, id: string): Promise<void> {
    return safeDbLocal(async () => {
      const item = await getRepo(table).findByIdOrThrow(id)
      const record = item as Record<string, unknown>
      if (record.status) {
        await getRepo(table).update(id, { status: 'needs-review' } as never)
      }
    })
  },

  async markAsDone(table: keyof IDatabase, id: string): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { isDone: true } as never)
    })
  },

  async markAsNotDone(table: keyof IDatabase, id: string): Promise<void> {
    return safeDbLocal(async () => {
      await getRepo(table).update(id, { isDone: false } as never)
    })
  },

  async searchByText<T>(table: keyof IDatabase, query: string, fields: string[]): Promise<T[]> {
    return safeDbLocal(async () => {
      return (await getRepo(table).searchByText(query, fields)) as unknown as T[]
    })
  },

  async getTasksForDate(date: string): Promise<TaskEntry[]> {
    return safeDbLocal(async () => {
      return repo.tasks.findByDate(date) as unknown as Promise<TaskEntry[]>
    })
  },

  async getSessionsBetween(
    start: string,
    end: string,
  ): Promise<{
    readingSessions: ReadingSession[]
    listeningSessions: ListeningSession[]
    writingSessions: WritingSession[]
    speakingSessions: SpeakingSession[]
  }> {
    return safeDbLocal(async () => {
      const [reading, listening, writing, speaking] = await Promise.all([
        repo.readingSessions.findByDateRange('createdAt', start, end),
        repo.listeningSessions.findByDateRange('createdAt', start, end),
        repo.writingSessions.findByDateRange('createdAt', start, end),
        repo.speakingSessions.findByDateRange('createdAt', start, end),
      ])
      return {
        readingSessions: reading as unknown as ReadingSession[],
        listeningSessions: listening as unknown as ListeningSession[],
        writingSessions: writing as unknown as WritingSession[],
        speakingSessions: speaking as unknown as SpeakingSession[],
      }
    })
  },

  async getStats(): Promise<DatabaseStats> {
    return safeDbLocal(async () => {
      const entries = await Promise.all(
        TABLE_NAMES.map(async (name) => ({
          name,
          count: await getRepo(name as TableName).count(),
        })),
      )
      const stats: DatabaseStats = {}
      for (const { name, count } of entries) {
        stats[name] = count
      }
      return stats
    })
  },

  async exportAll(): Promise<AppExportData> {
    return safeDbLocal(async () => {
      const data = await exportAllData()
      const result: Record<string, unknown> = {
        version: data.meta.version,
        exportedAt: data.meta.exportedAt,
        settings: data.settings,
      }
      for (const name of TABLE_NAMES) {
        result[name] = (data as unknown as Record<string, unknown>)[name]
      }
      return result as unknown as AppExportData
    })
  },

  async importAll(data: AppExportData, mode: 'merge' | 'replace' = 'replace'): Promise<{ added: number; updated: number; skipped: number; failed: number; errors: string[] }> {
    return safeDbLocal(async () => {
      if (!data || typeof data !== 'object') {
        throw new DatabaseError('Invalid backup data: must be an object')
      }
      const obj = data as unknown as Record<string, unknown>
      if (typeof obj.version !== 'number') throw new DatabaseError('Invalid backup data: version must be a number')
      if (typeof obj.exportedAt !== 'string') throw new DatabaseError('Invalid backup data: exportedAt must be a string')
      if (!obj.settings || typeof obj.settings !== 'object') throw new DatabaseError('Invalid backup data: settings is required')
      for (const key of TABLE_NAMES) {
        if (!Array.isArray(obj[key])) {
          throw new DatabaseError(`Invalid backup data: ${key} must be an array`)
        }
      }
      const result = await importBackup(data as never, mode)
      if (data.settings) {
        try {
          localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(data.settings))
        } catch { /* ignore */ }
      }
      return result
    })
  },

  async importReplaceAll(data: AppExportData): Promise<{ added: number; updated: number; skipped: number; failed: number; errors: string[] }> {
    return this.importAll(data, 'replace')
  },

  async importMergeAll(data: AppExportData): Promise<{ added: number; updated: number; skipped: number; failed: number; errors: string[] }> {
    return this.importAll(data, 'merge')
  },

  async exportJson(): Promise<string> {
    const data = await this.exportAll()
    return JSON.stringify(data, null, 2)
  },

  async importJson(json: string, mode: 'merge' | 'replace' = 'replace'): Promise<{ added: number; updated: number; skipped: number; failed: number; errors: string[] }> {
    const data = JSON.parse(json)
    return await this.importAll(data, mode)
  },

  async partialImport(
    data: Partial<AppExportData>,
    tableNames: (keyof AppExportData)[],
    mode: 'merge' | 'replace' = 'merge',
  ): Promise<{ added: number; updated: number; skipped: number; failed: number; errors: string[] }> {
    return safeDbLocal(async () => {
      const result: { added: number; updated: number; skipped: number; failed: number; errors: string[] } = {
        added: 0, updated: 0, skipped: 0, failed: 0, errors: [],
      }
      for (const key of tableNames as TableName[]) {
        const items = (data as unknown as Record<string, unknown[]>)[key]
        if (!items || !Array.isArray(items) || items.length === 0) continue
        const repo = getRepo(key as keyof IDatabase)
        if (mode === 'replace') {
          await repo.clear()
        }
        for (const item of items) {
          try {
            const itemRecord = item as Record<string, unknown>
            const id = itemRecord.id as string | undefined
            if (mode === 'merge' && id) {
              const existing = await repo.findById(id)
              if (existing) {
                await repo.update(id, item as never)
                result.updated++
              } else {
                await repo.create(item as never)
                result.added++
              }
            } else {
              await repo.create(item as never)
              result.added++
            }
          } catch (error) {
            console.error('apps/web/src/services/storage/Database.ts error:', error);
            result.failed++
          }
        }
      }
      return result
    })
  },

  async clearAll(): Promise<void> {
    return safeDbLocal(async () => {
      await clearAllTables()
    })
  },

  async resetAll(): Promise<void> {
    await this.clearAll()
    clearAllLocalStorage()
  },
}

export default DatabaseService

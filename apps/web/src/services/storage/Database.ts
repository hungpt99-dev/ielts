import {
  initDb, getDb as storageGetDb, destroyDb, isDbOpen, safeDb,
  TABLE_NAMES, APP_SCHEMA,
  exportAllData, importBackup, clearAllTables,
  type PaginationParams, type PaginatedResult,
  type ImportMode, type ImportSummary,
  ValidationError,
  BaseRepository,
  VocabularyRepository, VocabReviewRepository,
  MistakeRepository, TaskRepository,
  ReadingSessionRepository, ListeningSessionRepository,
  WritingSessionRepository, SpeakingSessionRepository,
  ReadingPracticeSessionRepository, ListeningPracticeSessionRepository,
  GrammarNoteRepository, MockTestRepository,
  ProgressRecordRepository, TopicProgressRepository,
  AiContentRepository, CustomStudyPlanRepository,
  IeltsTopicRepository, ExampleSentenceRepository,
  ListeningTranscriptRepository, PassageEntryRepository,
  PublicApiContentRepository, ReadingPassageRepository,
  SpeakingQuestionRepository, StudyNoteRepository,
  UsefulPhraseRepository, WritingPromptRepository,
  SpeakingExerciseRepository, WritingExerciseRepository,
  ReadingExerciseRepository, ListeningExerciseRepository,
  ArtifactRepository,
} from '@ielts/storage'
export { ValidationError }
export type { PaginationParams, PaginatedResult, ImportMode, ImportSummary }

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export { AppDatabase } from '@ielts/storage'
export type { AppExportData } from '@ielts/storage'

let _initialized = false
export function getDb() {
  if (!_initialized || !isDbOpen()) {
    initDb(APP_SCHEMA)
    _initialized = true
  }
  return storageGetDb()
}
export const destroyDb = () => {
  try { storageGetDb().delete().then(() => { _initialized = false }) } catch { _initialized = false }
}
export const clearAllLocalStorage = () => {
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ielts-')) toRemove.push(key)
  }
  for (const key of toRemove) { try { localStorage.removeItem(key) } catch {} }
}

const repos: Record<string, BaseRepository<any>> = {
  vocabulary: new VocabularyRepository(),
  vocabularyReviews: new VocabReviewRepository(),
  tasks: new TaskRepository(),
  readingSessions: new ReadingSessionRepository(),
  listeningSessions: new ListeningSessionRepository(),
  writingSessions: new WritingSessionRepository(),
  speakingSessions: new SpeakingSessionRepository(),
  readingPracticeSessions: new ReadingPracticeSessionRepository(),
  listeningPracticeSessions: new ListeningPracticeSessionRepository(),
  grammarNotes: new GrammarNoteRepository(),
  mistakes: new MistakeRepository(),
  mockTests: new MockTestRepository(),
  topicsProgress: new TopicProgressRepository(),
  progressRecords: new ProgressRecordRepository(),
  aiContents: new AiContentRepository(),
  customStudyPlans: new CustomStudyPlanRepository(),
  ieltsTopics: new IeltsTopicRepository(),
  exampleSentences: new ExampleSentenceRepository(),
  readingPassages: new ReadingPassageRepository(),
  listeningTranscripts: new ListeningTranscriptRepository(),
  writingPrompts: new WritingPromptRepository(),
  speakingQuestions: new SpeakingQuestionRepository(),
  studyNotes: new StudyNoteRepository(),
  usefulPhrases: new UsefulPhraseRepository(),
  writingExercises: new WritingExerciseRepository(),
  readingExercises: new ReadingExerciseRepository(),
  listeningExercises: new ListeningExerciseRepository(),
  speakingExercises: new SpeakingExerciseRepository(),
  passages: new PassageEntryRepository(),
  publicApiContent: new PublicApiContentRepository(),
  artifacts: new ArtifactRepository(),
}

function getRepo(table: string): BaseRepository<any> {
  const r = repos[table]
  if (!r) throw new Error(`Unknown table: ${table}`)
  return r
}

/**
 * @deprecated Import repository classes directly from `@ielts/storage` instead.
 */
export const DatabaseService = {
  async safeGetAll<T>(table: string): Promise<T[]> { return safeDb(async () => getRepo(table).findAll() as T[]) },
  async safeGetById<T>(table: string, id: string): Promise<T | undefined> { return safeDb(async () => getRepo(table).findById(id) as T | undefined) },
  async safeAdd(table: string, item: Record<string, unknown>): Promise<string> { return safeDb(async () => getRepo(table).create(item as any)).then((r: any) => r.id) },
  async safePut(table: string, item: Record<string, unknown>): Promise<void> { return safeDb(async () => { await getRepo(table).bulkUpsert([item as any]) }) },
  async safeUpdate<T>(table: string, id: string, changes: Partial<T>): Promise<void> { return safeDb(async () => getRepo(table).update(id, changes as any)) },
  async safeRemove(table: string, id: string): Promise<void> { return safeDb(async () => getRepo(table).delete(id)) },
  async safeCount(table: string): Promise<number> { return safeDb(async () => getRepo(table).count()) },
  async safeBulkAdd(table: string, items: Record<string, unknown>[]): Promise<void> { return safeDb(async () => { await getRepo(table).bulkCreate(items as any[]) }) },
  async safeQueryByIndex<T>(table: string, index: string, value: unknown): Promise<T[]> { return safeDb(async () => getRepo(table).queryByIndex(index, value) as T[]) },
  async safeGetAllPaginated<T>(table: string, params?: PaginationParams): Promise<PaginatedResult<T>> { return safeDb(async () => getRepo(table).findAllPaginated(params) as PaginatedResult<T>) },
  async getAll<T>(table: string): Promise<T[]> { return this.safeGetAll<T>(table) },
  async getById<T>(table: string, id: string): Promise<T | undefined> { return this.safeGetById<T>(table, id) },
  async add<T>(table: string, item: T): Promise<string> { return this.safeAdd(table, item as Record<string, unknown>) },
  async put<T>(table: string, item: T): Promise<void> { return this.safePut(table, item as Record<string, unknown>) },
  async remove(table: string, id: string): Promise<void> { return this.safeRemove(table, id) },
  async count(table: string): Promise<number> { return this.safeCount(table) },
  async bulkAdd(table: string, items: Record<string, unknown>[]): Promise<void> { return this.safeBulkAdd(table, items) },
  async queryByIndex<T>(table: string, index: string, value: unknown): Promise<T[]> { return this.safeQueryByIndex<T>(table, index, value) },
  async addVocabulary(item: any): Promise<any> { return repos.vocabulary.create(item) },
  async addTask(item: any): Promise<any> { return repos.tasks.create(item) },
  async addTopicProgress(item: any): Promise<any> {
    return repos.topicsProgress.create({ ...item, lastReviewedAt: item.lastReviewedAt || new Date().toISOString() })
  },
  async updateTopicProgress(id: string, changes: any): Promise<void> {
    return repos.topicsProgress.update(id, { ...changes, lastReviewedAt: new Date().toISOString() })
  },
  async getTasksForDate(date: string): Promise<any[]> {
    return safeDb(async () => {
      const all: any[] = await repos.tasks.findAll()
      return all.filter((t: any) => t.date && t.date.slice(0, 10) === date.slice(0, 10))
    })
  },
  async exportAll<T>(): Promise<T> { return exportAllData() as T },
  async importAll(data: any, mode: ImportMode = 'replace') { return importBackup(data, mode) },
  async clearAll(): Promise<void> { return clearAllTables() },
  async resetAll(): Promise<void> { await clearAllTables(); localStorage.clear() },
}

export default DatabaseService

export { initDb, getDb, destroyDb, isDbOpen, safeDb, TABLE_NAMES, DB_NAME, AppDatabase } from './db'
export type { IDatabase } from './db'

export {
  APP_SCHEMA,
  CURRENT_DB_VERSION,
  getSchemaForVersion,
  getStoreNamesForVersion,
  applyMigrations,
  getAppliedVersion,
  clearAppliedVersion,
} from './migrations'
export type { AppDatabaseSchema, StorageVersion } from './migrations'

export {
  StorageError,
  ValidationError,
  MigrationError,
  BackupError,
  EntityNotFoundError,
  DuplicateEntityError,
  DatabaseClosedError,
} from './errors'

export {
  BaseRepository,
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
  ContentMetaRepository,
  UserContentEditRepository,
  SpeakingExerciseRepository,
  WritingExerciseRepository,
  ReadingExerciseRepository,
  ListeningExerciseRepository,
} from './repositories'
export type { RepositoryItem, PaginationParams, PaginatedResult } from './repositories'
export type { ExerciseEntry } from './repositories'
export type {
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  TaskEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  ReadingPracticeSession,
  ListeningPracticeSession,
  GrammarNote,
  MockTestEntry,
  ProgressRecord,
  TopicProgress,
  AiContent,
  CustomStudyPlan,
  ExampleSentence,
  IeltsTopic,
  ListeningTranscript,
  PassageEntry,
  PublicApiContent,
  ReadingPassage,
  SpeakingQuestion,
  StudyNote,
  UsefulPhrase,
  WritingPrompt,
  ContentMeta,
  UserContentEdit,
} from './repositories'

export {
  exportAllData,
  downloadBackup,
  validateBackupData,
  validateBackupDataDetailed,
  readBackupFile,
  importBackup,
  clearAllTables,
  mergeBackupWithDedup,
  isDuplicate,
  collectExistingIds,
  generateBackupFilename,
  DuplicateStrategy,
} from './backup'
export type { AppBackupData, ImportMode, ImportSummary } from './backup'

export {
  addVocabularyToReview,
  getDueReviews,
  updateReview,
  getReviewStats,
} from './reviewService'
export type { ReviewStats, ReviewRating } from './reviewService'

export {
  exportExtensionData,
  importExtensionData,
  getSyncStatus,
  saveSyncStatus,
  markItemPending,
  markItemsSynced,
  markSyncFailed,
  downloadJson,
  generateExportFilename,
  readJsonFile,
  validateExtensionExportData,
  createBridgeMessage,
  isValidBridgeMessage,
} from './syncService'
export type {
  ExtensionExportData,
  ImportMode as SyncImportMode,
  SyncSummary,
  SyncStatus,
  StorageGet,
  StorageSet,
  StorageHandlers,
  BridgeMessage,
  BridgeResponse,
} from './syncService'

export * from './schema'

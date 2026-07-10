export { initDb, getDb, destroyDb, isDbOpen, safeDb, TABLE_NAMES, AppDatabase } from './db'

export {
  APP_SCHEMA,
} from './migrations'

export {
  ValidationError,
} from './errors'

export {
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
  ArtifactRepository,
} from './repositories'
export type { RepositoryItem, PaginationParams, PaginatedResult } from './repositories'
export type { ExerciseEntry, Artifact } from './repositories'
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
  YouTubeVideoRepository,
  TranscriptRepository,
  VideoAnalysisRepository,
  VideoVocabularySourceRepository,
  SavedSentenceRepository,
  TimestampedNoteRepository,
  LearningPlaylistRepository,
  PlaylistItemRepository,
  VideoStudySessionRepository,
  StudyActivityRepository,
  ExerciseRepository,
  ExerciseAttemptRepository,
  DictationAttemptRepository,
  ShadowingAttemptRepository,
  SpeakingAttemptRepository,
  SummaryAttemptRepository,
  TutorInterventionRepository,
  AIGenerationCacheRepository,
  ChannelEvaluationRepository,
} from './youtube-repositories'

export type {
  YouTubeVideo, Transcript, TranscriptSegment,
  VideoAnalysis, VideoVocabularySource, SavedSentence,
  TimestampedNote, LearningPlaylist, PlaylistItem,
  VideoStudySession, StudyActivity, Exercise,
  ExerciseAttempt, DictationAttempt, ShadowingAttempt,
  SpeakingAttempt, SummaryAttempt, TutorIntervention,
  AIGenerationCache, ChannelEvaluation,
} from './youtube-schemas'

export {
  exportAllData,
  importBackup,
  clearAllTables,
} from './backup'
export type { AppBackupData, ImportMode, ImportSummary } from './backup'

export {
  DATA_SYNC_ACTION,
  createMessageId,
} from './syncProtocol'
export type {
  DataSyncPayload,
  SyncEntityType,
  SyncOperation,
} from './syncProtocol'

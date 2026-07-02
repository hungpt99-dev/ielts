import type { VocabularyEntry, VocabReviewEntry, TaskEntry, MistakeEntry } from '../repositories'
import type {
  ReadingSession, ListeningSession, WritingSession, SpeakingSession,
  ReadingPracticeSession, ListeningPracticeSession,
} from '../repositories'
import type {
  GrammarNote, MockTestEntry, ProgressRecord, TopicProgress,
} from '../repositories'
import type {
  AiContent, CustomStudyPlan, ExampleSentence, IeltsTopic,
  ListeningTranscript, PassageEntry, ReadingPassage,
  SpeakingQuestion, StudyNote, UsefulPhrase, WritingPrompt,
} from '../repositories'

export type ImportMode = 'merge' | 'replace'

export interface BackupMeta {
  version: number
  exportedAt: string
  source: 'web-app' | 'extension'
  appVersion: string
}

export interface AppBackupData {
  meta: BackupMeta
  settings: Record<string, unknown>
  vocabulary: VocabularyEntry[]
  vocabularyReviews: VocabReviewEntry[]
  tasks: TaskEntry[]
  readingSessions: ReadingSession[]
  readingPracticeSessions: ReadingPracticeSession[]
  listeningSessions: ListeningSession[]
  listeningPracticeSessions: ListeningPracticeSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  grammarNotes: GrammarNote[]
  mistakes: MistakeEntry[]
  mockTests: MockTestEntry[]
  topicsProgress: TopicProgress[]
  passages: PassageEntry[]
  ieltsTopics: IeltsTopic[]
  exampleSentences: ExampleSentence[]
  readingPassages: ReadingPassage[]
  listeningTranscripts: ListeningTranscript[]
  writingPrompts: WritingPrompt[]
  speakingQuestions: SpeakingQuestion[]
  studyNotes: StudyNote[]
  customStudyPlans: CustomStudyPlan[]
  usefulPhrases: UsefulPhrase[]
  aiContents: AiContent[]
  publicApiContent: PublicApiImportedContent[]
  progressRecords: ProgressRecord[]
}

export interface PublicApiImportedContent {
  id: string
  title: string
  content: string
  contentType: string
  sourceType: string
  sourceName: string
  sourceUrl: string
  licenseName: string
  attribution: string
  importedAt: string
  skill: string
  topic: string
  difficulty: string
  tags: string[]
  userNotes: string
  aiClassification?: Record<string, unknown>
}

export interface ImportSummary {
  added: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export interface DuplicateRecord {
  id: string
  table: string
  reason: string
}

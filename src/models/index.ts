// ============================================================
// IELTS Learning Journey — TypeScript Data Models
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

export type ISOString = string

export type TaskCategory =
  | 'Vocabulary'
  | 'Reading'
  | 'Listening'
  | 'Writing Task 1'
  | 'Writing Task 2'
  | 'Speaking Part 1'
  | 'Speaking Part 2'
  | 'Speaking Part 3'
  | 'Grammar'
  | 'Mock Test'

export type MistakeSkill =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'

export type VocabDifficulty = 'easy' | 'medium' | 'hard'

export type VocabStatus = 'new' | 'learning' | 'reviewing' | 'mastered'

export type GrammarStatus = 'weak' | 'reviewing' | 'mastered'

export type MistakeStatus = 'new' | 'reviewed' | 'resolved'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export type SpeakingPart = 1 | 2 | 3

export type WritingTaskType = 'task1' | 'task2'

export type PassageSource = 'user-created' | 'pasted'

export type QuestionType =
  | 'True / False / Not Given'
  | 'Matching Headings'
  | 'Multiple Choice'
  | 'Sentence Completion'
  | 'Summary Completion'
  | 'Matching Information'

// ── Settings (localStorage) ──────────────────────────────────

export interface AppSettings {
  targetBand: number
  currentBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
  studyReminder: string
  aiApiKey: string
  aiProvider: 'openai' | 'custom'
  aiEndpoint: string
  aiModel: string
  darkMode: boolean
  sampleDataLoaded: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  targetBand: 7.0,
  currentBand: 5.5,
  examDate: '',
  dailyStudyMinutes: 60,
  weakSkills: [],
  preferredTopics: [],
  studyReminder: 'Time to study IELTS!',
  aiApiKey: '',
  aiProvider: 'openai',
  aiEndpoint: '',
  aiModel: 'gpt-4o-mini',
  darkMode: false,
  sampleDataLoaded: false,
}

// ── Vocabulary ───────────────────────────────────────────────

export interface VocabularyEntry {
  id: string
  word: string
  meaning: string
  meaningVi: string
  pronunciation: string
  partOfSpeech: string
  topic: string
  exampleSentence: string
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  wordFamily: string[]
  personalNote: string
  difficulty: VocabDifficulty
  status: VocabStatus
  tags: string[]
  createdAt: ISOString
  updatedAt: ISOString
}

export interface VocabReviewEntry {
  id: string
  vocabularyId: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewDate: ISOString
  lastReviewDate: ISOString
  history: Array<{
    date: ISOString
    rating: ReviewRating
  }>
}

// ── Tasks ────────────────────────────────────────────────────

export interface TaskEntry {
  id: string
  title: string
  description: string
  category: TaskCategory
  date: ISOString
  isDone: boolean
  isRecurring: boolean
  recurringDays: number[]
  notes: string
  timeMinutes: number
  createdAt: ISOString
  updatedAt: ISOString
  completedAt: ISOString | null
}

// ── Reading Journal ──────────────────────────────────────────

export interface ReadingSession {
  id: string
  title: string
  topic: string
  sourceUrl: string
  passageText: string
  questionType: QuestionType
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  timeSpentMinutes: number
  newVocabulary: string[]
  summary: string
  mistakes: string
  notes: string
  createdAt: ISOString
}

// ── Listening Journal ────────────────────────────────────────

export interface ListeningSession {
  id: string
  title: string
  sourceUrl: string
  topic: string
  durationMinutes: number
  section: number
  score: number
  transcriptNotes: string
  newVocabulary: string[]
  difficultSentences: string
  mistakes: string
  shadowingNotes: string
  selfRating: number
  createdAt: ISOString
}

// ── Writing Practice ─────────────────────────────────────────

export interface WritingSession {
  id: string
  taskType: WritingTaskType
  question: string
  essay: string
  topic: string
  wordCount: number
  timeSpentMinutes: number
  estimatedBand: number
  feedback: string
  grammarMistakes: string
  vocabularyMistakes: string
  coherenceNotes: string
  improvedSentences: string
  betterVersion: string
  personalReflection: string
  createdAt: ISOString
}

// ── Speaking Practice ────────────────────────────────────────

export interface SpeakingSession {
  id: string
  part: SpeakingPart
  question: string
  answerNotes: string
  topic: string
  durationSeconds: number
  selfRating: number
  fluencyNotes: string
  vocabularyNotes: string
  grammarMistakes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
  createdAt: ISOString
}

// ── Grammar Notebook ─────────────────────────────────────────

export interface GrammarNote {
  id: string
  topic: string
  explanation: string
  exampleSentences: string[]
  commonMistakes: string[]
  correctedExamples: string[]
  personalNote: string
  relatedSkill: string
  status: GrammarStatus
  createdAt: ISOString
  updatedAt: ISOString
}

// ── Mistake Notebook ─────────────────────────────────────────

export interface MistakeEntry {
  id: string
  mistake: string
  correction: string
  explanation: string
  source: string
  date: ISOString
  skill: MistakeSkill
  status: MistakeStatus
  repetitionCount: number
  createdAt: ISOString
  updatedAt: ISOString
}

// ── Mock Test Tracker ────────────────────────────────────────

export interface MockTestEntry {
  id: string
  date: ISOString
  listeningScore: number
  readingScore: number
  writingBand: number
  speakingBand: number
  overallBand: number
  notes: string
  weakAreas: string[]
  improvementPlan: string
  createdAt: ISOString
}

// ── Topics Progress ──────────────────────────────────────────

export interface TopicProgress {
  id: string
  topic: string
  vocabularyCount: number
  readingCount: number
  listeningCount: number
  writingCount: number
  speakingCount: number
  weakPoints: string[]
  updatedAt: ISOString
}

// ── Vocabulary in Context (Passages) ─────────────────────────

export interface PassageEntry {
  id: string
  title: string
  content: string
  highlightedWords: string[]
  source: PassageSource
  createdAt: ISOString
  updatedAt: ISOString
}

// ── Dashboard / View Models ──────────────────────────────────

export interface DashboardData {
  todayTasks: TaskEntry[]
  studyStreak: number
  weeklyProgress: { done: number; total: number }
  totalStudyHours: number
  targetBand: number
  currentBand: number
  weakSkills: string[]
  dueReviews: number
  todayFocus: string
  recentSessions: {
    reading: number
    listening: number
    writing: number
    speaking: number
  }
}

export interface WeeklyStudyDay {
  date: ISOString
  minutes: number
  tasksDone: number
}

export interface BandProgress {
  date: ISOString
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
}

export interface SkillBalance {
  skill: string
  sessions: number
  hours: number
}

// ── Search ───────────────────────────────────────────────────

export interface SearchResult {
  id: string
  type: 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'mistake'
  title: string
  snippet: string
  skill?: string
  topic?: string
  date: ISOString
  url: string
}

// ── Import / Export ──────────────────────────────────────────

export interface AppExportData {
  version: number
  exportedAt: ISOString
  settings: AppSettings
  vocabulary: VocabularyEntry[]
  vocabularyReviews: VocabReviewEntry[]
  tasks: TaskEntry[]
  readingSessions: ReadingSession[]
  listeningSessions: ListeningSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  grammarNotes: GrammarNote[]
  mistakes: MistakeEntry[]
  mockTests: MockTestEntry[]
  topicsProgress: TopicProgress[]
  passages: PassageEntry[]
}

// ── Seed data types (for typed constants) ────────────────────

export interface SeedData {
  vocabulary: Array<Omit<VocabularyEntry, 'id' | 'createdAt' | 'updatedAt'>>
  tasks: Array<Omit<TaskEntry, 'id' | 'createdAt' | 'updatedAt'>>
  grammarNotes: Array<Omit<GrammarNote, 'id' | 'createdAt' | 'updatedAt'>>
  readingSessions: Array<Omit<ReadingSession, 'id' | 'createdAt'>>
  listeningSessions: Array<Omit<ListeningSession, 'id' | 'createdAt'>>
  writingSessions: Array<Omit<WritingSession, 'id' | 'createdAt'>>
  speakingSessions: Array<Omit<SpeakingSession, 'id' | 'createdAt'>>
  mockTests: Array<Omit<MockTestEntry, 'id' | 'createdAt'>>
  passages: Array<Omit<PassageEntry, 'id' | 'createdAt' | 'updatedAt'>>
}

// ============================================================
// IELTS Learning Journey — TypeScript Data Models
// ============================================================


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

export type LearningStatus = 'new' | 'learning' | 'reviewing' | 'mastered' | 'needs-review'

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


import type { AISettings } from '@ielts/settings'
import { DEFAULT_AI_SETTINGS } from '@ielts/settings'

export type StudyGoal = 'academic' | 'general'

export interface AppSettings {
  targetBand: number
  currentBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
  studyReminder: string
  studyGoal: StudyGoal
  preferredSchedule: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  aiApiKey: AISettings['aiApiKey']
  aiProvider: AISettings['aiProvider']
  aiBaseUrl: AISettings['aiBaseUrl']
  aiEndpoint: string
  aiModel: AISettings['aiModel']
  darkMode: boolean
  aiEnabled: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  targetBand: 7.0,
  currentBand: 5.5,
  examDate: '',
  dailyStudyMinutes: 60,
  weakSkills: [],
  preferredTopics: [],
  studyReminder: 'Time to study IELTS!',
  studyGoal: 'academic',
  preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  aiApiKey: DEFAULT_AI_SETTINGS.aiApiKey,
  aiProvider: DEFAULT_AI_SETTINGS.aiProvider,
  aiBaseUrl: DEFAULT_AI_SETTINGS.aiBaseUrl,
  aiEndpoint: '',
  aiModel: DEFAULT_AI_SETTINGS.aiModel,
  darkMode: false,
  aiEnabled: false,
}


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


export interface TopicProgress {
  id: string
  topicId: string
  topic: string
  progressPercent: number
  vocabularyCount: number
  readingCount: number
  listeningCount: number
  writingCount: number
  speakingCount: number
  weakPoints: string[]
  lastReviewedAt: ISOString
  updatedAt: ISOString
}


export type ReadingQuestionType =
  | 'multiple-choice'
  | 'true-false-not-given'
  | 'matching-headings'
  | 'gap-fill'

export interface ReadingQuestion {
  id: string
  type: ReadingQuestionType
  question: string
  options?: string[]
  correctAnswer: string | number | string[]
  explanation: string
  headings?: string[]
  paragraphs?: { id: string; text: string }[]
  correctMatches?: Record<string, number>
  blanks?: string[]
}

export interface ReadingPassageWithQuestions {
  id: string
  title: string
  topic: string
  text: string
  questions: ReadingQuestion[]
  difficulty: 'easy' | 'medium' | 'hard'
  wordCount: number
  estimatedMinutes: number
}

export interface ReadingPracticeSession {
  id: string
  passageId: string
  title: string
  topic: string
  passageText: string
  questions: ReadingQuestion[]
  answers: Record<string, unknown>
  score: number
  totalQuestions: number
  accuracy: number
  timeSpentSeconds: number
  mistakes: Array<{
    questionId: string
    question: string
    userAnswer: string
    correctAnswer: string
    explanation: string
  }>
  createdAt: ISOString
}


export type ListeningQuestionType =
  | 'multiple-choice'
  | 'gap-fill'
  | 'true-false'
  | 'short-answer'
  | 'multiple-answer'
  | 'table-completion'

export interface TableRow {
  label: string
  blanks: string[]
}

export interface ListeningQuestion {
  id: string
  type: ListeningQuestionType
  question: string
  options?: string[]
  correctAnswer: string | number | string[]
  acceptableAnswers?: string[]
  tableHeaders?: string[]
  tableRows?: TableRow[]
  explanation: string
  blanks?: string[]
}

export interface ListeningExercise {
  id: string
  title: string
  topic: string
  transcript: string
  audioUrl: string
  audioType: 'audio' | 'youtube'
  questions: ListeningQuestion[]
  difficulty: 'easy' | 'medium' | 'hard'
  wordCount: number
  estimatedMinutes: number
}

export interface ListeningPracticeSession {
  id: string
  exerciseId: string
  title: string
  topic: string
  transcript: string
  audioUrl: string
  questions: ListeningQuestion[]
  answers: Record<string, unknown>
  score: number
  totalQuestions: number
  accuracy: number
  timeSpentSeconds: number
  notes: string
  mistakes: Array<{
    questionId: string
    question: string
    userAnswer: string
    correctAnswer: string
    explanation: string
  }>
  createdAt: ISOString
}


export interface PassageEntry {
  id: string
  title: string
  content: string
  highlightedWords: string[]
  source: PassageSource
  createdAt: ISOString
  updatedAt: ISOString
}


export interface IeltsTopic {
  id: string
  name: string
  description: string
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar' | 'general'
  tags: string[]
  color: string
  createdAt: ISOString
  updatedAt: ISOString
}


export interface ExampleSentence {
  id: string
  sentence: string
  meaning: string
  vocabularyId?: string
  topic: string
  source: string
  tags: string[]
  isFavorite: boolean
  status: LearningStatus
  createdAt: ISOString
  updatedAt: ISOString
}


export interface ReadingPassage {
  id: string
  title: string
  content: string
  source: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  wordCount: number
  tags: string[]
  isFavorite: boolean
  status: LearningStatus
  notes: string
  createdAt: ISOString
  updatedAt: ISOString
}


export interface ListeningTranscript {
  id: string
  title: string
  transcript: string
  source: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  audioUrl?: string
  tags: string[]
  isFavorite: boolean
  status: LearningStatus
  notes: string
  createdAt: ISOString
  updatedAt: ISOString
}


export interface WritingPrompt {
  id: string
  taskType: WritingTaskType
  question: string
  topic: string
  instructions: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  isFavorite: boolean
  status: LearningStatus
  isDone: boolean
  notes: string
  createdAt: ISOString
  updatedAt: ISOString
}


export interface SpeakingQuestion {
  id: string
  part: SpeakingPart
  question: string
  topic: string
  cueCard?: string
  followUpQuestions: string[]
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  isFavorite: boolean
  status: LearningStatus
  isDone: boolean
  notes: string
  createdAt: ISOString
  updatedAt: ISOString
}


export interface StudyNote {
  id: string
  title: string
  content: string
  topic: string
  skill: string
  tags: string[]
  isFavorite: boolean
  isDraft: boolean
  createdAt: ISOString
  updatedAt: ISOString
}


export interface StudyPlanTask {
  id: string
  title: string
  description: string
  category: TaskCategory
  durationMinutes: number
  isDone: boolean
}

export interface CustomStudyPlan {
  id: string
  name: string
  description: string
  goal: string
  startDate: ISOString
  endDate: ISOString
  dailyMinutes: number
  daysOfWeek: number[]
  tasks: StudyPlanTask[]
  isActive: boolean
  progress: number
  createdAt: ISOString
  updatedAt: ISOString
}


export interface UsefulPhrase {
  id: string
  phrase: string
  meaning: string
  usageExample: string
  topic: string
  skill: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  isFavorite: boolean
  status: LearningStatus
  createdAt: ISOString
  updatedAt: ISOString
}


export interface PublicApiImportedContent {
  id: string
  title: string
  content: string
  contentType: 'dictionary' | 'vocabulary-list' | 'reading' | 'listening' | 'article' | 'video' | 'exercise' | 'writing-prompt' | 'speaking-topic' | 'reference'
  sourceType: 'public-api'
  sourceName: 'wiktionary' | 'datamuse' | 'tatoeba' | 'oer-commons' | 'wikipedia' | 'gutendex' | 'youtube'
  sourceUrl: string
  licenseName: string
  attribution: string
  importedAt: ISOString
  skill: string
  topic: string
  difficulty: VocabDifficulty
  tags: string[]
  userNotes: string
  aiClassification?: {
    topic: string
    skill: string
    difficulty: VocabDifficulty
    tags: string[]
    vocabulary: string[]
    summary: string
  }
}


export interface AiContent {
  id: string
  type: 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'general'
  prompt: string
  content: string
  title: string
  topic: string
  model: string
  tokens: number
  tags: string[]
  isFavorite: boolean
  createdAt: ISOString
}


export interface ProgressRecord {
  id: string
  date: ISOString
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar'
  metric: string
  value: number
  unit: string
  notes: string
  tags: string[]
  createdAt: ISOString
}


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
  examDate: string
  studyGoal: StudyGoal
  dailyStudyMinutes: number
  recentMistakes: number
  savedVocabularyCount: number
  aiSuggestion: string
  roadmapProgress: number
  examCountdown: number
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


export interface SearchResult {
  id: string
  type: 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'mistake'
  title: string
  snippet: string
  skill?: string
  topic?: string
  difficulty?: VocabDifficulty
  status?: string
  date: ISOString
  url: string
}


export type ArtifactCategory = 'article' | 'video' | 'reference' | 'tool' | 'other'

export interface Artifact {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  tags: string[]
  isFavorite: boolean
  category: ArtifactCategory
  source: string
  createdAt: string
  updatedAt: string
}

export interface WeeklySchedule {
  id: string
  weekStart: ISOString
  weekEnd: ISOString
  totalMinutes: number
  targetBand: number
  dailyMinutes: number
  dayPlans: DayPlan[]
  createdAt: ISOString
}

export interface DayPlan {
  date: ISOString
  plannedMinutes: number
  items: ScheduleItem[]
}

export interface ScheduleItem {
  category: TaskCategory
  title: string
  minutes: number
}

export interface MonthlyOverview {
  month: string
  year: number
  totalPlanned: number
  totalCompleted: number
  completionRate: number
  missedDays: number
}


export interface AppExportData {
  version: number
  exportedAt: ISOString
  settings: AppSettings
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




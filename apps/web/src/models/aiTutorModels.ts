// ============================================================
// AI Tutor Assistant — Data Models
// ============================================================

import type { ISOString, MistakeSkill } from './index'


export type AssistantMode =
  | 'friendly-chat'
  | 'ielts-tutor'
  | 'speaking-partner'
  | 'writing-coach'
  | 'grammar-teacher'
  | 'vocabulary-coach'
  | 'reading-explainer'
  | 'listening-coach'
  | 'study-planner'
  | 'motivation-coach'
  | 'socratic-tutor'


export type QuickActionType =
  | 'teach-me'
  | 'quiz-me'
  | 'correct-english'
  | 'explain-simply'
  | 'give-examples'
  | 'make-exercise'
  | 'remind-later'
  | 'practice-with-me'


export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessageMetadata {
  tokens?: number
  model?: string
  modePrompt?: string
  suggestedActions?: QuickActionType[]
  correctedText?: string
  bandEstimate?: number
  grammarIssues?: string[]
  vocabularySuggestions?: string[]
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  mode: AssistantMode
  metadata?: ChatMessageMetadata
  savedAsNoteId?: string
  createdAt: ISOString
}

export interface ChatSession {
  id: string
  mode: AssistantMode
  title: string
  topic?: string
  topicId?: string
  messageCount: number
  lastMessageAt: ISOString
  isPinned: boolean
  tags: string[]
  metadata?: {
    teachingTopic?: string
    exerciseIds?: string[]
    writingDraftId?: string
    speakingSessionId?: string
    readingPassageId?: string
    listeningTranscriptId?: string
    articleUrl?: string
  }
  createdAt: ISOString
  updatedAt: ISOString
}


export interface MemoryWeakPoint {
  skill: string
  description: string
  detectedAt: ISOString
  frequency: number
}

export interface MemoryMistakePattern {
  pattern: string
  examples: string[]
  skill: MistakeSkill
  suggestion: string
}

export interface MemoryFeedbackSummary {
  date: ISOString
  skill: string
  summary: string
  improvement: string
}

export interface MemoryGoal {
  id: string
  title: string
  description: string
  targetDate?: ISOString
  isAchieved: boolean
  createdAt: ISOString
}

export interface TutorMemory {
  id: string
  currentTopic?: string
  currentTopicSkill?: string
  currentPlan?: string
  learningStreak: number
  lastStudyDate?: ISOString
  weakPoints: MemoryWeakPoint[]
  repeatedMistakePatterns: MemoryMistakePattern[]
  feedbackSummaries: MemoryFeedbackSummary[]
  goals: MemoryGoal[]
  acceptedRecommendations: number
  examDate?: ISOString
  targetBand?: number
  updatedAt: ISOString
}

export function createDefaultTutorMemory(): TutorMemory {
  return {
    id: 'tutor-memory',
    learningStreak: 0,
    weakPoints: [],
    repeatedMistakePatterns: [],
    feedbackSummaries: [],
    goals: [],
    acceptedRecommendations: 0,
    updatedAt: new Date().toISOString(),
  }
}


export interface UserTutorPreferences {
  preferredMode: AssistantMode
  language: 'english' | 'vietnamese' | 'both'
  explanationLevel: 'simple' | 'detailed' | 'expert'
  correctionStyle: 'gentle' | 'direct' | 'socratic'
  useVietnamese: boolean
  autoSaveChat: boolean
  notificationsEnabled: boolean
  reminderTime: string
  dailyCheckIn: boolean
  proactiveSuggestions: boolean
  contextPermission: boolean
}

export const DEFAULT_TUTOR_PREFERENCES: UserTutorPreferences = {
  preferredMode: 'ielts-tutor',
  language: 'english',
  explanationLevel: 'simple',
  correctionStyle: 'gentle',
  useVietnamese: false,
  autoSaveChat: true,
  notificationsEnabled: false,
  reminderTime: '09:00',
  dailyCheckIn: true,
  proactiveSuggestions: true,
  contextPermission: false,
}


export type ReminderType =
  | 'daily-study'
  | 'vocabulary-review'
  | 'mistake-review'
  | 'writing-draft'
  | 'exam-countdown'
  | 'missed-task'
  | 'custom'

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  'daily-study': 'Daily Study',
  'vocabulary-review': 'Vocabulary Review',
  'mistake-review': 'Mistake Review',
  'writing-draft': 'Writing Draft',
  'exam-countdown': 'Exam Countdown',
  'missed-task': 'Missed Task',
  'custom': 'Custom',
}

export interface Reminder {
  id: string
  type: ReminderType
  title: string
  message: string
  scheduledTime?: string
  scheduledDate?: ISOString
  repeatDays: number[]
  isEnabled: boolean
  isTriggered: boolean
  lastTriggeredAt?: ISOString
  createdAt: ISOString
  updatedAt: ISOString
}


export type SuggestionType =
  | 'weakness-practice'
  | 'vocabulary-review'
  | 'exam-prep'
  | 'mistake-review'
  | 'article-practice'
  | 'custom'

export interface ProactiveSuggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  action?: QuickActionType
  actionLabel?: string
  skill?: string
  isAccepted: boolean
  isDismissed: boolean
  createdAt: ISOString
}


export type SavedNoteType = 'note' | 'vocabulary' | 'grammar' | 'exercise' | 'mistake'

export interface SavedAiNote {
  id: string
  sessionId: string
  messageId: string
  type: SavedNoteType
  title: string
  content: string
  sourceText: string
  tags: string[]
  createdAt: ISOString
}


export interface WritingFeedbackRecord {
  id: string
  sessionId: string
  draftText: string
  feedback: string
  estimatedBand: number
  improvedVersion: string
  grammarIssues: string[]
  vocabularyIssues: string[]
  structureNotes: string
  createdAt: ISOString
}


export type ExerciseType = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking'

export interface ExerciseQuestion {
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

export interface ExerciseResult {
  id: string
  sessionId: string
  type: ExerciseType
  topic: string
  questions: ExerciseQuestion[]
  score: number
  total: number
  createdAt: ISOString
}


export interface TutorContext {
  mode: AssistantMode
  currentTopic?: string
  recentMessages?: ChatMessage[]
  userMemory?: TutorMemory
  targetBand?: number
  examDate?: ISOString
  weakSkills?: string[]
  savedVocabularyCount?: number
  recentMistakesCount?: number
  todayStudyPlan?: string
  currentDraft?: string
  currentPassage?: string
  currentTranscript?: string
  selectedText?: string
  pageUrl?: string
}


export interface TutorExportData {
  version: number
  exportedAt: ISOString
  chatSessions: ChatSession[]
  chatMessages: ChatMessage[]
  tutorMemory: TutorMemory | null
  userPreferences: UserTutorPreferences
  reminders: Reminder[]
  proactiveSuggestions: ProactiveSuggestion[]
  savedAiNotes: SavedAiNote[]
  exerciseResults: ExerciseResult[]
  writingFeedbacks: WritingFeedbackRecord[]
}

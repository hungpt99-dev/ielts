import type { TutorMode, TutorContextScope, TutorInteractionSource } from './learner-context'

export type MessageRole = 'user' | 'assistant' | 'system'

export type TutorTeachingStrategy =
  | 'explain'
  | 'ask-guiding-questions'
  | 'give-example'
  | 'provide-exercise'
  | 'review-answer'
  | 'compare-progress'
  | 'recommend-task'
  | 'encourage-reflection'
  | 'correct-misconception'
  | 'simplify'
  | 'challenge'
  | 'suggest-rest'

export interface TutorChatRequest {
  sessionId?: string
  message: string
  mode: TutorMode
  contextScope: TutorContextScope
  source: TutorInteractionSource
  sourceEntityIds?: string[]
  pageContext?: TutorPageContext
}

export interface TutorPageContext {
  url?: string
  title?: string
  selectedText?: string
  articleContent?: string
  youtubeVideoId?: string
  transcript?: string
}

export interface TutorChatMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  mode: TutorMode
  teachingStrategy?: TutorTeachingStrategy
  contextUsed?: TutorContextReference[]
  recommendations?: TutorRecommendation[]
  suggestedActions?: TutorAction[]
  createdAt: string
}

export interface TutorContextReference {
  source: string
  label: string
}

export interface TutorRecommendation {
  type: string
  title: string
  description: string
  reason: string
  action?: TutorAction
}

export interface TutorAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

export interface TutorChatSession {
  id: string
  mode: TutorMode
  title: string
  topic?: string
  messageCount: number
  lastMessageAt: string
  createdAt: string
  updatedAt: string
}

export interface TutorChatResult {
  sessionId: string
  messages: TutorChatMessage[]
  suggestedActions: TutorAction[]
  memoryCandidates?: TutorMemoryCandidate[]
}

export interface TutorMemoryCandidate {
  type: 'weak-point' | 'mistake-pattern' | 'preference' | 'goal' | 'strategy'
  content: string
  skill?: string
  confidence: number
}

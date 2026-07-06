import type { ReactNode } from 'react'

export type ProactiveMessageTriggerType =
  | 'due_review'
  | 'missed_task'
  | 'weak_skill_warning'
  | 'exam_countdown'
  | 'new_content_saved'
  | 'study_streak'
  | 'low_activity'
  | 'daily_plan_ready'
  | 'mistake_pattern_detected'
  | 'topic_practice_suggestion'

export type ProactiveMessageCategory =
  | 'vocabulary-review'
  | 'mistake-review'
  | 'study-plan'
  | 'speaking-practice'
  | 'writing-practice'
  | 'exam-countdown'
  | 'motivation'
  | 'saved-content'

export interface ProactiveMessageAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

export interface ProactiveMessage {
  id: string
  triggerType: ProactiveMessageTriggerType
  category: ProactiveMessageCategory
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  action?: ProactiveMessageAction
  isRead: boolean
  isDismissed: boolean
  isSnoozed: boolean
  snoozedUntil?: string
  createdAt: string
}

export interface ProactiveMessageSettings {
  enabled: boolean
  browserNotifications: boolean
  aiEnhanced: boolean
  quietHoursStart: string
  quietHoursEnd: string
  reminderTime: string
  maxMessagesPerDay: number
  categories: Record<ProactiveMessageCategory, boolean>
}

export type ChatMessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  createdAt: string
}

export interface ChatSessionMeta {
  currentLearningTopic?: string
  lastInteractionTime?: string
  lastOpenedAt?: string
  totalInteractions: number
  acceptedRecommendations: string[]
  dismissedRecommendationIds: string[]
  snoozedRecommendations: Array<{ id: string; until: string }>
}

export interface ChatSnapshot {
  version: number
  messages: ChatMessage[]
  meta: ChatSessionMeta
  createdAt: string
  updatedAt: string
}

export type QuickActionType =
  | 'teach-me'
  | 'quiz-me'
  | 'correct-english'
  | 'explain-simply'
  | 'give-examples'
  | 'make-exercise'
  | 'remind-later'
  | 'practice-with-me'

export interface QuickAction {
  type: QuickActionType
  label: string
  icon: string
}

export interface ContextSuggestion {
  title: string
  message: string
  action?: QuickActionType
  actionLabel: string
}

export interface ContextAwareQuickAction extends QuickAction {
  relevance: number
}

export interface ChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  hasAiKey?: boolean
  onOpenSettings?: () => void
  children?: ReactNode
  className?: string
  contextSuggestions?: ContextSuggestion[]
  onSendMessage?: (text: string) => Promise<string>
  onQuickAction?: (action: string) => void
  onClearChat?: () => void
  title?: string
  subtitle?: string
  placeholder?: string
  voiceButton?: ReactNode
  voiceInput?: string
}

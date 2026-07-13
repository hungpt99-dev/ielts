import type { ReactNode } from 'react'

import type {
  ProactiveTriggerType as DomainTriggerType,
  ProactiveMessage as DomainProactiveMessage,
  ProactiveMessageAction as DomainProactiveMessageAction,
  ProactiveMessageSettings as DomainProactiveMessageSettings,
} from '../domain/entities/proactive-message'
import type { ProactiveCategory as DomainProactiveCategory } from '../domain/entities/learner-context'

export type ProactiveMessageTriggerType = DomainTriggerType | 'progress_reminder' | 'streak'

export type ProactiveMessageCategory = DomainProactiveCategory | 'suggestion'

export interface ProactiveMessageAction extends DomainProactiveMessageAction {}

export interface ProactiveMessage extends Omit<DomainProactiveMessage, 'priority' | 'category' | 'triggerType'> {
  triggerType: ProactiveMessageTriggerType
  category: ProactiveMessageCategory
  priority: 'high' | 'medium' | 'low'
  isRead: boolean
  isDismissed: boolean
  isSnoozed: boolean
  snoozedUntil?: string
  action?: ProactiveMessageAction
}

export interface ProactiveMessageSettings extends DomainProactiveMessageSettings {
  reminderTime: string
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

import type { ProactiveMessage } from '../entities/proactive-message'

export type TutorEventType =
  | 'proactive_message_generated'
  | 'proactive_message_shown'
  | 'proactive_message_dismissed'
  | 'proactive_message_clicked'
  | 'proactive_message_expired'
  | 'proactive_intervention'
  | 'tutor_chat_started'
  | 'tutor_chat_message_sent'
  | 'tutor_memory_updated'
  | 'tutor_recommendation_made'
  | 'tutor_settings_changed'
  | 'next_best_action_selected'

export interface TutorEventBase {
  id: string
  type: TutorEventType
  occurredAt: string
  correlationId?: string
}

export interface ProactiveMessageGeneratedEvent extends TutorEventBase {
  type: 'proactive_message_generated'
  message: ProactiveMessage
}

export interface ProactiveMessageShownEvent extends TutorEventBase {
  type: 'proactive_message_shown'
  messageId: string
}

export interface ProactiveMessageDismissedEvent extends TutorEventBase {
  type: 'proactive_message_dismissed'
  messageId: string
}

export interface ProactiveMessageClickedEvent extends TutorEventBase {
  type: 'proactive_message_clicked'
  messageId: string
  actionType?: string
}

export interface TutorChatStartedEvent extends TutorEventBase {
  type: 'tutor_chat_started'
  sessionId: string
  mode: string
  source: string
}

export interface TutorMemoryUpdatedEvent extends TutorEventBase {
  type: 'tutor_memory_updated'
  updatedFields: string[]
}

export interface ProactiveInterventionEvent extends TutorEventBase {
  type: 'proactive_intervention'
  interventions: Array<{ title: string; message: string; priority: string }>
}

export interface NextBestActionSelectedEvent extends TutorEventBase {
  type: 'next_best_action_selected'
  actionType: string
  skill?: string
  reason: string
}

export type TutorEvent =
  | ProactiveMessageGeneratedEvent
  | ProactiveMessageShownEvent
  | ProactiveMessageDismissedEvent
  | ProactiveMessageClickedEvent
  | ProactiveMessageExpiredEvent
  | ProactiveInterventionEvent
  | TutorChatStartedEvent
  | TutorChatMessageSentEvent
  | TutorMemoryUpdatedEvent
  | TutorRecommendationMadeEvent
  | TutorSettingsChangedEvent
  | NextBestActionSelectedEvent

export interface ProactiveMessageExpiredEvent extends TutorEventBase {
  type: 'proactive_message_expired'
  messageId: string
}

export interface TutorChatMessageSentEvent extends TutorEventBase {
  type: 'tutor_chat_message_sent'
  sessionId: string
  messageId: string
}

export interface TutorRecommendationMadeEvent extends TutorEventBase {
  type: 'tutor_recommendation_made'
  recommendationType: string
  title: string
}

export interface TutorSettingsChangedEvent extends TutorEventBase {
  type: 'tutor_settings_changed'
  changedFields: string[]
}

import type { ProactiveCategory } from './learner-context'

export type ProactiveTriggerType =
  | 'daily_plan_ready'
  | 'roadmap_task_available'
  | 'no_task_available_time'
  | 'plan_changed'
  | 'availability_changed'
  | 'task_rescheduled'
  | 'roadmap_high_risk'
  | 'exam_approaching'
  | 'progress_milestone'
  | 'skill_improvement'
  | 'skill_decline'
  | 'weekly_goal_completed'
  | 'weekly_goal_at_risk'
  | 'study_streak_achieved'
  | 'streak_at_risk'
  | 'consistency_improvement'
  | 'progress_plateau'
  | 'missed_scheduled_task'
  | 'multiple_missed_tasks'
  | 'long_inactivity'
  | 'unfinished_exercise'
  | 'abandoned_tutor_session'
  | 'due_review_not_completed'
  | 'recurring_mistake_pattern'
  | 'same_mistake_repeated'
  | 'weak_skill_needs_attention'
  | 'writing_issue_detected'
  | 'speaking_issue_detected'
  | 'reading_issue_detected'
  | 'listening_issue_detected'
  | 'vocabulary_review_due'
  | 'saved_content_unused'
  | 'relevant_vocabulary_available'
  | 'new_article_can_become_exercise'
  | 'transcript_can_support_listening'
  | 'exam_countdown_milestone'
  | 'time_for_timed_practice'
  | 'time_for_mock_tests'
  | 'final_week_mode'
  | 'final_day_preparation'
  | 'exam_logistics_reminder'
  | 'difficult_task_completed'
  | 'user_returned_after_inactivity'
  | 'weak_skill_improved'
  | 'user_overloaded'
  | 'lighter_task_recommended'
  | 'all_tasks_completed'

export interface ProactiveMessage {
  id: string
  triggerType: ProactiveTriggerType
  category: ProactiveCategory
  title: string
  message: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  suggestedAction?: ProactiveMessageAction
  deduplicationKey: string
  expiresAt?: string
  score: number
  createdAt: string
}

export interface ProactiveMessageAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

export interface ProactiveMessageSettings {
  enabled: boolean
  browserNotifications: boolean
  extensionNotifications: boolean
  aiEnhanced: boolean
  quietHoursStart: string
  quietHoursEnd: string
  maxMessagesPerDay: number
  minIntervalMinutes: number
  categories: Record<ProactiveCategory, boolean>
  examReminders: boolean
  inactivityReminders: boolean
  vocabularyReminders: boolean
  roadmapReminders: boolean
  motivationMessages: boolean
  preferredTone: 'friendly' | 'professional' | 'simple' | 'encouraging'
  preferredMessageLength: 'short' | 'medium' | 'detailed'
}

export interface ProactiveInterventionCandidate {
  triggerType: ProactiveTriggerType
  category: ProactiveCategory
  title: string
  message: string
  reason: string
  suggestedAction?: ProactiveMessageAction
  urgency: number
  learningValue: number
  relevance: number
  expiresAt?: string
  deduplicationKey: string
}

export interface ProactiveEvaluationRequest {
  triggerEvent?: string
  learnerState: import('./learner-context').LearnerStateSnapshot
  recentMessages: ProactiveMessage[]
}

export interface ProactiveEvaluationResult {
  candidates: ProactiveInterventionCandidate[]
  selected: ProactiveMessage[]
  throttled: number
  reason?: string
  nextAllowedTime?: string
}

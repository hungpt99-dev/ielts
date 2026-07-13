import type {
  ProactiveMessage as PersistedProactiveMessage,
  ProactiveMessageAction,
  ProactiveMessageCategory,
  ProactiveMessageSettings,
} from '../types/proactiveMessage'
import { generateProactiveMessages as orchestratorGenerateMessages } from '../application/proactive/generate-proactive-messages'
import type { ProactiveEvaluationRequest } from '../domain/entities/proactive-message'
import type { LearnerStateSnapshot } from '../domain/entities/learner-context'
import type { CooldownEntry } from '../domain/policies/cooldown-policy'

// ─── Action presets ──────────────────────────────────────────────────────────

const CATEGORY_ACTIONS: Record<string, { label: string; type: string; action: string }> = {
  'vocabulary-review': { label: 'Review vocabulary', type: 'action', action: 'quiz-me' },
  'mistake-review': { label: 'Review mistakes', type: 'action', action: 'correct-english' },
  'study-plan': { label: 'View plan', type: 'action', action: 'practice-with-me' },
  'speaking-practice': { label: 'Practice speaking', type: 'action', action: 'practice-with-me' },
  'writing-practice': { label: 'Practice writing', type: 'action', action: 'make-exercise' },
  'reading-practice': { label: 'Practice reading', type: 'action', action: 'make-exercise' },
  'listening-practice': { label: 'Practice listening', type: 'action', action: 'make-exercise' },
  'exam-countdown': { label: 'View countdown', type: 'action', action: 'teach-me' },
  'motivation': { label: 'Keep going', type: 'action', action: 'teach-me' },
  'saved-content': { label: 'View content', type: 'action', action: 'teach-me' },
  'daily-tip': { label: 'Show tip', type: 'action', action: 'teach-me' },
  'progress-report': { label: 'View progress', type: 'action', action: 'teach-me' },
  'suggestion': { label: 'Try it', type: 'action', action: 'practice-with-me' },
}

function makeAction(category: ProactiveMessageCategory): ProactiveMessageAction | undefined {
  const preset = CATEGORY_ACTIONS[category]
  if (!preset) return undefined
  return {
    type: preset.type,
    label: preset.label,
    payload: { action: preset.action },
  }
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface LearnerProfile {
  targetBand?: number
  currentBand?: number
  examDate?: string
  studyStreak?: number
  weakSkills?: string[]
  consecutiveDays?: number
  totalExercisesAttempted?: number
  averageAccuracy?: number
  strongestSkill?: string
  weakestSkill?: string
}

export interface ProactiveEngineInput {
  dueVocabularyCount?: number
  dueMistakeCount?: number
  dailyPlanReady?: boolean
  newContentCount?: number
  recentMistakeCount?: number
  lowActivityDays?: number
  lastVisitDate?: string
  learnerProfile?: LearnerProfile
  lessonCompleted?: string
  unfinishedLessonTitle?: string
  savedWordCount?: number
  missedStudyDays?: number
  daysUntilExam?: number
  isWeeklyReviewReady?: boolean
  isMonthlyReviewReady?: boolean
  isMockTestReady?: boolean
  savedArticleCount?: number
  habitScore?: number
  recentAccuracyTrend?: 'improving' | 'declining' | 'stable'
}

// ─── Frequency and quiet hours enforcement types ─────────────────────────────

export interface QuietHoursDelayResult {
  isInQuietHours: boolean
  remainingMs: number
  endsAt: string
}

export interface CanSendResult {
  canSend: boolean
  reason?: string
  delayUntil?: string
  messagesToday: number
  maxPerDay: number
}

// ─── Delegated generation ────────────────────────────────────────────────────

/**
 * Generate proactive messages using the shared orchestrator.
 * Delegates to the AITutorEngine's application-layer orchestrator.
 */
export async function generateProactiveMessages(
  _input: ProactiveEngineInput,
  learnerState?: LearnerStateSnapshot,
): Promise<PersistedProactiveMessage[]> {
  if (!learnerState) return []

  const request: ProactiveEvaluationRequest = {
    triggerEvent: 'daily_evaluation',
    learnerState,
    recentMessages: [],
  }

  const defaultSettings = {
    enabled: true,
    browserNotifications: false,
    extensionNotifications: false,
    aiEnhanced: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    maxMessagesPerDay: 5,
    minIntervalMinutes: 60,
    categories: {} as Record<string, boolean>,
    examReminders: true,
    inactivityReminders: true,
    vocabularyReminders: true,
    roadmapReminders: true,
    motivationMessages: true,
    preferredTone: 'friendly' as const,
    preferredMessageLength: 'medium' as const,
  }

  const result = await orchestratorGenerateMessages(request, defaultSettings, [])
  return result.selected.map(m => ({
    id: m.id,
    triggerType: m.triggerType as any,
    category: m.category as any,
    title: m.title,
    message: m.message,
    priority: (m.priority === 'critical' ? 'high' : m.priority) as any,
    action: m.suggestedAction ? { type: 'action', label: m.suggestedAction.label, payload: m.suggestedAction.payload } : makeAction(m.category as any),
    reason: undefined,
    skill: undefined,
    sourceData: undefined,
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    autoGenerated: true,
    createdAt: m.createdAt,
    expiresAt: m.expiresAt,
  }))
}

/**
 * Generate proactive messages with settings-aware filtering.
 * Delegates to the shared orchestrator for deterministic generation.
 */
export async function generateProactiveMessagesWithSettings(
  _input: ProactiveEngineInput,
  settings: ProactiveMessageSettings,
  existingMessages: PersistedProactiveMessage[] = [],
  learnerState?: LearnerStateSnapshot,
): Promise<{ messages: PersistedProactiveMessage[]; throttled: number; reason?: string; delayUntil?: string; nextAllowedTime?: string }> {
  if (!learnerState) {
    return { messages: [], throttled: 0, reason: 'No learner state available' }
  }

  const cooldownState: CooldownEntry[] = existingMessages
    .filter(m => m.createdAt)
    .map(m => ({ triggerType: m.triggerType, lastFiredAt: m.createdAt }))

  const request: ProactiveEvaluationRequest = {
    triggerEvent: 'daily_evaluation',
    learnerState,
    recentMessages: existingMessages.map(m => ({
      id: m.id,
      triggerType: m.triggerType as any,
      category: m.category as any,
      title: m.title,
      message: m.message,
      reason: '',
      priority: m.priority as any,
      score: 0,
      deduplicationKey: `${m.triggerType}-${m.category}`,
      createdAt: m.createdAt,
    })),
  }

  const tutorSettings = {
    enabled: settings.enabled,
    browserNotifications: settings.enabled,
    extensionNotifications: false,
    aiEnhanced: false,
    quietHoursStart: settings.quietHoursStart ?? '22:00',
    quietHoursEnd: settings.quietHoursEnd ?? '08:00',
    maxMessagesPerDay: settings.maxMessagesPerDay ?? 5,
    minIntervalMinutes: 60,
    categories: settings.categories ?? {},
    examReminders: true,
    inactivityReminders: true,
    vocabularyReminders: true,
    roadmapReminders: true,
    motivationMessages: true,
    preferredTone: 'friendly' as const,
    preferredMessageLength: 'medium' as const,
  }

  const result = await orchestratorGenerateMessages(request, tutorSettings, cooldownState)
  const messages = result.selected.map(m => ({
    id: m.id,
    triggerType: m.triggerType as any,
    category: m.category as any,
    title: m.title,
    message: m.message,
    priority: (m.priority === 'critical' ? 'high' : m.priority) as any,
    action: m.suggestedAction ? { type: 'action', label: m.suggestedAction.label, payload: m.suggestedAction.payload } : makeAction(m.category as any),
    reason: undefined,
    skill: undefined,
    sourceData: undefined,
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    autoGenerated: true,
    createdAt: m.createdAt,
    expiresAt: m.expiresAt,
  }))

  return { messages, throttled: result.throttled }
}

// ─── Context suggestions ─────────────────────────────────────────────────────

export function generateContextSuggestions(
  input: ProactiveEngineInput,
  recentMessages: import('../types').ChatMessage[],
): import('../types').ContextSuggestion[] {
  const suggestions: import('../types').ContextSuggestion[] = []

  if (input.dueVocabularyCount && input.dueVocabularyCount > 0) {
    suggestions.push({
      title: 'Words waiting for review',
      message: `You have ${input.dueVocabularyCount} vocabulary words due for review. Would you like to practice them now?`,
      action: 'quiz-me',
      actionLabel: 'Review vocabulary',
    })
  }

  if (input.dueMistakeCount && input.dueMistakeCount > 0) {
    suggestions.push({
      title: 'Mistakes to revisit',
      message: `Review your ${input.dueMistakeCount} pending mistake${input.dueMistakeCount === 1 ? '' : 's'} to avoid repeating them.`,
      action: 'correct-english',
      actionLabel: 'Review mistakes',
    })
  }

  const weakSkills = input.learnerProfile?.weakSkills
  if (weakSkills && weakSkills.length > 0) {
    suggestions.push({
      title: 'Focus on weak skills',
      message: `Spend some time improving your ${weakSkills.slice(0, 2).join(' and ')} skills today.`,
      action: 'practice-with-me',
      actionLabel: 'Practice now',
    })
  }

  if (!input.learnerProfile?.examDate && suggestions.length < 2) {
    suggestions.push({
      title: 'Set your exam date',
      message: 'Setting your IELTS exam date helps me create a more targeted study plan for you.',
      actionLabel: 'Set date',
    })
  }

  if (recentMessages.length === 0 && suggestions.length < 2) {
    suggestions.push({
      title: 'Start your IELTS journey',
      message: 'Try teaching me about a topic, generating exercises, or practicing your English skills.',
      action: 'teach-me',
      actionLabel: 'Teach me something',
    })
  }

  return suggestions.slice(0, 3)
}

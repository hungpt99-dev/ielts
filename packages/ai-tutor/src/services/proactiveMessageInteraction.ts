import type {
  ProactiveMessage,
  ProactiveMessageUpdate,
  ProactiveMessageInteractionResult,
  ProactiveMessageSettings,
  InteractionRecord,
  InteractionType,
  FeedbackRating,
  InteractionStats,
} from '../types/proactiveMessage'
import { ProactiveMessageStorage } from './proactiveMessageStorage'
import { ProactiveEventBus } from './proactiveEventBus'

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_SNOOZE_DURATION_MS = 60 * 60 * 1000
export const SNOOZE_PRESETS: { label: string; valueMs: number }[] = [
  { label: '15 minutes', valueMs: 15 * 60 * 1000 },
  { label: '1 hour', valueMs: 60 * 60 * 1000 },
  { label: '3 hours', valueMs: 3 * 60 * 60 * 1000 },
  { label: 'Tomorrow', valueMs: 24 * 60 * 60 * 1000 },
  { label: 'Next week', valueMs: 7 * 24 * 60 * 60 * 1000 },
]

export const FEEDBACK_DISMISS_REASONS = [
  'not-relevant',
  'not-now',
  'too-frequent',
  'already-know',
  'not-helpful',
  'other',
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createInteractionRecord(
  type: InteractionType,
  detail?: string,
  metadata?: Record<string, unknown>,
): InteractionRecord {
  return {
    type,
    timestamp: new Date().toISOString(),
    detail,
    metadata,
  }
}

function appendInteraction(
  message: ProactiveMessage,
  interaction: InteractionRecord,
): ProactiveMessageUpdate {
  const history = message.interactionHistory ?? []
  return {
    interactionHistory: [...history, interaction],
    lastInteractedAt: interaction.timestamp,
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const ProactiveMessageInteraction = {
  // ─── Dismiss ────────────────────────────────────────────────────────────

  dismissMessage(
    id: string,
    reason?: string,
    metadata?: Record<string, unknown>,
  ): ProactiveMessageInteractionResult {
    const message = ProactiveMessageStorage.getMessage(id)
    if (!message) {
      return {
        message: undefined,
        success: false,
        interaction: createInteractionRecord('dismiss', reason, { error: 'message_not_found' }),
      }
    }

    const interaction = createInteractionRecord('dismiss', reason, metadata)
    const historyUpdate = appendInteraction(message, interaction)
    const update: ProactiveMessageUpdate = {
      ...historyUpdate,
      isDismissed: true,
      dismissedAt: interaction.timestamp,
      dismissReason: reason,
    }

    const updated = ProactiveMessageStorage.updateMessage(id, update)
    if (updated) {
      ProactiveEventBus.emitMessageDismissed(id)
    }

    return {
      message: updated,
      success: !!updated,
      interaction,
    }
  },

  // ─── Snooze ─────────────────────────────────────────────────────────────

  snoozeMessage(
    id: string,
    durationMs: number = DEFAULT_SNOOZE_DURATION_MS,
    metadata?: Record<string, unknown>,
  ): ProactiveMessageInteractionResult {
    const message = ProactiveMessageStorage.getMessage(id)
    if (!message) {
      return {
        message: undefined,
        success: false,
        interaction: createInteractionRecord('snooze', `duration:${durationMs}`, { error: 'message_not_found' }),
      }
    }

    const snoozedUntil = new Date(Date.now() + durationMs).toISOString()
    const interaction = createInteractionRecord('snooze', `duration:${durationMs}`, {
      ...metadata,
      snoozedUntil,
    })
    const historyUpdate = appendInteraction(message, interaction)
    const update: ProactiveMessageUpdate = {
      ...historyUpdate,
      isSnoozed: true,
      snoozedUntil,
    }

    const updated = ProactiveMessageStorage.updateMessage(id, update)
    if (updated) {
      ProactiveEventBus.emitMessageSnoozed(id, snoozedUntil)
    }

    return {
      message: updated,
      success: !!updated,
      interaction,
    }
  },

  // ─── Action click ───────────────────────────────────────────────────────

  handleActionClick(
    id: string,
    actionType: string,
    metadata?: Record<string, unknown>,
  ): ProactiveMessageInteractionResult {
    const message = ProactiveMessageStorage.getMessage(id)
    if (!message) {
      return {
        message: undefined,
        success: false,
        interaction: createInteractionRecord('action_click', actionType, { error: 'message_not_found' }),
      }
    }

    const interaction = createInteractionRecord('action_click', actionType, metadata)
    const historyUpdate = appendInteraction(message, interaction)
    const update: ProactiveMessageUpdate = {
      ...historyUpdate,
      isRead: true,
      readAt: interaction.timestamp,
      actionClicked: actionType,
    }

    const updated = ProactiveMessageStorage.updateMessage(id, update)
    if (updated) {
      ProactiveEventBus.emitMessageRead(id)
    }

    return {
      message: updated,
      success: !!updated,
      interaction,
    }
  },

  // ─── Feedback ───────────────────────────────────────────────────────────

  provideFeedback(
    id: string,
    rating: FeedbackRating,
    comment?: string,
    metadata?: Record<string, unknown>,
  ): ProactiveMessageInteractionResult {
    const message = ProactiveMessageStorage.getMessage(id)
    if (!message) {
      return {
        message: undefined,
        success: false,
        interaction: createInteractionRecord('feedback', rating, { error: 'message_not_found' }),
      }
    }

    const interaction = createInteractionRecord('feedback', rating, {
      ...metadata,
      comment,
    })
    const historyUpdate = appendInteraction(message, interaction)
    const update: ProactiveMessageUpdate = {
      ...historyUpdate,
      feedback: rating,
    }

    const updated = ProactiveMessageStorage.updateMessage(id, update)
    if (updated) {
      ProactiveEventBus.emitMessageRead(id)
    }

    return {
      message: updated,
      success: !!updated,
      interaction,
    }
  },

  // ─── Multi-action: mark as read + feedback ──────────────────────────────

  readAndFeedback(
    id: string,
    rating: FeedbackRating,
    comment?: string,
  ): ProactiveMessageInteractionResult {
    const message = ProactiveMessageStorage.getMessage(id)
    if (!message) {
      return {
        message: undefined,
        success: false,
        interaction: createInteractionRecord('feedback', rating, { error: 'message_not_found' }),
      }
    }

    const now = new Date().toISOString()
    const feedbackInteraction = createInteractionRecord('feedback', rating, { comment })
    const readInteraction = createInteractionRecord('dismiss', 'auto-read', { reason: 'read_and_feedback' })
    const history = [
      ...(message.interactionHistory ?? []),
      readInteraction,
      feedbackInteraction,
    ]

    const update: ProactiveMessageUpdate = {
      isRead: true,
      readAt: now,
      interactionHistory: history,
      lastInteractedAt: now,
      feedback: rating,
    }

    const updated = ProactiveMessageStorage.updateMessage(id, update)
    if (updated) {
      ProactiveEventBus.emitMessageRead(id)
    }

    return {
      message: updated,
      success: !!updated,
      interaction: feedbackInteraction,
    }
  },

  // ─── Aggregated stats for adjusting future generation ───────────────────

  getInteractionStats(messages: ProactiveMessage[]): InteractionStats {
    const dismissed = messages.filter(m => m.isDismissed)
    const snoozed = messages.filter(m => m.isSnoozed)
    const withFeedback = messages.filter(m => m.feedback && m.feedback !== 'none')
    const withActionClicks = messages.filter(m => m.actionClicked)

    const dismissReasonCounts: Record<string, number> = {}
    for (const m of dismissed) {
      const reason = m.dismissReason ?? 'no-reason'
      dismissReasonCounts[reason] = (dismissReasonCounts[reason] ?? 0) + 1
    }

    const actionClickCounts: Record<string, number> = {}
    for (const m of withActionClicks) {
      const action = m.actionClicked!
      actionClickCounts[action] = (actionClickCounts[action] ?? 0) + 1
    }

    const helpfulCount = withFeedback.filter(m => m.feedback === 'helpful').length
    const notHelpfulCount = withFeedback.filter(m => m.feedback === 'not-helpful').length
    const totalWithHistory = messages.filter(
      m => m.interactionHistory && m.interactionHistory.length > 0,
    ).length

    return {
      totalMessages: messages.length,
      totalDismissed: dismissed.length,
      totalSnoozed: snoozed.length,
      totalActionClicks: withActionClicks.length,
      totalFeedback: withFeedback.length,
      helpfulCount,
      notHelpfulCount,
      dismissReasonCounts,
      actionClickCounts,
      interactionRate: messages.length > 0 ? totalWithHistory / messages.length : 0,
    }
  },

  // ─── Generate adjustment signals from interaction data ──────────────────

  generateAdjustmentSignals(
    stats: InteractionStats,
    _settings: ProactiveMessageSettings,
  ): {
    shouldReduceFrequency: boolean
    shouldIncreaseFrequency: boolean
    blockedCategories: string[]
    preferredCategories: string[]
    feedbackRatio: number
  } {
    const totalFeedback = stats.helpfulCount + stats.notHelpfulCount
    const feedbackRatio = totalFeedback > 0
      ? stats.helpfulCount / totalFeedback
      : 0.5

    const shouldReduceFrequency =
      totalFeedback >= 3 &&
      feedbackRatio < 0.3 &&
      stats.dismissReasonCounts['too-frequent'] !== undefined &&
      stats.dismissReasonCounts['too-frequent'] >= 2

    const shouldIncreaseFrequency =
      totalFeedback >= 3 &&
      feedbackRatio > 0.8 &&
      stats.dismissReasonCounts['too-frequent'] === undefined

    const highDismissCategories = Object.entries(
      stats.dismissReasonCounts,
    )
      .filter(([_, count]) => count >= 2)
      .map(([reason]) => reason)

    return {
      shouldReduceFrequency,
      shouldIncreaseFrequency,
      blockedCategories: highDismissCategories.filter(c =>
        ['vocabulary-review', 'mistake-review', 'study-plan', 'speaking-practice',
         'writing-practice', 'reading-practice', 'listening-practice', 'exam-countdown',
         'motivation', 'saved-content', 'daily-tip', 'progress-report', 'suggestion',
        ].includes(c),
      ),
      preferredCategories: Object.entries(stats.actionClickCounts)
        .filter(([_, count]) => count >= 2)
        .map(([action]) => action),
      feedbackRatio,
    }
  },
}

export default ProactiveMessageInteraction

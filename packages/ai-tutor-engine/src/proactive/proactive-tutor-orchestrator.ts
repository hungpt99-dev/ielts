import type { ProactiveEvaluationRequest, ProactiveEvaluationResult, ProactiveInterventionCandidate, ProactiveMessage, ProactiveMessageSettings } from '../domain/entities/proactive-message'
import type { LearnerStateSnapshot } from '../domain/entities/learner-context'
import { TriggerRegistry } from './trigger-registry'
import { MessageGeneratorRegistry } from './message-generator-registry'
import { evaluateCooldown, type CooldownEntry } from '../domain/policies/cooldown-policy'
import { isInQuietHours } from '../domain/policies/quiet-hours-policy'
import { filterDuplicates } from '../domain/policies/duplicate-message-policy'
import { selectBestInterventions, calculateInterventionScore } from '../domain/policies/recommendation-priority-policy'
import type { CooldownPolicyConfig } from '../domain/policies/cooldown-policy'

export class ProactiveTutorOrchestrator {
  private triggerRegistry: TriggerRegistry
  private generatorRegistry: MessageGeneratorRegistry

  constructor(
    triggerRegistry: TriggerRegistry,
    generatorRegistry: MessageGeneratorRegistry,
  ) {
    this.triggerRegistry = triggerRegistry
    this.generatorRegistry = generatorRegistry
  }

  async evaluate(
    request: ProactiveEvaluationRequest,
    settings: ProactiveMessageSettings,
    cooldownState: CooldownEntry[],
    cooldownConfig?: CooldownPolicyConfig,
  ): Promise<ProactiveEvaluationResult> {
    if (!settings.enabled) {
      return { candidates: [], selected: [], throttled: 0, reason: 'Proactive tutor disabled' }
    }

    if (isInQuietHours({ start: settings.quietHoursStart, end: settings.quietHoursEnd })) {
      return { candidates: [], selected: [], throttled: 0, reason: 'Quiet hours' }
    }

    const messagesToday = this.countMessagesToday(request.recentMessages)
    if (messagesToday >= settings.maxMessagesPerDay) {
      return { candidates: [], selected: [], throttled: 0, reason: 'Daily limit reached' }
    }

    const triggeredTriggers = this.triggerRegistry.evaluateAll(this.buildEvalParams(request.learnerState))

    const candidates: ProactiveInterventionCandidate[] = []
    for (const { triggerType } of triggeredTriggers) {
      const cooldownCheck = evaluateCooldown(triggerType, cooldownState, cooldownConfig)
      if (cooldownCheck.isOnCooldown) continue

      const candidate = this.generatorRegistry.generateForTrigger(request.learnerState, triggerType)
      if (candidate) candidates.push(candidate)
    }

    const scored = selectBestInterventions(
      candidates,
      request.recentMessages,
      settings.maxMessagesPerDay - messagesToday,
    )

    const selected: ProactiveMessage[] = scored.map(c => ({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      triggerType: c.triggerType,
      category: c.category,
      title: c.title,
      message: c.message,
      reason: c.reason,
      priority: this.scoreToPriority(c.urgency),
      suggestedAction: c.suggestedAction,
      deduplicationKey: c.deduplicationKey,
      expiresAt: c.expiresAt,
      score: calculateInterventionScore(c, []),
      createdAt: new Date().toISOString(),
    }))

    const deduplicated = filterDuplicates(selected, request.recentMessages)

    const throttled = selected.length - deduplicated.length

    return {
      candidates,
      selected: deduplicated,
      throttled,
      nextAllowedTime: undefined,
    }
  }

  private buildEvalParams(state: LearnerStateSnapshot) {
    return {
      inactiveDays: state.progress.inactiveDays,
      missedTasks: state.activitySummary.tasksCompletedToday,
      streak: state.progress.studyStreak,
      examDaysRemaining: state.exam.daysUntilExam,
      dueVocabularyCount: state.vocabularySummary.dueForReview,
      unreviewedMistakes: state.mistakeSummary.unreviewed,
      weeklyTasksCompleted: state.activitySummary.tasksCompletedToday,
      weeklyTasksTotal: 7,
      skillDeclines: Object.entries(state.skillStates)
        .filter(([_, s]) => s.trend === 'declining')
        .map(([skill]) => skill),
      skillImprovements: Object.entries(state.skillStates)
        .filter(([_, s]) => s.trend === 'improving')
        .map(([skill]) => skill),
      recentAccuracy: state.progress.skillProgress.writing?.accuracy ?? null,
    }
  }

  private countMessagesToday(messages: ProactiveMessage[]): number {
    const today = new Date().toDateString()
    return messages.filter(m => new Date(m.createdAt).toDateString() === today).length
  }

  private scoreToPriority(score: number): ProactiveMessage['priority'] {
    if (score >= 0.7) return 'critical'
    if (score >= 0.5) return 'high'
    if (score >= 0.3) return 'medium'
    return 'low'
  }
}

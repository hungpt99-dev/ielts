import { ProactiveTutorOrchestrator } from '../../proactive/proactive-tutor-orchestrator'
import { TriggerRegistry } from '../../proactive/trigger-registry'
import { MessageGeneratorRegistry } from '../../proactive/message-generator-registry'
import { createDefaultGenerators } from '../../proactive/default-generators'
import { createDefaultTriggers } from '../../proactive/default-triggers'
import type { ProactiveEvaluationRequest, ProactiveEvaluationResult } from '../../domain/entities/proactive-message'
import type { LearnerContextBuilder } from '../../context/learner-context-builder'
import type { TutorSettingsRepository } from '../../ports/tutor-settings-repository'
import type { TutorEventPublisher } from '../../ports/tutor-event-publisher'
import type { CooldownEntry } from '../../domain/policies/cooldown-policy'

export interface EvaluateProactiveDependencies {
  contextBuilder: LearnerContextBuilder
  settingsRepository: TutorSettingsRepository
  eventPublisher: TutorEventPublisher
}

export async function evaluateProactiveOpportunity(
  deps: EvaluateProactiveDependencies,
  cooldownState: CooldownEntry[],
  recentMessages: import('../../domain/entities/proactive-message').ProactiveMessage[],
  triggerEvent?: string,
): Promise<ProactiveEvaluationResult> {
  const state = await deps.contextBuilder.build('proactive')
  const settings = await deps.settingsRepository.getProactiveSettings()

  const triggerRegistry = new TriggerRegistry()
  const generatorRegistry = new MessageGeneratorRegistry()

  for (const trigger of createDefaultTriggers()) {
    triggerRegistry.register(trigger)
  }

  for (const gen of createDefaultGenerators()) {
    generatorRegistry.register(gen)
  }

  const orchestrator = new ProactiveTutorOrchestrator(triggerRegistry, generatorRegistry)

  const request: ProactiveEvaluationRequest = {
    triggerEvent,
    learnerState: state,
    recentMessages,
  }

  const result = await orchestrator.evaluate(request, settings, cooldownState)

  return result
}

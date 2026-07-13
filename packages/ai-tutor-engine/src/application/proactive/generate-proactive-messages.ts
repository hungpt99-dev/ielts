import type { ProactiveEvaluationRequest, ProactiveEvaluationResult, ProactiveMessageSettings } from '../../domain/entities/proactive-message'
import { ProactiveTutorOrchestrator } from '../../proactive/proactive-tutor-orchestrator'
import { TriggerRegistry } from '../../proactive/trigger-registry'
import { MessageGeneratorRegistry } from '../../proactive/message-generator-registry'
import { createDefaultGenerators } from '../../proactive/default-generators'
import type { CooldownEntry } from '../../domain/policies/cooldown-policy'

export async function generateProactiveMessages(
  request: ProactiveEvaluationRequest,
  settings: ProactiveMessageSettings,
  cooldownState: CooldownEntry[],
): Promise<ProactiveEvaluationResult> {
  const triggerRegistry = new TriggerRegistry()
  const generatorRegistry = new MessageGeneratorRegistry()

  for (const gen of createDefaultGenerators()) {
    generatorRegistry.register(gen)
  }

  const orchestrator = new ProactiveTutorOrchestrator(triggerRegistry, generatorRegistry)

  return orchestrator.evaluate(request, settings, cooldownState)
}

import type { ProactiveInterventionCandidate, ProactiveTriggerType } from '../domain/entities/proactive-message'
import type { LearnerStateSnapshot, ProactiveCategory } from '../domain/entities/learner-context'

export interface MessageGenerator {
  triggerType: ProactiveTriggerType
  category: ProactiveCategory
  generate(state: LearnerStateSnapshot): ProactiveInterventionCandidate | null
}

export class MessageGeneratorRegistry {
  private generators: Map<ProactiveTriggerType, MessageGenerator> = new Map()

  register(generator: MessageGenerator): void {
    this.generators.set(generator.triggerType, generator)
  }

  get(triggerType: ProactiveTriggerType): MessageGenerator | undefined {
    return this.generators.get(triggerType)
  }

  getAll(): MessageGenerator[] {
    return Array.from(this.generators.values())
  }

  generateForTrigger(state: LearnerStateSnapshot, triggerType: ProactiveTriggerType): ProactiveInterventionCandidate | null {
    const generator = this.generators.get(triggerType)
    if (!generator) return null
    return generator.generate(state)
  }

  generateAll(state: LearnerStateSnapshot): ProactiveInterventionCandidate[] {
    return this.getAll()
      .map(g => g.generate(state))
      .filter((c): c is ProactiveInterventionCandidate => c !== null)
  }
}

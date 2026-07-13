import type { ProactiveTriggerType } from '../domain/entities/proactive-message'
import type { TriggerEvaluationParams, TriggerPolicyResult } from '../domain/policies/proactive-trigger-policy'

export interface TriggerHandler {
  triggerType: ProactiveTriggerType
  evaluate(params: TriggerEvaluationParams): TriggerPolicyResult
}

export class TriggerRegistry {
  private handlers: Map<ProactiveTriggerType, TriggerHandler> = new Map()

  register(handler: TriggerHandler): void {
    this.handlers.set(handler.triggerType, handler)
  }

  get(triggerType: ProactiveTriggerType): TriggerHandler | undefined {
    return this.handlers.get(triggerType)
  }

  getAll(): TriggerHandler[] {
    return Array.from(this.handlers.values())
  }

  evaluateAll(params: TriggerEvaluationParams): Array<{ triggerType: ProactiveTriggerType; result: TriggerPolicyResult }> {
    return this.getAll()
      .map(h => ({ triggerType: h.triggerType, result: h.evaluate(params) }))
      .filter(({ result }) => result.shouldTrigger)
      .sort((a, b) => b.result.score - a.result.score)
  }
}

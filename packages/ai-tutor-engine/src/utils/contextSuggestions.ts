import type { ContextSuggestion, ContextAwareQuickAction, QuickAction } from '../types'
import { generateContextSuggestions as engineGenerate } from '../services/proactiveMessageEngine'
import type { ProactiveEngineInput } from '../services/proactiveMessageEngine'
import type { ChatMessage } from '../types'

export function getContextSuggestions(
  input: ProactiveEngineInput,
  recentMessages: ChatMessage[],
): ContextSuggestion[] {
  return engineGenerate(input, recentMessages)
}

export function getContextAwareQuickActions(
  suggestions: ContextSuggestion[],
  baseActions: QuickAction[],
): ContextAwareQuickAction[] {
  const suggestedTypes = new Set(
    suggestions.filter(s => s.action).map(s => s.action),
  )

  return baseActions.map(action => ({
    ...action,
    relevance: suggestedTypes.has(action.type) ? 1 : 0.5,
  })).sort((a, b) => b.relevance - a.relevance)
}

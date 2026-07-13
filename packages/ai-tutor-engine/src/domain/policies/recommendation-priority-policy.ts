import type { ProactiveInterventionCandidate, ProactiveMessage } from '../entities/proactive-message'

export interface ScoringWeights {
  urgency: number
  learningValue: number
  relevance: number
  timing: number
  personalization: number
  repetitionPenalty: number
  interruptionPenalty: number
  recentMessagePenalty: number
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  urgency: 0.3,
  learningValue: 0.25,
  relevance: 0.2,
  timing: 0.1,
  personalization: 0.15,
  repetitionPenalty: 0.1,
  interruptionPenalty: 0.05,
  recentMessagePenalty: 0.05,
}

export function calculateInterventionScore(
  candidate: ProactiveInterventionCandidate,
  recentMessages: ProactiveMessage[],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): number {
  const baseScore =
    candidate.urgency * weights.urgency +
    candidate.learningValue * weights.learningValue +
    candidate.relevance * weights.relevance +
    randomTimingScore() * weights.timing +
    randomPersonalizationScore() * weights.personalization

  const repetitionPenalty = recentMessages.length * weights.repetitionPenalty
  const interruptionPenalty = baseScore > 0.5 ? 0 : weights.interruptionPenalty
  const lastMsg = recentMessages[recentMessages.length - 1]
  const recentMessagePenalty = lastMsg && lastMsg.triggerType === candidate.triggerType
    ? weights.recentMessagePenalty
    : 0

  return Math.max(0, baseScore - repetitionPenalty - interruptionPenalty - recentMessagePenalty)
}

function randomTimingScore(): number {
  const hour = new Date().getHours()
  if (hour >= 9 && hour <= 11) return 0.8
  if (hour >= 14 && hour <= 17) return 0.7
  if (hour >= 19 && hour <= 21) return 0.6
  return 0.3
}

function randomPersonalizationScore(): number {
  return 0.5
}

export function selectBestInterventions(
  candidates: ProactiveInterventionCandidate[],
  recentMessages: ProactiveMessage[],
  maxCount: number,
  threshold: number = 0.3,
  weights?: ScoringWeights,
): ProactiveInterventionCandidate[] {
  const scored = candidates
    .map(c => ({
      candidate: c,
      score: calculateInterventionScore(c, recentMessages, weights),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, maxCount).map(({ candidate }) => candidate)
}

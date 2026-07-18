import type { ProactiveInterventionCandidate, ProactiveMessage } from '../entities/proactive-message'

const INTERRUPTION_THRESHOLD = 0.5

const PEAK_HOUR_START = 9
const PEAK_HOUR_END = 11
const PEAK_HOUR_SCORE = 0.8
const MID_HOUR_START = 14
const MID_HOUR_END = 17
const MID_HOUR_SCORE = 0.7
const EVENING_HOUR_START = 19
const EVENING_HOUR_END = 21
const EVENING_HOUR_SCORE = 0.6
const OFF_HOUR_SCORE = 0.3
const DEFAULT_PERSONALIZATION_SCORE = 0.5

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
  const interruptionPenalty = baseScore > INTERRUPTION_THRESHOLD ? 0 : weights.interruptionPenalty
  const lastMsg = recentMessages[recentMessages.length - 1]
  const recentMessagePenalty = lastMsg && lastMsg.triggerType === candidate.triggerType
    ? weights.recentMessagePenalty
    : 0

  return Math.max(0, baseScore - repetitionPenalty - interruptionPenalty - recentMessagePenalty)
}

function randomTimingScore(): number {
  const hour = new Date().getHours()
  if (hour >= PEAK_HOUR_START && hour <= PEAK_HOUR_END) return PEAK_HOUR_SCORE
  if (hour >= MID_HOUR_START && hour <= MID_HOUR_END) return MID_HOUR_SCORE
  if (hour >= EVENING_HOUR_START && hour <= EVENING_HOUR_END) return EVENING_HOUR_SCORE
  return OFF_HOUR_SCORE
}

function randomPersonalizationScore(): number {
  return DEFAULT_PERSONALIZATION_SCORE
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

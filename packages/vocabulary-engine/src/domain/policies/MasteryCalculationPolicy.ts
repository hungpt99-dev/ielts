export const SKILL = {
  READING: 'READING',
  LISTENING: 'LISTENING',
  WRITING: 'WRITING',
  SPEAKING: 'SPEAKING',
} as const

export type SkillType = (typeof SKILL)[keyof typeof SKILL]

export const MASTERY_SKILLS: readonly SkillType[] = [
  SKILL.READING,
  SKILL.LISTENING,
  SKILL.WRITING,
  SKILL.SPEAKING,
]

export const INTERACTION_TYPE = {
  EXPOSURE: 'EXPOSURE',
  RECOGNITION: 'RECOGNITION',
  AUDIO_RECOGNITION: 'AUDIO_RECOGNITION',
  USAGE: 'USAGE',
} as const

export type InteractionType = (typeof INTERACTION_TYPE)[keyof typeof INTERACTION_TYPE]

export interface Interaction {
  skill: SkillType
  type: InteractionType
  date: Date
  correct: boolean
}

export interface ReviewRecord {
  skill: SkillType
  date: Date
  correct: boolean
}

export interface SkillMasteryState {
  score: number
  lastInteractionDate: Date | null
}

export interface MasteryProfile {
  wordId: string
  skills: Record<SkillType, SkillMasteryState>
  overallMastery: number
}

const RECOGNITION_EXPOSURE_TARGET = 20
const PRODUCTION_USAGE_TARGET = 15
const AUDIO_RECOGNITION_EXPOSURE_WEIGHT = 2
const MULTI_SKILL_BONUS_PER_SKILL = 5
const MULTI_SKILL_BONUS_CAP = 10
const DECAY_RATE_PER_30_DAYS = 0.95
const DECAY_PERIOD_DAYS = 30
const MS_PER_DAY = 86_400_000
const NEUTRAL_CONFIDENCE = 0.5
const CONFIDENCE_MODULATION = 0.1

const OVERALL_WEIGHTS: Record<SkillType, number> = {
  [SKILL.READING]: 0.2,
  [SKILL.LISTENING]: 0.2,
  [SKILL.WRITING]: 0.3,
  [SKILL.SPEAKING]: 0.3,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isProductionSkill(skill: SkillType): boolean {
  return skill === SKILL.WRITING || skill === SKILL.SPEAKING
}

function latestDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null
  return dates.reduce((max, date) => (date > max ? date : max))
}

function recognitionSkillScore(
  skill: SkillType,
  interactions: Interaction[],
  reviews: ReviewRecord[],
): number {
  let effectiveExposure = 0
  for (const interaction of interactions) {
    if (
      interaction.type === INTERACTION_TYPE.EXPOSURE ||
      interaction.type === INTERACTION_TYPE.RECOGNITION
    ) {
      effectiveExposure += 1
    }
    if (
      skill === SKILL.LISTENING &&
      interaction.type === INTERACTION_TYPE.AUDIO_RECOGNITION
    ) {
      effectiveExposure += AUDIO_RECOGNITION_EXPOSURE_WEIGHT
    }
  }

  const exposureFactor = clamp(effectiveExposure / RECOGNITION_EXPOSURE_TARGET, 0, 1)
  const correctCount = reviews.filter((review) => review.correct).length
  const accuracy = reviews.length > 0 ? correctCount / reviews.length : 0

  return (exposureFactor * 0.5 + accuracy * 0.5) * 100
}

function productionSkillScore(interactions: Interaction[]): number {
  const usages = interactions.filter((interaction) => interaction.type === INTERACTION_TYPE.USAGE)
  const usageCount = usages.length
  if (usageCount === 0) return 0

  const correctRatio = usages.filter((usage) => usage.correct).length / usageCount
  const usageFactor = clamp(usageCount / PRODUCTION_USAGE_TARGET, 0, 1)

  return (usageFactor * 0.4 + correctRatio * 0.6) * 100
}

function calculateSkillScore(
  skill: SkillType,
  interactions: Interaction[],
  reviews: ReviewRecord[],
): number {
  if (isProductionSkill(skill)) return productionSkillScore(interactions)
  return recognitionSkillScore(skill, interactions, reviews)
}

function multiSkillBonus(interactions: Interaction[]): number {
  const usedSkills = new Set(interactions.map((interaction) => interaction.skill))
  return clamp((usedSkills.size - 1) * MULTI_SKILL_BONUS_PER_SKILL, 0, MULTI_SKILL_BONUS_CAP)
}

function applyDecay(score: number, daysSinceLastInteraction: number): number {
  if (daysSinceLastInteraction <= 0) return score
  return score * Math.pow(DECAY_RATE_PER_30_DAYS, daysSinceLastInteraction / DECAY_PERIOD_DAYS)
}

export function calculateMastery(
  profile: MasteryProfile,
  interactions: Interaction[],
  reviewRecords: ReviewRecord[],
  now: Date = new Date(),
): MasteryProfile {
  const bonus = multiSkillBonus(interactions)
  const skills = {} as Record<SkillType, SkillMasteryState>

  for (const skill of MASTERY_SKILLS) {
    const skillInteractions = interactions.filter((interaction) => interaction.skill === skill)
    const skillReviews = reviewRecords.filter((review) => review.skill === skill)

    const latestInteractionDate = latestDate(skillInteractions.map((interaction) => interaction.date))
    const lastInteractionDate = latestInteractionDate ?? profile.skills[skill].lastInteractionDate

    let score = calculateSkillScore(skill, skillInteractions, skillReviews) + bonus
    if (lastInteractionDate !== null) {
      const daysSinceLastInteraction = (now.getTime() - lastInteractionDate.getTime()) / MS_PER_DAY
      score = applyDecay(score, daysSinceLastInteraction)
    }

    skills[skill] = {
      score: clamp(score, 0, 100),
      lastInteractionDate,
    }
  }

  const result: MasteryProfile = {
    wordId: profile.wordId,
    skills,
    overallMastery: 0,
  }

  result.overallMastery = calculateOverallMastery(result, NEUTRAL_CONFIDENCE)
  return result
}

export function calculateOverallMastery(
  profile: MasteryProfile,
  confidenceScore: number,
): number {
  const confidence = clamp(confidenceScore, 0, 1)

  let weighted = 0
  for (const skill of MASTERY_SKILLS) {
    weighted += profile.skills[skill].score * OVERALL_WEIGHTS[skill]
  }

  const confidenceFactor = 1 + CONFIDENCE_MODULATION * (confidence - 0.5)
  return clamp(weighted * confidenceFactor, 0, 100)
}

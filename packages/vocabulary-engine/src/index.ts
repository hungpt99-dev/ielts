// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — Vocabulary learning engine
//
// Public API is exported from here as the domain, application, ports,
// infrastructure and schemas layers are implemented.
// ═══════════════════════════════════════════════════════════════════════

export { determineNextLifecycle } from './domain/policies'
export type { LifecycleTrigger, TransitionContext, LifecycleTransitionResult } from './domain/policies'
export { LIFECYCLE_PHASE, type LifecyclePhase } from './domain/constants'
export { calculateNextReview, getDueReviewQueue, predictRecallProbability, REVIEW_RATING, REVIEW_CONTEXT } from './domain/policies'
export type { ReviewRating, ReviewContext, SpacedRepetitionInfo, ReviewHistoryEntry } from './domain/policies'
export { calculateMastery, calculateOverallMastery, SKILL, MASTERY_SKILLS, INTERACTION_TYPE } from './domain/policies'
export type { SkillType, InteractionType, MasteryProfile, SkillMasteryState, Interaction, ReviewRecord } from './domain/policies'

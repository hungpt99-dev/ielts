// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — Vocabulary learning engine
//
// Public API is exported from here as the domain, application, ports,
// infrastructure and schemas layers are implemented.
// ═══════════════════════════════════════════════════════════════════════

export { determineNextLifecycle } from './domain/policies'
export type { LifecycleTrigger, TransitionContext, LifecycleTransitionResult } from './domain/policies'
export { LIFECYCLE_PHASE, type LifecyclePhase } from './domain/constants'

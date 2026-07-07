# Plan: Plan frontend-only Proactive AI Tutor system for IELTS Journey

## Summary

Create a detailed task plan to implement the frontend-only event-driven Proactive AI Tutor system with local-first architecture and user settings

## Tasks

1. Audit existing AI Tutor, local storage, website and extension actions, and settings
2. Define typed frontend learning event model with discriminated unions (depends on: Audit existing AI Tutor, local storage, website and extension actions, and settings)
3. Implement local learning event repository using IndexedDB abstraction (depends on: Define typed frontend learning event model with discriminated unions)
4. Create central LearningEventBus with event validation, timestamping, session management, and local saving (depends on: Implement local learning event repository using IndexedDB abstraction)
5. Implement ProactiveTutorSettingsRepository with LocalStorage persistence and default values (depends on: Create central LearningEventBus with event validation, timestamping, session management, and local saving)
6. Add enable/disable toggle and related controls to Proactive AI Tutor Settings UI (depends on: Implement ProactiveTutorSettingsRepository with LocalStorage persistence and default values)
7. Add event emission to key website user actions using LearningEventBus (depends on: Create central LearningEventBus with event validation, timestamping, session management, and local saving, Add enable/disable toggle and related controls to Proactive AI Tutor Settings UI)
8. Add event emission to key extension actions if extension exists (depends on: Add event emission to key website user actions using LearningEventBus)
9. Implement ProactiveTutorRuleEngine to decide message display based on event and context (depends on: Add event emission to key extension actions if extension exists)
10. Implement cooldown and anti-spam logic for proactive tutor messages (depends on: Implement ProactiveTutorRuleEngine to decide message display based on event and context)
11. Implement ProactiveTutorContextBuilder to aggregate learning context for decision making (depends on: Implement cooldown and anti-spam logic for proactive tutor messages)
12. Create ProactiveTutorPromptBuilder for AI-generated message prompts with fallback (depends on: Implement ProactiveTutorContextBuilder to aggregate learning context for decision making)
13. Create ProactiveTutorMessageRepository to store and manage proactive messages locally (depends on: Create ProactiveTutorPromptBuilder for AI-generated message prompts with fallback)
14. Implement frontend-only time-based event scheduler and local checks (depends on: Create ProactiveTutorMessageRepository to store and manage proactive messages locally)
15. Develop Proactive AI Tutor message UI components and integrate with message repository (depends on: Implement frontend-only time-based event scheduler and local checks)
16. Add comprehensive tests for event creation, validation, repositories, rule engine, cooldown, scheduler, context builder, prompt builder, message repository, and UI (depends on: Develop Proactive AI Tutor message UI components and integrate with message repository)
17. Perform manual testing of proactive AI Tutor feature on website and extension (depends on: Add comprehensive tests for event creation, validation, repositories, rule engine, cooldown, scheduler, context builder, prompt builder, message repository, and UI)
18. Run full typecheck, lint, tests, and build to finalize proactive AI Tutor implementation (depends on: Perform manual testing of proactive AI Tutor feature on website and extension)
19. Prepare final implementation report for frontend-only Proactive AI Tutor system (depends on: Run full typecheck, lint, tests, and build to finalize proactive AI Tutor implementation)
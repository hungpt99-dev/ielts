# Study Plan Engine — Summary

## Primary Objective
Generate a complete, realistic, personalized, date-accurate IELTS study roadmap from the user's profile, current ability, target score, preferences, available time, progress, and exam date. The engine runs local-first (no backend required) and must produce a useful plan even without an AI API key.

## 12 Core Design Principles
1. Deterministic calculations must not depend on AI.
2. AI must not control dates, capacity, task placement, or progress.
3. Never schedule more study time than the user has available.
4. Never schedule normal study tasks after the exam date.
5. Completed learning history must be preserved during regeneration.
6. The plan must remain useful when AI is unavailable.
7. All AI output must use strict structured schemas (Zod).
8. Validate and repair plans before persistence.
9. Plan generation must be explainable to the user.
10. A failed AI request must not cause the entire plan to fail.
11. Long plans use controlled batched AI calls — not one giant request.
12. The engine must not call AI once per task.

## Required User Profile Data
- Current IELTS overall band, target overall band
- Current Listening/Reading/Writing/Speaking bands, target per skill (optional)
- IELTS test type (Academic / General Training)
- Exam date, plan start date, user timezone
- Weekly availability per day, max session minutes, max sessions per day, preferred study time
- Rest days, study intensity
- Weak skills, strong skills
- Preferred learning methods and task types

**Critical fields** (structured error if missing): current level, target level, exam date, available study schedule.

## Additional Personalization Inputs
Recent mistakes, exercise accuracy, completed/incomplete exercises, saved vocabulary/content/articles, YouTube transcript data, writing/speaking feedback, mock test results, practice/completion history, actual study duration, learning streak, existing roadmap progress, user confidence per skill, previous IELTS results, manually selected priority skills, temporary unavailable dates, date-specific additional availability, offline-only mode, AI provider availability.

## Architecture Guidelines

### Engine Separation
- **Deterministic planning core** — profile normalization, validation, date/timezone calculations, availability, skill-gap scoring, feasibility analysis, phase boundaries, time budgets, task scheduling, review scheduling, mock-test scheduling, progress calculation, plan validation, repair, persistence.
- **AI content system** (only when available) — pedagogical recommendations, weekly objectives, task ideas, contextual instructions, examples, explanations based on mistakes/vocabulary/content. AI must never return dates, capacity, placement, progress, or feasibility.

### Generation Pipeline
Raw profile → normalization → validation → planning window → availability → skill-gap → feasibility → user confirmation → phase generation → weekly budgets → AI strategy → optional AI analysis → weekly objectives → task candidates → deduplication → deterministic scheduling → review scheduling → mock scheduling → final-week planning → validation → deterministic repair → optional AI content repair → final validation → transactional persistence.

### Modular Architecture (`features/study-plan/`)
- `domain/` — entities, value-objects, types, rules
- `application/` — use cases (generate, preview, regenerate, rebalance, resolve-missed, validate, repair)
- `engine/` — profile normalizer/validator, planning-window calculator, availability calculator, skill-gap analyzer, feasibility analyzer, phase planner, time-budget allocator, AI generation strategy, task-candidate provider/deduplicator, task scheduler, review scheduler, mock-test scheduler, final-week planner, progress calculator, plan validator, repairer
- `infrastructure/` — AI client, prompt builders, schemas, cache, persistence, repositories, migrations, task library
- `presentation/` — pages, components, hooks, state

### Key Technical Constraints
- LocalDate abstraction (`YYYY-MM-DD`), timezone-safe, no raw `Date` in domain logic
- Weekly availability model with date-specific exceptions
- Planning window calculation before any tasks
- Feasibility analysis with status: `comfortable | challenging | high-risk | insufficient-time`
- Skill-gap priority scoring with configurable weights
- Constraint-based deterministic task scheduler
- Offline built-in task template library
- Task candidate deduplication before scheduling
- Spaced repetition intervals: same day, 1, 3, 7, 14 days
- Mock-test scheduling with mandatory analysis
- Final-week special rules (no new material, no full mock before exam)
- Missed-task adaptation with structured outcomes (reschedule/split/replace/merge/drop)
- Regeneration modes: full, future-only, rebalance, settings-change, exam-date-change, availability-change, target-change
- Settings-change impact preview before applying
- Plan validation (28+ rules), deterministic repair with max attempts
- AI caching with cache keys from normalized inputs
- Context minimization for AI prompts (only relevant data sent)
- Transactional persistence, never replace valid plan with partial
- Generation cancellation (AbortController), no simultaneous generations
- Structured error codes, privacy-safe logging

### Testing
Comprehensive unit tests (engine), AI orchestration tests, integration tests (full flows), UI tests (setup, preview, generation, fallback, accessibility).

### Acceptance Scenarios (8)
A: Balanced medium-term (12wk, uneven availability)  
B: Uneven skill profile (Writing/Speaking get highest allocation)  
C: Short high-risk plan (7 days, clear warnings+confirmation)  
D: No AI key (complete offline roadmap, no crash)  
E: Partial AI failure (fallback per batch, plan still valid)  
F: Availability changes (completed tasks preserved, future rebalanced)  
G: Exam date earlier (recalculate window, preserve done, reduce optional)  
H: Missed high-priority task (buffer use, no overload, dependency preservation)

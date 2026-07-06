# IELTS Journey — Implementation Plan

## Overview

This document describes how to implement the IELTS Journey redesign. It is a **plan only** — no implementation should happen based on this document until all design files are reviewed and approved.

The redesign transforms IELTS Journey from a **functional study tool** into a **personal IELTS learning companion** with a soft, modern, mobile-first UI. The plan is organized into phases that prioritize foundational changes before page-level redesigns.

---

## Implementation Order

### Phase 0: Foundation Preparation

Before any visible changes, set up the infrastructure that all subsequent phases depend on.

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 0.1 | Extend theme token system with new categories | `packages/theme/src/tokens.ts`, `packages/theme/src/types.ts` | None |
| 0.2 | Add new CSS custom properties | `packages/theme/src/cssVariables.css` | 0.1 |
| 0.3 | Add new Tailwind theme extensions | `apps/web/tailwind.config.*` | 0.1 |
| 0.4 | Update shadow tokens (softer shadows) | `packages/theme/src/tokens.ts` | 0.1 |
| 0.5 | Update background color tokens (warm off-white) | `packages/theme/src/tokens.ts` | 0.1 |
| 0.6 | Add animation keyframes (shimmer, slideUp, scaleIn, etc.) | `packages/theme/src/cssVariables.css` | None |
| 0.7 | Add new z-index tokens (sidebar, bottomNav, drawer, etc.) | `packages/theme/src/tokens.ts` | 0.1 |
| 0.8 | Add vocabulary/grammar/band/exam urgency color tokens | `packages/theme/src/tokens.ts` | 0.1 |
| 0.9 | Verify dark mode tokens have proper contrast | `packages/theme/src/tokens.ts` | 0.1 |

**Risk**: Token changes affect every component. Verify all existing components still render correctly after token changes. Run visual regression tests.

### Phase 1: Core Component Refinement

Refine existing reusable UI components before building new pages.

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 1.1 | Refine Button — add AI Tutor variant | `packages/ui/src/components/Button.tsx` | 0.1 |
| 1.2 | Refine Card — add left-accent border variant, tint variant | `packages/ui/src/components/Card.tsx` | 0.1 |
| 1.3 | Refine Badge — add grammar/vocabulary skill variants | `packages/ui/src/components/Badge.tsx` | 0.1 |
| 1.4 | Refine Modal — add portal rendering, scrollbar compensation | `packages/ui/src/components/Modal.tsx` | 0.1 |
| 1.5 | Refine Drawer — add drag-to-dismiss, backdrop blur, focus trap | `packages/ui/src/components/Drawer.tsx` | 0.1 |
| 1.6 | Refine Toast — add action button, position variants, SVG icons | `packages/ui/src/components/Toast.tsx` | 0.1 |
| 1.7 | Refine ProgressBar — add skill variants, indeterminate mode | `packages/ui/src/components/ProgressBar.tsx` | 0.1 |
| 1.8 | Refine ProgressRing — add skill variants, label prop | `packages/ui/src/components/ProgressRing.tsx` | 0.1 |
| 1.9 | Refine SkillCard — add grammar/vocabulary types | `packages/ui/src/components/SkillCard.tsx` | 0.1 |
| 1.10 | Refine StudyTaskCard — polish status visuals | `packages/ui/src/components/StudyTaskCard.tsx` | 0.1 |
| 1.11 | Refine VocabularyWordCard — add selected state, swipe support | `packages/ui/src/components/VocabularyWordCard.tsx` | 0.1 |
| 1.12 | Refine AITutorMessageCard — add typing state, markdown, correction variant | `packages/ui/src/components/AITutorMessageCard.tsx` | 0.1 |
| 1.13 | Refine MobileBottomNavigation — add glass effect, active indicator | `packages/ui/src/components/MobileBottomNavigation.tsx` | 0.1 |
| 1.14 | Refine LoadingSkeleton — add shimmer direction, new page types | `packages/ui/src/components/LoadingSkeleton.tsx` | 0.1 |
| 1.15 | Update EmptyState — refine messages, illustrations | `packages/ui/src/components/EmptyState.tsx` | 0.1 |
| 1.16 | Update ErrorDisplay — refine error states | `apps/web/src/components/ui/ErrorDisplay.tsx` | 0.1 |

**Risk**: Component refinements may introduce regressions. Each component change should be verified against its existing usage across all pages.

### Phase 2: New Components

Create new reusable components that don't exist yet.

| Step | Task | Files to Create/Change | Dependencies |
|------|------|-----------------------|-------------|
| 2.1 | Create custom Select component (dropdown, search, keyboard) | `packages/ui/src/components/Select.tsx` | 0.1 |
| 2.2 | Create DatePicker component | `packages/ui/src/components/DatePicker.tsx` | 0.1 |
| 2.3 | Create Tabs component | `packages/ui/src/components/Tabs.tsx` | 0.1 |
| 2.4 | Create PracticeCard component | `packages/ui/src/components/PracticeCard.tsx` | 0.1 |
| 2.5 | Create MistakeCard component | `packages/ui/src/components/MistakeCard.tsx` | 0.1 |
| 2.6 | Create ProgressSummaryCard component | `packages/ui/src/components/ProgressSummaryCard.tsx` | 0.1 |
| 2.7 | Create AITutorRecommendationCard component | `packages/ui/src/components/AITutorRecommendationCard.tsx` | 0.1 |
| 2.8 | Create VocabularyDetailPanel component | `packages/ui/src/components/VocabularyDetailPanel.tsx` | 0.1 |
| 2.9 | Create SettingsSectionCard component | `packages/ui/src/components/SettingsSectionCard.tsx` | 0.1 |

**Risk**: New components must be consistent with existing component API patterns. Review existing `Button.tsx`, `Card.tsx` patterns for consistency reference.

### Phase 3: Layout & Navigation Redesign

Restructure the app shell with the new navigation system.

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 3.1 | Redesign AppLayout — new sidebar with section grouping | `apps/web/src/components/layout/Layout.tsx` | 1.13 |
| 3.2 | Update header component — search, AI Tutor, dark mode toggle | `apps/web/src/components/layout/HeaderBar.tsx` | 1.1 |
| 3.3 | Update mobile bottom navigation — 5 items, glass effect | `apps/web/src/components/layout/MobileBottomNavigation.tsx` | 1.13 |
| 3.4 | Add AI Tutor floating button to app shell | `apps/web/src/components/layout/FloatingAITutorButton.tsx` | 1.1, 1.12 |
| 3.5 | Add sidebar collapsed state for tablet | `apps/web/src/components/layout/Layout.tsx` | 3.1 |
| 3.6 | Add breadcrumb support to header | `apps/web/src/components/layout/HeaderBar.tsx` | 3.2 |
| 3.7 | Update route configuration for new page structure | `apps/web/src/router.tsx` or equivalent | None |
| 3.8 | Add redirects for old routes to new structure | `apps/web/src/router.tsx` | 3.7 |
| 3.9 | Update page metadata/titles for new header | Per-page components | 3.2 |
| 3.10 | Add responsive safe area handling for mobile | `apps/web/src/components/layout/Layout.tsx` | None |

**Route changes needed**:
- `/review` → redirect to `/vocabulary/review`
- `/review-center` → merge into `/practice/mistakes`
- `/reading` → `/practice/reading`
- `/listening` → `/practice/listening`
- `/writing` → `/practice/writing`
- `/speaking` → `/practice/speaking`
- `/grammar` → `/practice/grammar`
- `/mistakes` → `/practice/mistakes`
- `/mock-tests` → `/progress/tests`
- `/topics` → `/progress/topics`
- `/progress-review` → `/progress/review`
- `/import-export` → `/settings/data`
- `/roadmap` (redirect) → serve `/roadmap` directly
- New: `/tutor` (AI Tutor full page)
- New: `/practice` (Practice hub)
- New: `/settings/profile`, `/settings/ai`, `/settings/language`, `/settings/theme`, `/settings/extension`, `/settings/about`
- New: `/saved` (Saved Content)

**Risk**: Layout changes affect every page. Verify all routes render correctly after layout restructuring. The mobile bottom navigation must not overlap with page content.

### Phase 4: Landing Page Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 4.1 | Redesign hero section — warm gradient, tagline, dual CTA | `apps/web/src/pages/LandingPage.tsx` | 1.1, 1.2 |
| 4.2 | Add problem/solution section with visual comparison | `apps/web/src/pages/LandingPage.tsx` | 1.2 |
| 4.3 | Add AI Tutor preview section | `apps/web/src/pages/LandingPage.tsx` | 1.2, 1.8 |
| 4.4 | Add daily study roadmap preview | `apps/web/src/pages/LandingPage.tsx` | 1.2 |
| 4.5 | Add vocabulary learning preview | `apps/web/src/pages/LandingPage.tsx` | 1.2 |
| 4.6 | Add progress tracking preview | `apps/web/src/pages/LandingPage.tsx` | 1.2, 1.8 |
| 4.7 | Add browser extension section | `apps/web/src/pages/LandingPage.tsx` | 1.2 |
| 4.8 | Add mobile/PWA support section | `apps/web/src/pages/LandingPage.tsx` | 1.2 |
| 4.9 | Redesign CTA section — dual action, social proof | `apps/web/src/pages/LandingPage.tsx` | 1.1 |
| 4.10 | Add footer with links, language selector | `apps/web/src/pages/LandingPage.tsx` | None |
| 4.11 | Update SEO meta tags, Open Graph images | `apps/web/src/pages/LandingPage.tsx` | None |
| 4.12 | Ensure global-friendly default (English, not Vietnamese-oriented) | `apps/web/src/pages/LandingPage.tsx` | None |

**Risk**: Landing page is the first impression. Verify load performance (LCP, CLS) after adding new sections.

### Phase 5: Onboarding Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 5.1 | Redesign onboarding as experience-based flow (not form) | `apps/web/src/features/onboarding/OnboardingForm.tsx` | 1.1, 1.2, 2.1, 2.2 |
| 5.2 | Add animated step transitions | Onboarding component | 0.6 |
| 5.3 | Add visual band selection (not plain select) | Onboarding component | 2.1 |
| 5.4 | Add visual skill selection with icons | Onboarding component | 1.2 |
| 5.5 | Add study time slider | Onboarding component | None |
| 5.6 | Add AI generation progress screen with animation | Onboarding component | 1.7, 1.2 |
| 5.7 | Add celebration/tutorial moment after onboarding | Onboarding component | 1.2, 0.6 |
| 5.8 | Add language selection at start | Onboarding component | 2.1 |

**Risk**: Onboarding is the first experience after sign-up. Error handling for generation failure must be graceful. Test with slow AI responses.

### Phase 6: Dashboard Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 6.1 | Redesign dashboard hero — greeting, mission, countdown, streak | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.1, 1.2, 2.6 |
| 6.2 | Add personalized greeting with user name | `apps/web/src/features/dashboard/Dashboard.tsx` | None |
| 6.3 | Add Today's Mission card as primary focus | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.2 |
| 6.4 | Add AI Tutor recommendation card | `apps/web/src/features/dashboard/Dashboard.tsx` | 2.7 |
| 6.5 | Add skill progress cards in responsive grid | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.9, 1.2 |
| 6.6 | Add vocabulary review reminder | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.2 |
| 6.7 | Add weak skill warning with actionable CTA | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.2, 1.3 |
| 6.8 | Add weekly progress summary | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.7, 2.6 |
| 6.9 | Add Continue Learning button (primary CTA) | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.1 |
| 6.10 | Add quick action section | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.1, 1.2 |
| 6.11 | Add loading skeleton for dashboard | `apps/web/src/features/dashboard/Dashboard.tsx` | 1.14 |
| 6.12 | Ensure dashboard works offline with cached data | Dashboard hook/data layer | None |

**Risk**: Dashboard has the most data dependencies. Ensure all data still loads correctly with the new layout. The AI recommendation must handle empty/loading states gracefully.

### Phase 7: Today's Study Plan Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 7.1 | Redesign Today's Plan page — goal, time, checklist | `apps/web/src/features/study-plan/StudyPlan.tsx` | 1.2, 1.10, 1.1 |
| 7.2 | Add today's goal and estimated time header | StudyPlan component | 2.6 |
| 7.3 | Add task checklist with skill-colored task cards | StudyPlan component | 1.10 |
| 7.4 | Add completion progress bar | StudyPlan component | 1.7 |
| 7.5 | Add mark-complete and skip actions | StudyPlan component | 1.1 |
| 7.6 | Add AI Tutor note at bottom of plan | StudyPlan component | 1.12 |
| 7.7 | Add "View Full Roadmap" link | StudyPlan component | 1.1 |
| 7.8 | Add loading/empty/error states | StudyPlan component | 1.14, 1.15 |

**Risk**: Study plan logic is complex. Ensure task status updates (complete/skip) still work correctly with new UI.

### Phase 8: AI Study Plan Generator Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 8.1 | Redesign plan generator input UI | `apps/web/src/features/study-plan/PlanGenerator.tsx` | 1.2, 2.1, 2.2, 1.1 |
| 8.2 | Add visual configuration cards (level, target, date, time, skills) | PlanGenerator component | 1.2 |
| 8.3 | Add generation progress with chunk tracking | PlanGenerator component | 1.7, 0.6 |
| 8.4 | Add error/retry state for generation failure | PlanGenerator component | 1.15 |
| 8.5 | Add generated plan preview with accept/reject | PlanGenerator component | 1.2, 1.1 |
| 8.6 | Add "Adjust Plan" flow with regeneration | PlanGenerator component | 1.1 |
| 8.7 | Show AI explanation of generated plan | PlanGenerator component | 1.12 |

**Risk**: Plan generation can take 30-60 seconds. The progress UI must handle timeouts, partial failures (some chunks fail), and cancellation gracefully.

### Phase 9: Full Study Roadmap Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 9.1 | Redesign study roadmap page | `apps/web/src/features/roadmap/RoadmapPage.tsx` | 1.2, 1.1, 2.3 |
| 9.2 | Add visual timeline from today to exam day | Roadmap component | 1.2, 0.6 |
| 9.3 | Add phase sections with completion status | Roadmap component | 1.7, 1.3 |
| 9.4 | Add weekly sections with task cards | Roadmap component | 1.10 |
| 9.5 | Add today highlight on timeline | Roadmap component | 1.2 |
| 9.6 | Add day status indicators (completed/skipped/partial/missed) | Roadmap component | 1.3 |
| 9.7 | Add adjust remaining plan action | Roadmap component | 1.1 |
| 9.8 | Add AI Tutor explanation of roadmap | Roadmap component | 1.12 |
| 9.9 | Add plan completion progress | Roadmap component | 1.7, 1.8 |

**Risk**: Roadmap displays a large amount of timeline data. Ensure smooth scrolling and rendering performance with long study plans (6+ months).

### Phase 10: AI Tutor Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 10.1 | Create full AI Tutor page (`/tutor`) | `apps/web/src/features/ai-tutor/AITutorPage.tsx` | 1.12, 1.2, 1.1 |
| 10.2 | Redesign floating AI Tutor popup | `apps/web/src/features/ai-tutor/FloatingAITutor.tsx` | 1.12, 1.4 |
| 10.3 | Add message list with smooth scroll | AITutor components | 1.12 |
| 10.4 | Add suggested prompts grid | AITutor components | 1.2 |
| 10.5 | Add contextual learning suggestions | AITutor components | 1.12 |
| 10.6 | Add proactive tutor messages (dashboard integration) | AITutor components | 2.7 |
| 10.7 | Add writing correction entry | AITutor components | 1.2 |
| 10.8 | Add speaking practice entry | AITutor components | 1.2 |
| 10.9 | Add vocabulary explanation entry | AITutor components | 1.2 |
| 10.10 | Add typing indicator for AI generation | `packages/ui/src/components/AITutorMessageCard.tsx` | 1.12 |
| 10.11 | Support markdown rendering in messages | AITutor components | None |
| 10.12 | Add proactive message engine context integration | `packages/ai-tutor/` | None |
| 10.13 | Add floating button pulse animation for proactive messages | AITutor components | 0.6 |

**Risk**: AI Tutor has multiple entry points and states. Ensure chat context is preserved correctly when switching between floating popup and full page. Floating button must not overlap with bottom navigation on mobile.

### Phase 11: Vocabulary Notebook Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 11.1 | Redesign vocabulary notebook page | `apps/web/src/features/vocabulary/Vocabulary.tsx` | 1.11, 2.3, 1.5 |
| 11.2 | Add search/filter bar | Vocabulary component | 1.6 (SearchInput) |
| 11.3 | Add topic grouping with collapsible sections | Vocabulary component | 1.2 |
| 11.4 | Add difficulty/review status badges | Vocabulary component | 1.3 |
| 11.5 | Add pronunciation button with audio | Vocabulary component | 1.1 (IconButton) |
| 11.6 | Add word detail panel integration | Vocabulary component | 2.8, 1.5 |
| 11.7 | Add "Ask AI Tutor" action per word | Vocabulary component | 2.8 |
| 11.8 | Add bulk actions (select words, batch review) | Vocabulary component | 1.11 |
| 11.9 | Add vocabulary stats header (total, mastered, learning) | Vocabulary component | 2.6 |
| 11.10 | Add loading/empty/error states | Vocabulary component | 1.14, 1.15 |

**Risk**: Vocabulary pages may have hundreds of words. Ensure list virtualization or pagination for performance with large datasets.

### Phase 12: Vocabulary Review Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 12.1 | Redesign vocabulary review start screen | `apps/web/src/features/vocabulary/VocabularyReview.tsx` | 1.2, 1.1 |
| 12.2 | Add flashcard UI with flip animation | VocabularyReview component | 1.2, 0.6 |
| 12.3 | Add quiz UI (multiple choice, fill-in-blank) | VocabularyReview component | 1.2 |
| 12.4 | Add Remember/Forgot action buttons | VocabularyReview component | 1.1 |
| 12.5 | Add session progress (words done / total) | VocabularyReview component | 1.8 |
| 12.6 | Add completion summary with statistics | VocabularyReview component | 1.2, 1.7 |
| 12.7 | Add "words to review again" list | VocabularyReview component | 1.2 |
| 12.8 | Add AI Tutor recommendation after review | VocabularyReview component | 2.7 |

**Risk**: Flashcard/quiz interaction has many states. Ensure touch interactions work smoothly on mobile.

### Phase 13: Saved Content Page

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 13.1 | Create saved content page | New file in vocabulary or practice feature | 1.2, 2.3, 1.6 |
| 13.2 | Add saved articles list | SavedContent component | 1.2 |
| 13.3 | Add saved selected text list | SavedContent component | 1.2 |
| 13.4 | Add saved notes list | SavedContent component | 1.2 |
| 13.5 | Add content detail view | SavedContent component | 1.5, 1.2 |
| 13.6 | Add "Generate Exercise" action | SavedContent component | 1.1 |
| 13.7 | Add "Explain with AI" action | SavedContent component | 1.1 |
| 13.8 | Add "Save Vocabulary" action from content | SavedContent component | 1.1 |
| 13.9 | Add reading practice from saved article action | SavedContent component | 1.1 |
| 13.10 | Add empty state with friendly message | SavedContent component | 1.15 |

**Risk**: This is a new page — no existing route or component. Ensure it integrates with existing storage/state patterns.

### Phase 14: Practice Pages Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 14.1 | Create Practice hub page | New file at `apps/web/src/features/practice/PracticeHub.tsx` | 2.4, 2.3, 1.2 |
| 14.2 | Redesign Reading Practice page | `apps/web/src/features/reading/ReadingPractice.tsx` | 1.2, 1.1, 2.4 |
| 14.3 | Redesign Listening Practice page | `apps/web/src/features/listening/ListeningPractice.tsx` | 1.2, 1.1 |
| 14.4 | Redesign Writing Practice page | `apps/web/src/features/writing/WritingPractice.tsx` | 1.2, 1.1 |
| 14.5 | Redesign Speaking Practice page | `apps/web/src/features/speaking/SpeakingPractice.tsx` | 1.2, 1.1 |
| 14.6 | Redesign Grammar page | `apps/web/src/features/grammar/GrammarNotes.tsx` | 1.2, 1.1 |
| 14.7 | Add consistent header to each practice page (objective, time, instructions) | Each practice component | 1.2 |
| 14.8 | Add AI Tutor help action per practice | Each practice component | 1.1, 1.12 |
| 14.9 | Add result state after practice completion | Each practice component | 1.2 |
| 14.10 | Add feedback state with detailed breakdown | Each practice component | 1.2 |
| 14.11 | Add "Save Mistake" action after results | Each practice component | 1.1 |
| 14.12 | Add "Save Vocabulary" action after results (reading, listening) | Each practice component | 1.1 |
| 14.13 | Add loading/empty/error states per practice | Each practice component | 1.14, 1.15 |

**Risk**: Practice pages have complex interactive states (timers, audio, recording). Each skill page has unique requirements. Do not break existing practice functionality.

### Phase 15: Mistake Review Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 15.1 | Redesign mistake review page | `apps/web/src/features/mistakes/MistakeNotebook.tsx` | 2.5, 2.1, 1.3 |
| 15.2 | Add mistake list with category grouping | MistakeReview component | 2.5 |
| 15.3 | Add skill filter | MistakeReview component | 1.3, 2.1 |
| 15.4 | Add repeated mistake highlighting | MistakeReview component | 1.3 |
| 15.5 | Add explanation card for each mistake | MistakeReview component | 1.2 |
| 15.6 | Add fix recommendation | MistakeReview component | 1.12 |
| 15.7 | Add "Practice Similar" action | MistakeReview component | 1.1 |
| 15.8 | Add "Ask AI Tutor" insight action | MistakeReview component | 1.1 |
| 15.9 | Add loading/empty/error states | MistakeReview component | 1.14, 1.15 |

**Risk**: Mistake data structure varies by skill type. Ensure all mistake types render correctly.

### Phase 16: Learning Progress Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 16.1 | Create Progress hub page with tabs | `apps/web/src/features/progress/ProgressPage.tsx` | 2.3, 1.2, 1.1 |
| 16.2 | Add band progress chart | Progress component | Chart library or custom SVG |
| 16.3 | Add skill breakdown radar/bar chart | Progress component | Chart library or custom SVG |
| 16.4 | Add weekly study time chart | Progress component | Chart library or custom SVG |
| 16.5 | Add completed tasks stat | Progress component | 2.6 |
| 16.6 | Add vocabulary retention stat | Progress component | 2.6 |
| 16.7 | Add mistake trends visualization | Progress component | Chart library or custom SVG |
| 16.8 | Add study streak display | Progress component | 2.6 |
| 16.9 | Add study plan completion progress | Progress component | 1.7, 1.8 |
| 16.10 | Add exam countdown | Progress component | 1.2 |
| 16.11 | Add loading/empty/error states | Progress component | 1.14, 1.15 |
| 16.12 | Reorganize: Mock Tests → `/progress/tests`, Topics → `/progress/topics` | Route + feature components | None |

**Risk**: Charts require a charting library decision (recharts, chart.js, or custom SVG). Performance with many data points must be verified. This page may need a new dependency.

### Phase 17: AI Progress Review Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 17.1 | Redesign AI progress review page | `apps/web/src/features/progress/ProgressReviewPage.tsx` | 1.2, 1.1, 1.12 |
| 17.2 | Add period selector (week/month/all) | ProgressReview component | 2.1 |
| 17.3 | Add generate review action with loading | ProgressReview component | 1.1, 1.7 |
| 17.4 | Add AI review summary section | ProgressReview component | 1.12 |
| 17.5 | Add strengths section | ProgressReview component | 1.2, 1.3 |
| 17.6 | Add weaknesses section | ProgressReview component | 1.2, 1.3 |
| 17.7 | Add repeated mistakes analysis | ProgressReview component | 1.2 |
| 17.8 | Add vocabulary review summary | ProgressReview component | 1.2 |
| 17.9 | Add skill-by-skill progress comparison | ProgressReview component | 1.9 |
| 17.10 | Add study plan comparison (on track / behind) | ProgressReview component | 1.2, 1.7 |
| 17.11 | Add next recommendations | ProgressReview component | 1.12, 2.7 |
| 17.12 | Add save report action | ProgressReview component | 1.1 |
| 17.13 | Add follow-up questions to AI Tutor | ProgressReview component | 1.1 |
| 17.14 | Add loading/empty/error states | ProgressReview component | 1.14, 1.15 |

**Risk**: AI review generation involves significant AI processing. The UI must handle long generation times and partial failures gracefully.

### Phase 18: Settings Redesign

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 18.1 | Redesign settings page with sub-navigation | `apps/web/src/features/settings/Settings.tsx` | 2.9, 2.3, 1.1 |
| 18.2 | Add profile settings section | Settings component | 2.9, 1.1 |
| 18.3 | Add language settings with locale switcher | Settings component | 2.9, 2.1 |
| 18.4 | Add AI Tutor settings (tone, personality) | Settings component | 2.9 |
| 18.5 | Add AI Provider settings (provider, API key, model) | Settings component | 2.9, 1.1 |
| 18.6 | Add study plan settings (time, intensity, focus) | Settings component | 2.9 |
| 18.7 | Add notification settings (reminders, streak alerts) | Settings component | 2.9 |
| 18.8 | Add theme settings (light/dark/system, accent color) | Settings component | 2.9 |
| 18.9 | Add data export/import section | Settings component | 2.9, 1.1 |
| 18.10 | Add privacy settings section | Settings component | 2.9 |
| 18.11 | Organize into settings sub-routes | Route config | None |

**Risk**: Settings involves form state management. Ensure unsaved changes warning works correctly.

### Phase 19: Extension Connection Page

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 19.1 | Create extension connection page | New file at settings feature | 1.2, 1.1, 1.3 |
| 19.2 | Add extension introduction section | ExtensionConnection component | 1.2 |
| 19.3 | Add install extension CTA with platform detection | ExtensionConnection component | 1.1 |
| 19.4 | Add connection status indicator | ExtensionConnection component | 1.3, ExtensionSyncStatusBadge |
| 19.5 | Add sync explanation section | ExtensionConnection component | 1.2 |
| 19.6 | Add "how extension helps" feature list | ExtensionConnection component | 1.2 |
| 19.7 | Add last sync time display | ExtensionConnection component | None |
| 19.8 | Add empty/disconnected state | ExtensionConnection component | 1.15 |

**Risk**: Extension connection depends on browser API availability. Handle cases where extension is not installed gracefully.

### Phase 20: Empty, Loading, Error States Polish

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 20.1 | Audit all pages for consistent empty states | All page components | 1.15 |
| 20.2 | Audit all pages for consistent loading states | All page components | 1.14 |
| 20.3 | Audit all pages for consistent error states | All page components | 1.15 |
| 20.4 | Add offline detection and offline UI | App shell or data layer | None |
| 20.5 | Add generation failure state for AI features | AI-dependent components | 1.15 |
| 20.6 | Add "not enough data" state for progress | Progress components | 1.15 |
| 20.7 | Add logged-out redirect state | App router | None |

**Risk**: Empty/loading/error states are often overlooked. Dedicated QA pass needed for all states across all pages.

### Phase 21: Responsive & Mobile Polish

| Step | Task | Files to Change | Dependencies |
|------|------|-----------------|-------------|
| 21.1 | Audit all pages for mobile layout | All page components | Phases 4-19 |
| 21.2 | Ensure touch targets ≥ 44px across all interactive elements | All components | 1.1-2.9 |
| 21.3 | Verify bottom navigation behavior on all mobile pages | Layout component | 3.3 |
| 21.4 | Verify chat popup positioning on mobile | AITutor components | 10.2 |
| 21.5 | Verify practice pages on mobile (audio, recording, text input) | Practice components | 14.x |
| 21.6 | Verify vocabulary review on mobile (flashcard swipe) | VocabularyReview | 12.x |
| 21.7 | Verify progress charts on mobile | Progress components | 16.x |
| 21.8 | Verify settings layout on mobile | Settings components | 18.x |
| 21.9 | Add safe area insets for notched devices | Layout + page components | None |
| 21.10 | Test modal/drawer behavior on mobile | Modal, Drawer | 1.4, 1.5 |

**Risk**: Mobile testing requires physical devices or emulators. Some interactions (recording, swipe) are inherently mobile-specific and need real device testing.

### Phase 22: Accessibility Audit

| Step | Task | Files to Verify | Dependencies |
|------|------|-----------------|-------------|
| 22.1 | Add semantic HTML structure to all pages | All page components | All phases |
| 22.2 | Verify keyboard navigation across all pages | All interactive components | All phases |
| 22.3 | Add/verify focus states on all interactive elements | All components | 1.1-2.9 |
| 22.4 | Verify color contrast meets WCAG AA | Theme tokens + all components | 0.1 |
| 22.5 | Add/verify screen reader labels | All components | 1.1-2.9 |
| 22.6 | Verify button/input accessibility | Form components | All phases |
| 22.7 | Verify mobile touch size compliance | Mobile components | 21.x |
| 22.8 | Ensure error messages are descriptive | All error states | 20.x |
| 22.9 | Ensure no information conveyed through color alone | All status indicators | All phases |

**Risk**: Accessibility fixes may require revisiting component implementations. Ideally done as part of each phase, not as a separate phase.

### Phase 23: Dark Mode Verification

| Step | Task | Files to Verify | Dependencies |
|------|------|-----------------|-------------|
| 23.1 | Verify all pages in dark mode | All page components | All phases |
| 23.2 | Verify all components in dark mode | All components | 1.1-2.9 |
| 23.3 | Check for hardcoded light colors | Entire codebase | None |
| 23.4 | Verify dark mode contrast | Theme tokens | 0.1 |
| 23.5 | Verify glass effect appearance in dark mode | Layout components | 3.x |
| 23.6 | Verify colored shadows in dark mode | Theme tokens | 0.1 |

**Risk**: Dark mode issues are often subtle. Systematic pass through every page and component is needed.

---

## Files Likely to Change

### Theme Package (`packages/theme/src/`)

| File | Change | Phase |
|------|--------|-------|
| `tokens.ts` | Add new token categories (vocabulary, grammar, band, exam urgency, transition) | 0 |
| `tokens.ts` | Refine existing values (softer shadows, warmer backgrounds) | 0 |
| `tokens.ts` | Add new spacing tokens (4xl-6xl) | 0 |
| `types.ts` | Extend `DesignTokens` interface with new categories | 0 |
| `cssVariables.css` | Add CSS custom properties for new tokens, new animations | 0 |

### UI Package (`packages/ui/src/components/`)

| File | Change | Phase |
|------|--------|-------|
| `Button.tsx` | Add AI Tutor variant | 1 |
| `IconButton.tsx` | Add xs size variant | 1 |
| `Card.tsx` | Add left-accent, tint, elevated variants | 1 |
| `Badge.tsx` | Add grammar/vocabulary skill variants | 1 |
| `Modal.tsx` | Add portal rendering, scrollbar compensation, animation variants | 1 |
| `Drawer.tsx` | Add drag-to-dismiss, backdrop blur, focus trap | 1 |
| `Toast.tsx` | Add action button, position variants, SVG icons | 1 |
| `ProgressBar.tsx` | Add skill variants, indeterminate mode | 1 |
| `ProgressRing.tsx` | Add skill variants, label prop | 1 |
| `LoadingSkeleton.tsx` | Add shimmer direction, new page-type skeletons | 1 |
| `SkillCard.tsx` | Add grammar/vocabulary types, action slot | 1 |
| `StudyTaskCard.tsx` | Polish status visuals | 1 |
| `VocabularyWordCard.tsx` | Add selected state, saved context, swipe support | 1 |
| `AITutorMessageCard.tsx` | Add typing state, markdown rendering, correction variant | 1 |
| `MobileBottomNavigation.tsx` | Add glass effect, active indicator | 1 |
| `EmptyState.tsx` | Refine messages, add page-type variants | 1 |
| `Select.tsx` (new) | Custom dropdown with search, keyboard support | 2 |
| `DatePicker.tsx` (new) | Calendar date selector | 2 |
| `Tabs.tsx` (new) | Tab navigation component | 2 |
| `PracticeCard.tsx` (new) | Practice exercise card | 2 |
| `MistakeCard.tsx` (new) | Mistake review card | 2 |
| `ProgressSummaryCard.tsx` (new) | Metric display with trend | 2 |
| `AITutorRecommendationCard.tsx` (new) | Proactive AI suggestion card | 2 |
| `VocabularyDetailPanel.tsx` (new) | Rich vocabulary detail | 2 |
| `SettingsSectionCard.tsx` (new) | Grouped settings container | 2 |

### Web App Layout (`apps/web/src/components/layout/`)

| File | Change | Phase |
|------|--------|-------|
| `Layout.tsx` | Restructure with new sidebar, header, bottom nav | 3 |
| App shell | Add floating AI Tutor button | 3 |

### Web App Pages (`apps/web/src/features/` or `apps/web/src/pages/`)

| File | Change | Phase |
|------|--------|-------|
| `LandingPage.tsx` | Complete redesign with all sections | 4 |
| `OnboardingForm.tsx` | Experience-based redesign | 5 |
| `Dashboard.tsx` | Redesign with mission-first layout | 6 |
| `StudyPlan.tsx` | Redesign with task checklist | 7 |
| `PlanGenerator.tsx` | Redesign with visual config and progress | 8 |
| `RoadmapPage.tsx` | Redesign with visual timeline | 9 |
| New `AITutorPage.tsx` | Full AI Tutor page | 10 |
| `FloatingAITutor.tsx` | Redesign popup | 10 |
| `Vocabulary.tsx` | Redesign with search, topics, stats | 11 |
| `VocabularyReview.tsx` | Redesign with flashcards, quiz | 12 |
| New `SavedContent.tsx` | New saved content page | 13 |
| `ReadingPractice.tsx` | Redesign | 14 |
| `ListeningPractice.tsx` | Redesign | 14 |
| `WritingPractice.tsx` | Redesign | 14 |
| `SpeakingPractice.tsx` | Redesign | 14 |
| `GrammarNotes.tsx` | Redesign | 14 |
| New `PracticeHub.tsx` | New practice hub page | 14 |
| `MistakeNotebook.tsx` | Redesign | 15 |
| `ProgressPage.tsx` | Redesign with tabs, charts | 16 |
| `ProgressReviewPage.tsx` | Redesign | 17 |
| `Settings.tsx` | Redesign with sub-navigation | 18 |
| New extension connection page | New page | 19 |

### Web App Router

| File | Change | Phase |
|------|--------|-------|
| Router config | Update routes for new page structure, add redirects | 3 |

### Packages (`packages/`)

| Package | Change | Phase |
|---------|--------|-------|
| `packages/ai-tutor/` | Add proactive message engine context integration | 10 |
| `packages/ai/` | No structural changes expected (AI logic remains) | — |

---

## Testing Checklist

### Visual & Layout Tests

- [ ] All pages render correctly with new theme tokens
- [ ] All components display correctly with refined styles
- [ ] Landing page looks good on mobile, tablet, desktop
- [ ] Dashboard hero section is visually prominent
- [ ] Navigation sidebar renders correctly (desktop)
- [ ] Bottom navigation renders correctly (mobile)
- [ ] AI Tutor floating button is positioned correctly
- [ ] All cards use consistent border-radius and shadow
- [ ] Dark mode renders correctly on all pages
- [ ] Glass effects (header, bottom nav) render correctly
- [ ] Animations play smoothly (not janky)
- [ ] No hardcoded colors remain — all use theme tokens

### Functional Tests

- [ ] All routes work with new page structure
- [ ] Old routes redirect to new routes correctly
- [ ] Navigation links navigate to correct pages
- [ ] Active page state is correct in sidebar/bottom nav
- [ ] Breadcrumbs show correct hierarchy
- [ ] Search opens correctly from header
- [ ] AI Tutor popup opens from floating button and header
- [ ] AI Tutor full page loads correctly
- [ ] Dashboard shows correct user data
- [ ] Today's Plan shows correct tasks
- [ ] Task complete/skip actions work
- [ ] Study plan generation works with progress display
- [ ] Study roadmap renders correct timeline
- [ ] Vocabulary search/filter works
- [ ] Vocabulary review flashcards work (flip, remember/forgot)
- [ ] Practice exercises start and submit correctly
- [ ] Mistake review shows correct data
- [ ] Progress charts render with data
- [ ] AI progress review generates and displays
- [ ] Settings save/load correctly
- [ ] Extension connection page shows correct status
- [ ] Dark mode toggle works on all pages

### Mobile Tests

- [ ] Bottom navigation is visible and functional
- [ ] Touch targets are ≥ 44px
- [ ] Cards stack vertically on small screens
- [ ] Modals become full-screen on mobile
- [ ] AI Tutor popup is usable on small screens
- [ ] Practice pages work with touch input
- [ ] Vocabulary review works with swipe gestures
- [ ] Settings sub-navigation works as tabs on mobile
- [ ] Safe area insets are respected (notch, home indicator)
- [ ] Keyboard doesn't obscure inputs
- [ ] All pages scroll correctly (no content hidden behind bottom nav)

### Accessibility Tests

- [ ] Skip to main content link works
- [ ] Keyboard navigation covers all interactive elements
- [ ] Focus indicators are visible on all interactive elements
- [ ] Screen reader announces page titles correctly
- [ ] All icons have appropriate aria-labels
- [ ] Color contrast meets WCAG AA minimum
- [ ] Error messages are descriptive and associated with inputs
- [ ] No information conveyed through color alone
- [ ] Form labels are associated with controls
- [ ] Modal/drawer focus traps work
- [ ] Reduced motion respected (animations disabled when preferred)

### Data Integrity Tests

- [ ] All existing user data displays correctly with new UI
- [ ] Study plan data structure unchanged (only UI changes)
- [ ] Vocabulary data structure unchanged
- [ ] Mistake data structure unchanged
- [ ] Progress calculations unchanged
- [ ] Settings data persists correctly
- [ ] Extension sync data displays correctly

### Error Handling Tests

- [ ] API failure shows appropriate error state
- [ ] AI generation failure shows retry option
- [ ] Network offline shows appropriate UI
- [ ] Empty states show friendly messages and actions
- [ ] Invalid routes redirect or show 404
- [ ] Authentication redirect works
- [ ] Form validation errors display correctly

### Performance Tests

- [ ] Landing page loads within 3 seconds (LCP)
- [ ] Dashboard loads within 2 seconds
- [ ] Vocabulary list renders smoothly with 100+ words
- [ ] Progress charts render without lag
- [ ] Navigation transitions are smooth
- [ ] No layout shifts during page load (CLS < 0.1)
- [ ] Bundle size does not increase significantly

---

## Risks

### High Risk

1. **Theme token changes affect every component**: Token refinements (softer shadows, warmer backgrounds) may look wrong on some pages. Each token change must be visually verified across all components. Solution: systematic visual pass through every page after token changes.

2. **Route restructuring breaks existing functionality**: Moving 15+ routes to new paths means redirects must be perfect. Users with bookmarks must not get 404s. Solution: comprehensive route testing with all old paths.

3. **Layout changes affect all pages**: The app shell wraps every authenticated page. Layout changes (sidebar, header, bottom nav) affect everything. Solution: verify every page renders correctly after layout changes.

4. **Mobile bottom nav overlaps content**: The fixed bottom nav (72px + safe area) may overlap page content at the bottom. Solution: add `padding-bottom` to main content area matching nav height.

5. **Practice page complexity**: Practice pages involve timers, audio, recording, and complex state management. Redesigning them without breaking functionality is challenging. Solution: incremental changes with thorough testing.

### Medium Risk

6. **Dashboard data aggregation**: The dashboard pulls data from multiple sources (plan, vocabulary, progress, AI). Changes to the dashboard layout must not break data loading. Solution: keep data hooks unchanged, only modify presentation.

7. **AI Tutor multi-entry-point parity**: The AI Tutor has a floating popup, a full page, and contextual entries. Chat state must be consistent across all. Solution: share state between popup and page implementations.

8. **Progress chart library decision**: If a new charting library is needed, it adds bundle size and learning curve. Solution: evaluate recharts (existing dependency?) vs. custom SVG before implementation.

9. **Onboarding redesign impacts user acquisition**: The onboarding flow is the gateway to the app. Redesigning it must not increase drop-off. Solution: A/B test the new flow or review analytics before/after.

10. **Extension connection depends on browser APIs**: Testing extension integration requires browser extension environment. Solution: mock extension state for development; test with real extension in QA.

### Low Risk

11. **Saved Content page is entirely new**: No existing code to break, but must integrate with existing storage patterns. Solution: follow existing data access patterns.

12. **Animation performance on low-end devices**: Spring animations and glass effects may be janky on older devices. Solution: use `will-change` sparingly, test on low-end devices.

13. **Color contrast in dark mode**: The refined dark mode needs careful contrast checking. Solution: automated contrast checking in CI.

14. **i18n preparation**: Adding language settings infrastructure now may require string externalization. Solution: use existing i18n patterns or prepare for future implementation without full i18n.

---

## Things Not to Change

### Do Not Change
- Application data logic (storage, state management, API integration)
- AI integration logic (`packages/ai/`, `packages/ai-tutor/` AI core)
- Study plan generation algorithm
- Vocabulary spaced repetition algorithm
- Progress calculation logic
- Extension functionality (`apps/extension/`)
- Authentication logic
- Offline storage patterns
- Database/schema design
- Package dependencies (unless necessary for charts)
- Test infrastructure

### Keep But Use Differently
- Theme token system — use it more deliberately with semantic naming
- Existing component API patterns — extend rather than replace
- Existing route structure — reorganize but keep underlying page logic
- AI Tutor chat logic — keep the AI core, redesign the UI surface
- Data hooks — keep data fetching, redesign presentation

---

## Implementation Order Summary

| Phase | Description | Phases | Estimated Effort |
|-------|-------------|--------|-----------------|
| 0 | Foundation (theme, tokens, CSS) | 1 | 2-3 days |
| 1 | Core component refinement | 16 files | 3-5 days |
| 2 | New components | 9 new files | 3-5 days |
| 3 | Layout & navigation | 5-8 files, routing | 3-5 days |
| 4 | Landing page | 1 major page | 2-3 days |
| 5 | Onboarding | 1 flow | 2-3 days |
| 6 | Dashboard | 1 major page | 2-3 days |
| 7 | Today's Plan | 1 page | 1-2 days |
| 8 | AI Study Plan Generator | 1 component | 1-2 days |
| 9 | Full Study Roadmap | 1 page | 2-3 days |
| 10 | AI Tutor | 2-3 components | 3-5 days |
| 11 | Vocabulary Notebook | 1 page | 2-3 days |
| 12 | Vocabulary Review | 1 page | 2-3 days |
| 13 | Saved Content | 1 new page | 1-2 days |
| 14 | Practice Pages | 6+ pages | 5-8 days |
| 15 | Mistake Review | 1 page | 1-2 days |
| 16 | Learning Progress | 1 page + sub-pages | 3-5 days |
| 17 | AI Progress Review | 1 page | 2-3 days |
| 18 | Settings | 1 page + sub-pages | 3-5 days |
| 19 | Extension Connection | 1 new page | 1 day |
| 20 | Empty/Loading/Error States | All pages audit | 2-3 days |
| 21 | Responsive & Mobile Polish | All pages audit | 3-5 days |
| 22 | Accessibility Audit | All pages audit | 2-3 days |
| 23 | Dark Mode Verification | All pages audit | 1-2 days |

**Total estimated effort**: 8-14 weeks for full implementation with one developer.

---

## Parallelization Opportunities

The following phases can be worked on in parallel by multiple developers:

| Track | Phases | Developer |
|-------|--------|-----------|
| Foundation | 0, 1, 2 | Dev A (design system) |
| Layout | 3, 21 | Dev B (layout + responsive) |
| Content Pages | 4, 5, 6, 7, 8, 9 | Dev C (dashboard + plans) |
| AI Features | 10, 17 | Dev D (AI Tutor) |
| Vocabulary | 11, 12, 13 | Dev E (vocabulary) |
| Practice | 14, 15 | Dev F (practice) |
| Progress | 16 | Dev G (progress) |
| Settings | 18, 19 | Dev H (settings) |
| Quality | 20, 22, 23 | All (after implementation) |

---

## Verification After Implementation

After completing each phase, run:

```bash
# TypeScript type check
npm run typecheck

# Lint check
npm run lint

# Unit tests
npm run test -- --related

# Build
npm run build

# Visual check
# Manual: open each redesigned page in browser (light + dark mode)
```

After all phases complete:

1. Full build (no errors)
2. All routes working (manual walkthrough)
3. Dark/light mode verified on all pages
4. Mobile layout verified on small screen (375px+)
5. Keyboard navigation verified
6. Screen reader tested (VoiceOver or NVDA)
7. Performance check (Lighthouse)
8. Export/import data verified

---

## Plan Status

This document is a **plan only**. No implementation has been performed based on this plan. All changes described above are recommendations for future implementation after design approval.

The implementation should begin with **Phase 0 (Foundation)** only after:
- All design documentation files are reviewed and approved
- Design token values are finalized
- Component system specs are approved
- Page wireframes or mockups are created (from the page spec documents)
- Development timeline and resources are allocated

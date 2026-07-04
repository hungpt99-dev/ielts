# Automation Roadmap: Consolidated Plan

> Consolidation of 6 automation design documents into a single phased roadmap.
> Covers: Explain & Simplify, Vocabulary Collection, Text Saving, Article Saving, Video Helper, Review Management.

---

## Overview

The goal is to minimize manual user effort across all features by introducing:

- **Auto-triggering** — features react to user behavior without explicit action
- **Background processing** — AI calls and saves offloaded from UI threads
- **Smart defaults** — AI-powered prediction of categories, topics, difficulty, metadata
- **One-click flows** — replace multi-step forms with single-action saves
- **Proactive intelligence** — passive scanning, queues, and adaptive scheduling

---

## Priority Matrix

| Priority | Feature Area | Rationale |
|----------|-------------|-----------|
| P0 | Background messaging & IndexedDB infrastructure | Foundation for all background processing, queues, and persistent cache |
| P0 | AI-powered category prediction (classifyText) | Unlocks one-click save across text, article, and vocabulary features |
| P1 | Auto-trigger explain on selection | Highest-frequency user action — saves clicks on every text selection |
| P1 | Auto-enrich vocabulary on word selection | Eliminates 4-5 steps from the most common vocabulary workflow |
| P1 | Automatic YouTube transcript fetching | Prerequisite for all video automation — removes the biggest friction point |
| P1 | Full-page content extraction | Prerequisite for one-click article saving |
| P2 | Background enrichment queue (vocabulary) | Enables save-first, enrich-later pattern |
| P2 | One-click save with auto-categorization (text) | Replaces 7-field form with single action |
| P2 | Parallel explain tab pre-fetching | Reduces wait time for multi-tab explain results |
| P2 | Simplify popup forms with auto-fill | AI pre-fills all fields — user only reviews |
| P3 | Passive vocabulary scanner | Proactive discovery without any user action |
| P3 | Auto-save articles/videos (opt-in) | Batch capture during browsing sessions |
| P3 | De-duplication across all stores | Prevents duplicates from auto-save and batch flows |
| P3 | Smart review prioritization | Cross-type priority scoring and unified queue |
| P4 | Session-based selection buffer | Batch save multiple selections |
| P4 | Adaptive queue sizing (reviews) | Time-aware card limits |
| P4 | Learning from user corrections | Heuristic weight adjustment from overrides |
| P4 | Web app dashboards (video library, article reader) | Rich views for saved content |

---

## Implementation Phases

### Phase 1: Foundation

**Goal**: Build the shared infrastructure that all automation features depend on.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 1.1 | Persistent IndexedDB cache with LRU eviction | `packages/ai/src/utils/cache.ts` | — |
| 1.2 | Background service worker messaging protocol | `apps/extension/src/background/messaging.ts` | — |
| 1.3 | AI text classification service (heuristic + AI) | `packages/ai/src/services/classify.ts`, `schemas/classify.ts`, `prompts/classify.ts` | — |
| 1.4 | Full-page content extraction utility | `apps/extension/src/content-script/saveSelectedText.ts` (GET_FULL_PAGE_CONTENT handler) | — |
| 1.5 | Settings/storage extensions for automation toggles | `apps/extension/src/storage/storage.ts` | — |
| 1.6 | YouTube transcript API client | `packages/ai/src/services/youtube.ts` | — |
| 1.7 | IELTS vocabulary tier lists (Tier 2 + Tier 3) | `packages/ai/src/data/ielts-vocab-tiers.ts` | — |
| 1.8 | Article schema extension (contentHtml, wordCount, readingTimeMinutes, etc.) | `extensionArticleSchema` in article store | — |
| 1.9 | Video entry schema extension (analysisStatus, rich metadata) | `videoEntrySchema` in video store | — |

**Risks**:
- IndexedDB migration may require version bumps across multiple stores (articles, video, vocabulary) — coordinate to avoid migration conflicts
- Background messaging protocol must handle content script → background → content script round-trips without race conditions
- YouTube transcript API is a third-party service (youtubetranscript.com) — no SLA, may need a fallback proxy

**Estimated effort**: Medium (4-6 weeks)

---

### Phase 2: One-Click Flows

**Goal**: Eliminate multi-step forms — most common actions become single-click or auto-triggered.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 2.1 | Auto-trigger explain panel on text selection | `content-script/selectionPanel.ts`, `aiExplain.ts` | 1.2 (messaging) |
| 2.2 | Auto-enrich vocabulary on single-word selection | `content-script/selectionPanel.ts`, `vocabulary.ts` | 1.1 (cache), 1.2 (messaging) |
| 2.3 | One-click "Quick Save" with auto-categorization | `content-script/selectionPanel.ts` (saveText action), `classify.ts` | 1.3 (classify) |
| 2.4 | Auto-fill article form on popup open | `popup/ArticleCollector.tsx` | 1.4 (content extraction), 1.8 (schema) |
| 2.5 | Auto-populate video form with transcript + metadata | `popup/VideoHelper.tsx`, `content-script/videoHelper.ts` | 1.6 (youtube), 1.9 (schema) |
| 2.6 | Simplified context menu: "Save to IELTS Journey" | `background/contextMenus.ts` | 1.3 (classify) |
| 2.7 | Auto-save vocabulary toggle + inline save button | `content-script/selectionPanel.ts`, `storage.ts` | 2.2 |
| 2.8 | Keyboard shortcuts (Cmd+Shift+S save, Cmd+Shift+A save article) | `background/index.ts` commands, `saveSelectedText.ts` | 1.2, 1.4 |

**Dependencies**: Phase 1 must be complete (infrastructure, classify, extraction).

**Risks**:
- Auto-trigger on selection may conflict with existing toolbar behavior — careful debouncing and user-configurable toggles needed
- AI classification latency may make one-click feel slow — must show optimistic UI with background refinement
- Keyboard shortcuts may conflict with page-level shortcuts — use `chrome.commands` with configurable keys

**Estimated effort**: Medium (4-5 weeks)

---

### Phase 3: Background Processing & Queues

**Goal**: Offload AI work from UI — users save immediately, analysis completes in background.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 3.1 | Background explain processing (EXPLAIN_TEXT handler) | `background/messaging.ts`, `aiExplain.ts` | 1.2 (messaging), 1.1 (cache) |
| 3.2 | Explain parallel pre-fetch with priority queue | `aiExplain.ts`, `explain.ts` | 3.1 |
| 3.3 | Vocabulary enrichment queue (persistent, concurrent) | `background/enrichmentQueue.ts`, `vocabulary.ts` | 1.2, 1.1 |
| 3.4 | Article enrichment (ENRICH_ARTICLE) + progressive save | `background/messaging.ts`, `enrichArticle.ts` | 1.2, 1.4 |
| 3.5 | Video analysis queue (4 job types per video) | `background/videoAnalysisQueue.ts` | 1.2, 1.6 |
| 3.6 | "Save & Analyze" consolidated video action | `popup/VideoHelper.tsx` | 3.5 |
| 3.7 | Background enrichment for batch-imported words | `vocabulary.ts`, `enrichmentQueue.ts` | 3.3 |

**Dependencies**: Phase 2 must be complete for the UI entry points that trigger these background processes.

**Risks**:
- Service worker lifecycle: Chrome may terminate idle service workers — use `chrome.runtime.connect` port to keep alive during long AI calls
- API rate limits: 3 concurrent AI calls max across all queues — enforce centrally in messaging layer
- Queue persistence: IndexedDB writes must be atomic per job — use transactions, handle partial failures
- Video analysis queue could be expensive (4 AI calls per video) — consider capping daily usage or requiring opt-in

**Estimated effort**: Large (6-8 weeks)

---

### Phase 4: Passive & Proactive Features

**Goal**: Features that work without explicit user action — discovery and capture happen automatically.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 4.1 | Passive vocabulary scanner (IELTS word detection) | `content-script/vocabScanner.ts` | 1.7 (word lists), 1.1 (de-dup check) |
| 4.2 | Session-based selection buffer with batch save | `content-script/selectionBuffer.ts` | 1.3 (classify) |
| 4.3 | Batch article capture mode (auto-extract on page visit) | `content-script/articleBuffer.ts` | 1.4 (extraction), 1.8 (schema) |
| 4.4 | Auto-save YouTube videos (opt-in, channel allowlist) | `content-script/videoHelper.ts` | 1.6 (transcript), 3.5 (queue) |
| 4.5 | Smart text pre-analysis for explain trigger heuristics | `content-script/selectionPanel.ts` | 2.1 |
| 4.6 | Language detection for Vietnamese explain pre-fetch | `content-script/selectionPanel.ts` | 2.1 |
| 4.7 | Topic inference from page content, URL, and domain | `vocabScanner.ts`, `videoHelper.ts` | — |

**Dependencies**: Phase 3 queues needed for batch background processing. Phase 2 one-click flows for the manual-trigger fallback.

**Risks**:
- Passive scanner on every page may impact performance — must use `requestIdleCallback` and limit DOM traversal
- Auto-save features may surprise users — all auto-save features must default to `false` (opt-in only)
- Selection buffer may grow unbounded — enforce max 50 entries with oldest-eviction
- Article auto-capture on non-article pages must be filtered out (word count < 100, no article element) to avoid noise

**Estimated effort**: Medium (4-5 weeks)

---

### Phase 5: Review & Learning Intelligence

**Goal**: Intelligent review scheduling, session management, and personalization.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 5.1 | CombinedReviewService — unified stats across 6 types | `packages/learning-engine/src/review-scheduler/CombinedReviewService.ts` | — |
| 5.2 | Priority scoring algorithm (overdue ×10 + low-rep + exam boost) | `CombinedReviewService.ts` | 5.1 |
| 5.3 | Smart Review mode — cross-type mixed session | `ReviewCenter.tsx`, `ReviewSession.tsx` | 5.1, 5.2 |
| 5.4 | Session checkpoint with auto-save and resume | `ReviewSession.tsx`, `ReviewSessionManager.ts` | — |
| 5.5 | Time-aware adaptive queue sizing | `CombinedReviewService.ts`, `VocabularyReview.tsx` | 5.1 |
| 5.6 | Proactive review badge with type breakdown | `components/ReviewBadge.tsx` | 5.1 |
| 5.7 | Quick-review sidebar widget (top 3 due items) | `components/QuickReviewPanel.tsx` | 5.1 |
| 5.8 | Graduated urgency notification scheduling | `ProactiveMessageEngine.ts`, `ReminderService.ts` | 5.1 |
| 5.9 | Session summary with performance feedback | `ReviewSummary.tsx` | 5.4 |
| 5.10 | Auto-redirect to review on app open (5+ due, >24h away) | `app.tsx`, `Dashboard.tsx` | 5.1 |
| 5.11 | Learning from user corrections (classification overrides) | `classificationStore.ts`, `classify.ts` | 1.3 |
| 5.12 | Optimal next-review-time prediction | `CombinedReviewService.ts` | 5.1, 5.9 |

**Dependencies**: Phase 1 foundation (storage, messaging) for service integration. Phase 2 one-click flows for the save-side data that feeds into review.

**Risks**:
- Priority scoring algorithm may need tuning — start with simple weights, add user-configurable sliders
- Session checkpoint with cross-device sync requires backend — Phase 5 scoped to single-device only; cross-device deferred
- Push notifications require Service Worker setup and user permission prompt — must handle permission-denied gracefully
- Learning from corrections requires sufficient data volume — cold start uses heuristics only until 50+ overrides collected

**Estimated effort**: Large (6-8 weeks)

---

### Phase 6: Dashboards & Rich Views

**Goal**: Surface saved content and analysis results with rich, interactive UIs.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 6.1 | Article reading view with rendered HTML | web app article detail page | 1.8 (schema), 1.4 (contentHtml) |
| 6.2 | Video library page with thumbnail grid | `apps/web/src/pages/VideoLibrary.tsx` | 1.9 (schema), 3.5 (queue results) |
| 6.3 | Video detail view with player, transcript, AI results | `apps/web/src/pages/VideoDetail.tsx` | 1.9, 3.5 |
| 6.4 | Saved videos list in popup | `popup/pages/SavedVideos.tsx` | 3.5 |
| 6.5 | Vocabulary enrichment status badges (pending/completed) | `VocabularyManager.tsx`, `WordForm.tsx` | 3.3 (queue) |
| 6.6 | Batch "Extract Vocabulary from Saved Text" action | `VocabularyCollector.tsx` | 3.3, 1.7 |
| 6.7 | Review streak indicator with milestone badges | `Dashboard.tsx` | 5.1 |
| 6.8 | Mini-review panel expandable from dashboard | `Dashboard.tsx` | 5.6 |

**Dependencies**: Phase 3 background processing must populate the data these dashboards display. Phase 5 review intelligence for the review-specific views.

**Risks**:
- Web app pages depend on extension-sourced data — ensure sync pipeline handles the data flow
- Video library with embedded YouTube player may have CORS/embedding restrictions for some videos
- Rich article reading view depends on `contentHtml` quality — extraction may break on some sites
- Popup is size-constrained (Chrome popup max ~600x600) — saved videos list must be compact with scroll

**Estimated effort**: Medium-Large (5-7 weeks)

---

### Phase 7: Polish & Hardening

**Goal**: Edge cases, error recovery, performance, and testing across all automation features.

| Task | Component | Files | Depends On |
|------|-----------|-------|------------|
| 7.1 | De-duplication across all stores (hash-based) | all store files, `saveSelectedText.ts` | All phases |
| 7.2 | Retry logic with exponential backoff for all AI calls | messaging handlers, queue processors | Phase 3 |
| 7.3 | Error recovery for partial queue failures | `enrichmentQueue.ts`, `videoAnalysisQueue.ts` | Phase 3 |
| 7.4 | Migration scripts for schema changes (DB version bumps) | articleStore, videoStore, vocabularyStore | Phase 1 |
| 7.5 | Performance optimization — batch IndexedDB reads | all stores | All phases |
| 7.6 | Rate limiting — enforce max AI calls per minute/hour | centralized in messaging layer | Phase 3 |
| 7.7 | Empty/error states for all dashboards and views | all UI components | Phase 6 |
| 7.8 | Accessibility audit for new UI components | all new UI | Phase 2, 5, 6 |
| 7.9 | Opt-out mechanisms for all auto-features | settings toggles | All phases |

**Dependencies**: All previous phases must be complete — this is a hardening pass.

**Risks**:
- De-duplication across stores (vocabulary, saved items, learning entries) may have false positives for short/common text — use 'normalized' strictness as default
- Migration scripts must handle edge cases: downgrades, partial migrations, concurrent tabs
- Rate limiting should be user-configurable but default to conservative limits (e.g., 30 AI calls/hour)

**Estimated effort**: Medium (3-4 weeks)

---

## Dependency Graph (Simplified)

```
Phase 1 (Foundation)
    │
    ├──► Phase 2 (One-Click Flows) ──► Phase 3 (Background Processing)
    │                                              │
    │                                              ├──► Phase 4 (Passive Features)
    │                                              └──► Phase 5 (Review Intelligence)
    │                                                                 │
    │                                                                 └──► Phase 6 (Dashboards)
    └────────────────────────────────────────────────────────────────────► Phase 7 (Polish)
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Chrome service worker idle timeout kills background jobs | High | High | Use connect() ports; keepalive pings; persist queue state to IndexedDB for resume |
| Third-party YouTube transcript API goes down | Medium | High | Cache transcripts locally; fallback to manual paste with clear messaging; consider self-hosted proxy |
| AI API costs increase with background enrichment | Medium | Medium | User-configurable AI budget; opt-in for auto-enrich; local heuristics as primary path |
| Passive scanner slows page load | Medium | Medium | requestIdleCallback only; min 2s delay; opt-in default off |
| Schema migration conflicts across stores | Low | High | Centralized migration registry; test all migration paths; support rollback |
| User confusion from auto-features doing "unexpected" saves | Medium | Medium | All auto-features default off; toast for every auto-save; undo support |

---

## Effort Summary by Phase

| Phase | Weeks | Dependencies | Key Deliverables |
|-------|-------|-------------|------------------|
| 1: Foundation | 4-6 | None | Cache, messaging, classify, extraction, schemas |
| 2: One-Click Flows | 4-5 | Phase 1 | Auto-trigger, auto-enrich, quick save, auto-fill |
| 3: Background Processing | 6-8 | Phase 2 | Enrichment/video/analysis queues, parallel pre-fetch |
| 4: Passive Features | 4-5 | Phase 2, 3 | Scanner, buffers, auto-capture, topic inference |
| 5: Review Intelligence | 6-8 | Phase 1 | Unified stats, priority scoring, session management |
| 6: Dashboards | 5-7 | Phase 3, 5 | Video library, article reader, badges |
| 7: Polish | 3-4 | All | De-dup, retry, migration, performance |

**Total estimated effort**: 32-43 weeks (full-time, single developer)

---

## Quick Wins (Can Ship Independently)

These items can be implemented and shipped without waiting for other phases:

1. **Keyboard shortcut for save** (Cmd+Shift+S) — pure binding, no AI dependency
2. **YouTube transcript auto-fetch** — standalone, dramatically improves video helper
3. **Auto-fill article form with content extraction** — reduces manual paste, no AI needed
4. **IELTS vocabulary tier lists** — prerequisites for scanner but independently useful
5. **Article/video schema extension** — adds fields without behavioral change, prepares for future

## Appendix: Feature Coverage by Document

| Original Document | Reference | Key Enhancements |
|-------------------|-----------|------------------|
| automation-explain-simplify.md | Phase 2, 3 | Auto-trigger, parallel pre-fetch, persistent cache, background offload |
| automation-vocabulary-collection.md | Phase 2, 3, 4 | Auto-enrich, enrichment queue, passive scanner, topic inference |
| automation-selected-text-saving.md | Phase 2, 4, 5 | AI classification, quick save, selection buffer, learning from overrides |
| automation-article-saving.md | Phase 1, 2, 4 | Content extraction, one-click save, batch capture, schema extension |
| automation-video-helper.md | Phase 1, 3, 4, 6 | Transcript fetch, analysis queue, auto-save, video dashboard |
| automation-review-management.md | Phase 5, 6 | Combined review stats, priority scoring, session checkpoint, adaptive queue |

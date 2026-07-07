# Documentation Cleanup Report

**Date:** 2026-07-07
**Scope:** All 56 documentation files in `docs/` and subdirectories

---

## Summary of Recommendations

| Action | Count | Files |
|--------|-------|-------|
| **Keep** | 36 | Core architectural, cross-cutting, and page specs |
| **Merge** | 7 | Files that are subsets of or overlap heavily with other docs |
| **Delete** | 0 | All files have some unique value |
| **Trim/Refactor** | 13 | Files with internal duplication or that should cross-reference instead |

---

## Files to Merge (7)

These should be consolidated into their parent docs and then deleted.

### 1. `docs/adr/0005-design-token-theme-system.md` → merge into `docs/redesign/shared-theme-design-tokens.md`
- **Rationale:** ADR 0005 is a 101-line architectural decision record. `shared-theme-design-tokens.md` (559 lines) is the full implementation spec covering every detail of the tokens. The ADR is redundant once the implementation spec exists. Move any unique decision rationale from the ADR into a section of the tokens doc.
- **Overlap:** 90%

### 2. `docs/features/proactive-ai-tutor.md` → merge into `docs/redesign/pages/ai-tutor-chat-spec.md`
- **Rationale:** Proactive AI Tutor (1044 lines) is a subsystem of the AI Tutor. Its data models, triggers, generators, and UI surfaces are tightly coupled to the AI Tutor chat spec (729 lines). These should be one document.
- **Overlap:** 70%

### 3. `docs/extension-loading.md` → merge into `docs/deployment.md`
- **Rationale:** Extension loading (133 lines) is purely operational: build, load unpacked, debug. This is a narrow subset of what `deployment.md` (338 lines) already covers (section 5).
- **Overlap:** 85%

### 4. `docs/extension-popup-tab-ui.md` → merge into `docs/extension-architecture.md`
- **Rationale:** 75 lines about one navigation pattern in one extension component. Belongs as a subsection of the master extension doc (1277 lines).
- **Overlap:** 90%

### 5. `docs/extension-saved-items-storage.md` → merge into `docs/extension-architecture.md`
- **Rationale:** 180 lines describing storage patterns that are already documented across sections 3, 4, 5, 7, 8, and 16 of the master extension doc.
- **Overlap:** 85%

### 6. `docs/user-content-storage.md` → merge into `docs/content-library.md`
- **Rationale:** Both cover user content models and APIs. `user-content-storage.md` (234 lines) duplicates `UserContentEdit`, `ContentMeta`, and search patterns from `content-library.md` (268 lines). A single "Content & User Content" doc is cleaner.
- **Overlap:** 75%

### 7. `docs/settings-sync-strategy.md` → merge into `docs/extension-architecture.md`
- **Rationale:** 181 lines describing a specific cross-cutting concern (extension↔web setting sync). This is a subsection of the extension architecture that covers the bridge protocol, sync flows, and conflict resolution.
- **Overlap:** 70%

---

## Files to Trim/Refactor (13)

These should be kept but have content trimmed to eliminate internal or cross-file duplication.

### 8. `docs/features.md` (754 lines)
- **Problem:** Each per-feature section duplicates the content of dedicated feature docs (exercise-system, content-library, learning-journey-engine, etc.).
- **Recommendation:** Reduce each section to 1-2 paragraphs with a "See X.md" cross-reference link.
- **Trim scope:** ~400 lines removed.

### 9. `docs/user-guide.md` (468 lines)
- **Problem:** Section 10 duplicates the entire `troubleshooting.md` (304 lines) with multiple troubleshooting tables.
- **Recommendation:** Remove section 10 and replace with a link to `troubleshooting.md`.
- **Trim scope:** ~80 lines removed.

### 10. `docs/storage-design.md` (300 lines)
- **Problem:** Lists all 27 IndexedDB stores (duplicating `database-schema.md`).
- **Recommendation:** Trim the store listing to a summary table; reference `database-schema.md` for details.
- **Trim scope:** ~50 lines removed.

### 11. `docs/security-privacy.md` (204 lines)
- **Problem:** Section about extension security duplicates content in `extension-architecture.md` section 9.
- **Recommendation:** Replace duplicated section with a cross-reference to the extension architecture doc.
- **Trim scope:** ~30 lines removed.

### 12. `docs/extension-architecture.md` (1277 lines)
- **Problem:** Already the master extension doc, but after absorbing 4 satellite docs (items #4, #5, #6, #7 above), it will grow. Sections on build/dev and security duplicate other docs.
- **Recommendation:** Trim build/dev (section 10) to a reference to `deployment.md`; trim security (section 9) to a reference to `security-privacy.md`. Use the absorbed content more concisely.

### 13. `docs/redesign/responsive-mobile-design-spec.md` (1561 lines)
- **Problem:** Per-page mobile layout sections duplicate what each individual page spec already covers.
- **Recommendation:** Keep only the general design principles, breakpoints, touch targets, and gestures. Remove per-page mobile sections (pages already have their own "Mobile Layout" sections).
- **Trim scope:** ~600 lines removed.

### 14. `docs/study-links-data-model.md` (182 lines)
- **Problem:** Split feature — data model here, user flows in a separate file. Valuable but should be unified post-implementation.
- **Recommendation:** Once the Study Links feature is shipped, merge this with `study-links-user-flows.md` into a single doc.

### 15. `docs/study-links-user-flows.md` (621 lines)
- **Problem:** Same as above — split feature doc.
- **Recommendation:** Merge with `study-links-data-model.md` post-implementation.

### 16. `docs/redesign/pages/practice-pages-spec.md` (1268 lines)
- **Problem:** Covers 6 distinct practice skills (Reading, Listening, Writing, Speaking, Grammar, Vocabulary Practice) in one massive file.
- **Recommendation:** Split into 6 individual files for maintainability.

### 17. `docs/redesign/pages/learning-progress-spec.md` (578 lines)
- **Problem:** Some chart/stat definitions overlap with `dashboard-spec.md` (skill progress, band progress, weekly chart).
- **Recommendation:** Remove duplicated chart sections from `dashboard-spec.md` and cross-reference here.

### 18. `docs/contribution-guide.md` (312 lines)
- **Problem:** Validation checklists and coding rules overlap with `ai-agent.md` (603 lines).
- **Recommendation:** Extract shared rules into a small shared reference file that both docs import/link to, preventing drift.

### 19. `docs/ai-agent.md` (603 lines)
- **Problem:** Same overlap with contribution guide.
- **Recommendation:** Same — extract shared rules.

### 20. `docs/redesign/shared-theme-design-tokens.md` (559 lines)
- **Problem:** After absorbing ADR 0005, ensure no duplicate content in the decision rationale section.

---

## Files to Keep As-Is (36)

These serve distinct purposes with acceptable levels of cross-referencing.

### Core Architecture (4)
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/architecture.md` | 807 | Master architectural reference — every other doc references it |
| `docs/local-first-design.md` | 214 | Philosophical anchor — explains WHY the architecture |
| `docs/database-schema.md` | 377 | Authoritative schema reference |
| `docs/storage-design.md` (after trim) | ~250 | Implementation layer (repositories, validation, errors) |

### Feature Docs (5)
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/exercise-system.md` | 304 | Strategy pattern implementations, scoring, difficulty |
| `docs/learning-journey-engine.md` | 289 | Service-by-service engine API and algorithms |
| `docs/ai-architecture.md` | 305 | Adapter pattern, prompt versioning, response validation |
| `docs/ai-generate-cache.md` | 203 | Narrow utility API reference — no overlap |
| `docs/ai-plan-roadmap.md` | 586 | Comprehensive roadmap feature — unique prompt/fallback |

### Cross-Cutting / Operations (8)
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/import-export.md` | 286 | Focused data portability reference |
| `docs/deployment.md` (after absorbing) | ~450 | Master deployment + extension loading guide |
| `docs/testing-strategy.md` | 323 | Definitive testing reference — no overlap |
| `docs/theme-system.md` | 298 | Only theme documentation |
| `docs/reminder-limitations.md` | 104 | Important constraints document |
| `docs/troubleshooting.md` | 304 | Authoritative troubleshooting reference |
| `docs/user-guide.md` (after trim) | ~388 | End-user documentation — different audience |
| `docs/security-privacy.md` (after trim) | ~174 | Safety review doc — different audience |

### ADRs (4)
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/adr/0001-local-first-no-backend.md` | 67 | Foundational architectural decision |
| `docs/adr/0002-indexeddb-storage.md` | 70 | Technical storage decision |
| `docs/adr/0003-openai-compatible-ai-provider.md` | 84 | AI architecture decision |
| `docs/adr/0004-browser-extension-manifest-v3.md` | 78 | Extension architecture decision |

### Redesign Cross-Cutting Specs (6)
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/redesign/information-architecture.md` | 711 | Route hierarchy and user flows |
| `docs/redesign/global-navigation-spec.md` | 641 | Pixel-level navigation implementation |
| `docs/redesign/component-system-spec.md` | 1075 | Central component inventory |
| `docs/redesign/accessibility-spec.md` | 828 | WCAG authority — prevents drift across page specs |
| `docs/redesign/empty-loading-error-states-spec.md` | 1005 | Central non-ideal state patterns |
| `docs/redesign/responsive-mobile-design-spec.md` (after trim) | ~960 | Core responsive rules |

### Redesign Page Specs (14) — all kept
| File | Lines | Why Keep |
|------|-------|----------|
| `docs/redesign/pages/landing-page-spec.md` | 551 | Marketing/narrative content — unique |
| `docs/redesign/pages/dashboard-spec.md` | 613 | Aggregation hub — unique aggregation logic |
| `docs/redesign/pages/today-study-plan-spec.md` | 560 | Execution view of daily tasks |
| `docs/redesign/pages/full-study-roadmap-spec.md` | 726 | Long-term timeline visualization |
| `docs/redesign/pages/learning-progress-spec.md` | 578 | Deep analytics hub |
| `docs/redesign/pages/ai-progress-review-spec.md` | 1188 | AI narrative generation — unique |
| `docs/redesign/pages/ai-tutor-chat-spec.md` (after absorbing) | ~1773 | Central AI Tutor — massive scope |
| `docs/redesign/pages/practice-pages-spec.md` | 1268 | (Consider splitting into 6 files) |
| `docs/redesign/pages/vocabulary-review-spec.md` | 925 | Spaced repetition UX — unique |
| `docs/redesign/pages/vocabulary-notebook-spec.md` | 596 | Browsing/management UX — unique |
| `docs/redesign/pages/mistake-review-spec.md` | 1076 | Mistake workflow + pattern detection |
| `docs/redesign/pages/saved-content-spec.md` | 778 | Content-to-learning-action pipeline |
| `docs/redesign/pages/settings-spec.md` | 380 | Centralized configuration hub |
| `docs/redesign/pages/onboarding-spec.md` | 561 | Step-by-step wizard — unique |
| `docs/redesign/pages/extension-connection-spec.md` | 695 | Extension ecosystem — unique |
| `docs/redesign/pages/study-links-data-model.md` | 182 | (Merge post-implementation) |
| `docs/redesign/pages/study-links-user-flows.md` | 621 | (Merge post-implementation) |

---

## Overall Statistics

| Metric | Current | After Cleanup |
|--------|---------|---------------|
| Total files | 56 | 51 (5 fewer after merges) |
| Total lines | ~22,500 | ~20,000 (after trims) |
| Merge operations | — | 7 merges (sources deleted) |
| Trim operations | — | 6 files trimmed |
| Pure keeps | — | 36 files untouched |

## Recommended Execution Order

1. **Merge** satellite docs into their parents (extension files, ADR 0005, proactive-ai-tutor, user-content-storage)
2. **Delete** the 7 source files after merging
3. **Trim** `features.md`, `user-guide.md`, `storage-design.md`, `security-privacy.md`, `extension-architecture.md`, `responsive-mobile-design-spec.md`
4. **Split** `practice-pages-spec.md` into 6 files (optional)
5. **Extract** shared rules from `contribution-guide.md` and `ai-agent.md` (optional)
6. **Merge** study-links files post-implementation (future)

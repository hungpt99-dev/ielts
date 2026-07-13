# Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Data loss during storage consolidation** | Medium | High — user progress, mistakes, vocabulary lost | Phase 5 requires backward-compatible reads. Export/Import feature as safety net. Migration tests with `fake-indexeddb`. |
| **Duplicate outcomes recorded** (both old and new code path produce results) | Medium | Medium — confusing progress data | Feature flags per phase. Log which code path produced each outcome. Remove old path before finalizing. |
| **Duplicate progress tracking** (extension and web both update progress) | High | Medium — inconsistent learner context | Single event bus for progress updates. Extension sends events, does not update progress directly. |
| **Circular dependencies** (engine ↔ engine via events) | Low | High — compile/runtime errors | Event bus decouples engines. Events are data-only, no function references. Enforce dependency direction in `tsconfig.json`. |
| **AI regressions** (migration breaks existing AI interactions) | Medium | High — user-facing quality regression | AI evaluation tests with mocked responses. Canary release for Phase 4. Compare output of old and new paths. |
| **Offline regressions** (service worker or IndexedDB changes break offline mode) | Medium | High — app becomes unusable offline | Offline integration test (mock service worker, verify engine operations without network). Phase by phase — keep old storage until new one is verified. |
| **Extension drift** (extension and web get out of sync during migration) | High | Medium — inconsistent UX | Shared package versions. Extension follows same migration phases but on a delay. Compatibility layer during transition. |
| **Migration failures** (Dexie schema migration fails) | Medium | High — app fails to load | `initDb` has retry logic. Schema versioning with rollback support. Console logging for debugging. |
| **Performance regressions** (additional abstraction layers slow down AI calls) | Low | Medium — slower responses | Benchmark AI call latency before/after. Keep adapter layer thin. Cache AI responses where appropriate. |
| **Bundle-size growth** (consolidation adds adapter code before legacy code is removed) | Medium | Low — temporary bloat | Track bundle size in CI. Remove legacy code in same release or next release. Tree-shake unused exports. |

## Risk Response Summary

| Response type | Count | Risk IDs |
|---|---|---|
| **Accept** | 1 | Bundle-size growth (temporary) |
| **Mitigate** | 7 | Data loss, duplicate outcomes, duplicate progress, circular deps, AI regressions, offline regressions, migration failures |
| **Monitor** | 2 | Extension drift, performance regressions |

## Contingency Triggers

- **Data loss**: Revert Phase 5 immediately. Restore from export.
- **AI regression**: Fall back to heuristic evaluation (Phase 4 feature flag off).
- **Migration crash**: `initDb` should catch and report, not crash. If crash occurs, use localStorage recovery hint.

# ADR 0004: Browser Extension with Manifest V3

**Date:** 2026-07-01
**Status:** Accepted
**Decision:** Build the browser extension using Chrome Manifest V3 with minimal permissions and isolated content scripts.

---

## Context

The project needs a browser extension to allow users to collect English learning content from any webpage:
- Save vocabulary, phrases, and sentences
- Save full pages for reading practice
- Extract YouTube transcripts for listening practice
- AI-powered text explanation and simplification
- Dictionary popup on double-click

### Requirements

- **Privacy-first:** No browsing history collection
- **Minimal permissions:** Only what's absolutely needed
- **Modern extension API:** Manifest V3 (current Chrome standard)
- **Works without backend:** All data stored locally
- **Shares data with web app:** Via storage bridge

## Decision

Use **Manifest V3** with these key design choices:

### Architecture
- **Service worker** (non-persistent background script)
- **Isolated world** content scripts
- **React popup** for quick actions
- **React options page** for settings

### Permissions (Minimal)
- `activeTab` — Only on user action
- `contextMenus` — Right-click save
- `storage` — Local settings
- `alarms` — Daily review reminders
- `scripting` — Content script injection

### Storage Strategy
- Extension-scoped IndexedDB (`ielts-journey-extension`)
- `chrome.storage.local` for settings and API key
- Bridge protocol (`window.postMessage`) for website sync

## Consequences

### Positive

- **Modern API:** MV3 is the current standard, guaranteed support
- **Better security:** Isolated worlds, no eval(), no remote code
- **Minimal permissions:** Users can see exactly what the extension accesses
- **Privacy-respecting:** No background page, no network requests except to user's AI endpoint
- **Shared packages:** Extension reuses `packages/ai`, `packages/storage`, `packages/theme`

### Negative

- **Service worker lifecycle:** Non-persistent, may be killed by browser (mitigated by re-initialization on messages)
- **IndexedDB origin binding:** Extension and website cannot directly share DB (mitigated by bridge protocol)
- **No `chrome.downloads` in service worker:** Must use tabs API for downloads
- **MV3 restrictions:** No `eval()`, no remote code, no binary blob scripts

## Bridge Protocol

Since IndexedDB is origin-bound, we use `window.postMessage`:

```
Extension Content Script → (postMessage) → Website Page → Website IndexedDB
```

This enables dual-write when the website tab is open, falling back to extension-only storage when closed.

## Related

- [Extension Architecture](../extension-architecture.md)
- [ADR 0002: IndexedDB Storage](0002-indexeddb-storage.md)

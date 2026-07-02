# ADR 0001: Local-First, No Backend

**Date:** 2026-07-01
**Status:** Accepted
**Decision:** All application data is stored locally in the browser. No server-side backend is implemented.

---

## Context

The IELTS Learning Journey is a personal study tool. We considered two architectures:

1. **Backend architecture:** Server-side database + API + client app
2. **Local-first architecture:** All data stored in browser IndexedDB, no backend

### Requirements

- User data must remain private and under user control
- Core features must work offline
- No ongoing server infrastructure costs
- Simple deployment (static hosting only)
- Privacy-conscious users should feel safe

## Decision

We choose **local-first, no backend**.

All data:
- Stays in the user's browser (IndexedDB + localStorage)
- Is never transmitted to any server
- Can be exported/imported by the user for backup or transfer
- Is destroyed when the user clears browser data

## Consequences

### Positive

- **Maximum privacy:** No data leaves the device unless user explicitly triggers AI
- **Offline capability:** Core features work without internet
- **Zero infrastructure cost:** Deploy as static files
- **Simple deployment:** Any static host (Vercel, Netlify, GitHub Pages)
- **No accounts:** No email, password, or personal info needed
- **No compliance overhead:** No GDPR, CCPA concerns for user data

### Negative

- **No cross-device sync:** Data stays on one device (mitigated by JSON export/import)
- **No cloud backups:** User must manage their own backups
- **No collaboration:** Only single-user (acceptable for a personal study tool)
- **Storage limits:** Browser may evict IndexedDB under pressure
- **No push notifications:** Reminders only work while app is open (mitigated by extension alarms)

## Alternatives Considered

### Backend (Node.js + PostgreSQL)
- Rejected because: privacy concerns, infrastructure cost, complexity, offline requirement

### Backendless (Firebase, Supabase)
- Rejected because: vendor lock-in, data stored on third-party servers, potential cost scaling

### Hybrid (local-first + optional sync)
- Rejected for initial version: added complexity. Could be added later as opt-in feature.

## Related

- [ADR 0002: IndexedDB Storage](0002-indexeddb-storage.md)
- [Local-First Design](../local-first-design.md)

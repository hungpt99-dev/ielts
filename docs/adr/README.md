# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the IELTS Journey project.

## Extension-Specific ADRs

These ADRs document decisions specific to the Chrome extension:

- **001-youtube-dom-isolation** — Why the extension uses DOM isolation for YouTube page interaction (content script isolation from page scripts).
- **002-transcript-provider-abstraction** — Why transcript fetching is abstracted behind a provider interface (supports YouTube JSON3 and future sources).
- **003-local-first-persistence** — Why the extension prioritizes local-first data storage with optional sync (offline resilience, user privacy).

## Project-Wide ADRs

For project-wide ADRs (e.g., architectural decisions affecting both web and extension), create new records in this directory following the naming convention:

```
NNN-title-in-kebab-case.md
```

### ADR Template

```markdown
# NNN: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context

What is the issue motivating this decision?

## Decision

What is the change being proposed?

## Consequences

Why this is a good/bad decision. Trade-offs, risks, and migration effort.

## Compliance

How to verify the decision is followed (lint rules, tests, code review checklist).
```

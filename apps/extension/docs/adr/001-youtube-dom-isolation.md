# ADR 001: YouTube DOM Isolation

## Status
Accepted

## Context
The YouTube Learning feature needs to interact with YouTube's DOM to detect video changes, read captions, and inject UI elements. YouTube frequently changes its DOM structure through A/B testing and redesigns.

## Decision
All YouTube DOM interaction is isolated behind the `YouTubeAdapter` interface:
- All CSS selectors are defined in `YouTubeSelectors.ts` as a single source of truth
- Multiple fallback selectors are provided for each important element
- `YouTubeDOMObserver` handles SPA navigation through multiple mechanisms (MutationObserver, yt-navigate events, URL polling)
- No React component or application service directly queries YouTube's DOM

## Consequences
- YouTube DOM changes only require updating selectors in one file
- The adapter can be mocked for testing
- Error boundaries can provide graceful degradation when selectors fail
- Slightly more indirection, but significantly improved maintainability

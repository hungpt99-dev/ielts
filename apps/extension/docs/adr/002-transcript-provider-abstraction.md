# ADR 002: Transcript Provider Abstraction

## Status
Accepted

## Context
YouTube provides captions through multiple channels: initial player response JSON, __INITIAL_STATE__ window variable, and the captions API. Different videos have different formats (manual vs auto-generated). The transcript acquisition logic must be resilient and support fallback.

## Decision
Create a `YouTubeTranscriptProvider` class that encapsulates all transcript acquisition logic:
- Multiple extraction strategies tried in order: ytInitialPlayerResponse → __INITIAL_STATE__ → API fetch
- Language preference selection with configurable priority
- Content hashing for caching decisions
- Explicit available/unavailable states (no silent failures)

## Consequences
- Adding new extraction strategies requires no changes to callers
- Transcript availability can be checked without downloading full content
- Caching decisions are based on content hash, not video ID alone
- Callers receive typed `TranscriptData` objects regardless of source format

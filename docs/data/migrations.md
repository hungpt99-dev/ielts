# Migrations

## Overview

IndexedDB schema migrations are defined declaratively in `APP_SCHEMA` (`packages/storage/src/migrations.ts`). Each schema version lists all stores with their Dexie index definitions. The migration runner applies pending versions sequentially.

## Version History

| Version | Tables Added | Cumulative Count |
|---|---|---|
| 1 | 14 (vocabulary, vocabularyReviews, tasks, 4 session tables, 2 practice tables, writingSessions, speakingSessions, grammarNotes, mistakes, mockTests, topicsProgress, passages) | 14 |
| 2 | 11 (ieltsTopics, exampleSentences, readingPassages, listeningTranscripts, writingPrompts, speakingQuestions, studyNotes, customStudyPlans, usefulPhrases, aiContents, progressRecords) | 25 |
| 3 | 1 (publicApiContent) | 26 |
| 4 | 2 (contentMeta, userContentEdits) | 28 |
| 5 | 4 (speakingExercises, writingExercises, readingExercises, listeningExercises) | 32 |
| 6 | 1 (artifacts) | 33 |
| 7 | 1 (learningEvents) | 34 |
| 8 | 19 (youtubeVideos, transcripts, videoAnalyses, videoVocabularySources, savedSentences, timestampedNotes, learningPlaylists, playlistItems, videoStudySessions, studyActivities, youtubeExercises, exerciseAttempts, dictationAttempts, shadowingAttempts, speakingAttempts, summaryAttempts, tutorInterventions, aiGenerationCache, channelEvaluations) | 47 |

## Migration Mechanism

1. `applyMigrations()` is called at app startup.
2. It reads the applied version from localStorage key `'ielts-db-version'`.
3. Filters `APP_SCHEMA.versions` for pending migrations (`appliedVersion < version <= CURRENT_DB_VERSION`).
4. Executes each pending version's `upgrade()` handler (if defined).
5. Persists the new version to localStorage after each migration.
6. Dexie's built-in `version()` API handles the actual IndexedDB schema changes.

## Custom Upgrade Handlers

Most versions rely on Dexie's declarative schema — stores are created/dropped automatically. Custom `upgrade()` handlers are available for data transformation (e.g., v1→v2 data migrations that populate new indexes).

## Version Tracking

- `CURRENT_DB_VERSION = 8` (constant).
- Applied version persisted to `localStorage` key `'ielts-db-version'`.
- `getAppliedVersion()` / `setAppliedVersion()` read/write this cursor.
- `clearAppliedVersion()` resets it (for re-migration in development).

## Error Handling

- If a migration fails, `MigrationError` is thrown with the failing version number and cause.
- The migration stops at the failed version; subsequent startups will retry.
- Dexie transaction rollback applies on failure.

## Best Practices

- Store definitions must be repeated in full for every version (Dexie requires the complete schema for each version declaration).
- New tables should only add stores, never remove or rename existing ones.
- Index changes only affect new entries; existing entries are re-indexed on read.

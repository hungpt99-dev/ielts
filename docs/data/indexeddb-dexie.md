# IndexedDB / Dexie

## Overview

The primary structured data store. Database name: `'ielts-journey'`. Managed by Dexie through the `@ielts/storage` package.

## Schema Versions

Current version: **9**. The schema is defined in `APP_SCHEMA` (`packages/storage/src/migrations.ts`).

### v1 (initial)
`vocabulary`, `vocabularyReviews`, `tasks`, `readingSessions`, `readingPracticeSessions`, `listeningSessions`, `listeningPracticeSessions`, `writingSessions`, `speakingSessions`, `grammarNotes`, `mistakes`, `mockTests`, `topicsProgress`, `passages`

### v2
Added: `ieltsTopics`, `exampleSentences`, `readingPassages`, `listeningTranscripts`, `writingPrompts`, `speakingQuestions`, `studyNotes`, `customStudyPlans`, `usefulPhrases`, `aiContents`, `progressRecords`

### v3
Added: `publicApiContent`

### v4
Added: `contentMeta`, `userContentEdits`

### v5
Added: `speakingExercises`, `writingExercises`, `readingExercises`, `listeningExercises`

### v6
Added: `artifacts`

### v7
Added: `learningEvents`

### v8
Added: `youtubeVideos`, `transcripts`, `videoAnalyses`, `videoVocabularySources`, `savedSentences`, `timestampedNotes`, `learningPlaylists`, `playlistItems`, `videoStudySessions`, `studyActivities`, `youtubeExercises`, `exerciseAttempts`, `dictationAttempts`, `shadowingAttempts`, `speakingAttempts`, `summaryAttempts`, `tutorInterventions`, `aiGenerationCache`, `channelEvaluations`

### v9
Consolidated: all 47 stores redefined under a single version for clean schema alignment.

**Total tables across all versions: 47**

## Repository Classes

Each table has a corresponding `BaseRepository<T>` subclass:

| Repository | Table |
|---|---|
| `VocabularyRepository` | vocabulary |
| `VocabReviewRepository` | vocabularyReviews |
| `TaskRepository` | tasks |
| `ReadingSessionRepository` | readingSessions |
| `ListeningSessionRepository` | listeningSessions |
| `WritingSessionRepository` | writingSessions |
| `SpeakingSessionRepository` | speakingSessions |
| `ReadingPracticeSessionRepository` | readingPracticeSessions |
| `ListeningPracticeSessionRepository` | listeningPracticeSessions |
| `GrammarNoteRepository` | grammarNotes |
| `MistakeRepository` | mistakes |
| `MockTestRepository` | mockTests |
| `ProgressRecordRepository` | progressRecords |
| `TopicProgressRepository` | topicsProgress |
| `AiContentRepository` | aiContents |
| `CustomStudyPlanRepository` | customStudyPlans |
| `ContentMetaRepository` | contentMeta |
| `UserContentEditRepository` | userContentEdits |
| `ArtifactRepository` | artifacts |
| `IeltsTopicRepository` | ieltsTopics |
| `ExampleSentenceRepository` | exampleSentences |
| `ReadingPassageRepository` | readingPassages |
| `ListeningTranscriptRepository` | listeningTranscripts |
| `WritingPromptRepository` | writingPrompts |
| `SpeakingQuestionRepository` | speakingQuestions |
| `StudyNoteRepository` | studyNotes |
| `UsefulPhraseRepository` | usefulPhrases |
| `PassageEntryRepository` | passages |
| `PublicApiContentRepository` | publicApiContent |
| `SpeakingExerciseRepository` | speakingExercises |
| `WritingExerciseRepository` | writingExercises |
| `ReadingExerciseRepository` | readingExercises |
| `ListeningExerciseRepository` | listeningExercises |
| `YouTubeVideoRepository` | youtubeVideos |
| `TranscriptRepository` | transcripts |
| `VideoAnalysisRepository` | videoAnalyses |
| `VideoVocabularySourceRepository` | videoVocabularySources |
| `SavedSentenceRepository` | savedSentences |
| `TimestampedNoteRepository` | timestampedNotes |
| `LearningPlaylistRepository` | learningPlaylists |
| `PlaylistItemRepository` | playlistItems |
| `VideoStudySessionRepository` | videoStudySessions |
| `StudyActivityRepository` | studyActivities |
| `ExerciseRepository` (youtube) | youtubeExercises |
| `ExerciseAttemptRepository` | exerciseAttempts |
| `DictationAttemptRepository` | dictationAttempts |
| `ShadowingAttemptRepository` | shadowingAttempts |
| `SpeakingAttemptRepository` | speakingAttempts |
| `SummaryAttemptRepository` | summaryAttempts |
| `TutorInterventionRepository` | tutorInterventions |
| `AIGenerationCacheRepository` | aiGenerationCache |
| `ChannelEvaluationRepository` | channelEvaluations |

## Key Exported Functions

| Function | Purpose |
|---|---|
| `initDb()` | Open or create the database |
| `getDb()` | Get the current database instance |
| `destroyDb()` | Close and destroy the database |
| `isDbOpen()` | Check connection state |
| `safeDb(fn)` | Execute DB operation with error handling and auto-reconnect |
| `TABLE_NAMES` | Array of all table name strings |

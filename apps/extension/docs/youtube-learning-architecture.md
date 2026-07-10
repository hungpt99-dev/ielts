# YouTube Learning - Architecture Overview

## Design Decisions

### Layered Feature Architecture
The YouTube Learning feature follows a layered architecture with clear separation of concerns:

- **Infrastructure Layer**: YouTube DOM integration, persistence, audio recording, AI communication
- **Application Layer**: Use cases, services, commands, queries
- **Domain Layer**: Entities, value objects, repositories (interfaces), events
- **Presentation Layer**: React components, hooks, styles

### YouTube DOM Isolation
All YouTube DOM selectors are isolated in `YouTubeSelectors.ts`. No React component or application service directly queries YouTube's DOM. This provides:
- Resilience against YouTube DOM changes
- Testability through adapter mocking
- Clean error boundaries

### Transcript Provider Abstraction
The `YouTubeTranscriptProvider` abstracts transcript acquisition:
- Supports manual and auto-generated captions
- Multiple fallback strategies (ytInitialPlayerResponse, __INITIAL_STATE__, etc.)
- Language preference selection
- Content hashing for caching

### Local-First Persistence
All user data is stored locally in IndexedDB via the existing Dexie layer:
- YouTube-specific tables added in migration v8
- Schemas validated with Zod at the repository boundary
- Same BaseRepository pattern used throughout the app
- Data accessible from both extension and web app contexts

### AI Schema Validation
All AI responses are validated with Zod schemas before use:
- Protects against malformed AI output
- Provides safe fallback behavior
- Enables deterministic exercise generation when AI is unavailable

## File Structure

```
youtube-learning/
  application/
    services/
      LearningSessionService.ts   - Study session lifecycle
      VocabularyService.ts         - Word management and lookup
      NoteService.ts              - Timestamped notes CRUD
      AIAnalysisService.ts        - Video analysis and difficulty
      ExerciseService.ts          - Exercise generation and scoring
      DictationService.ts          - Dictation comparison and tracking
  domain/
    events/
      LearningEventBus.ts          - Typed event system
  infrastructure/
    youtube/
      YouTubeAdapter.ts            - Main YouTube integration facade
      YouTubePageDetector.ts       - Video ID/URL parsing
      YouTubeDOMObserver.ts        - SPA navigation handling
      YouTubePlayerController.ts   - Playback control
      YouTubeTranscriptProvider.ts - Caption acquisition
      YouTubeLayoutManager.ts      - Panel injection and layout
      FocusMode.ts                 - Distraction hiding
      YouTubeSelectors.ts          - DOM selector constants
    persistence/
      StorageAdapter.ts            - Chrome storage + web app bridge
    audio/
      AudioRecorderAdapter.ts      - MediaRecorder wrapper
    browser/
      BrowserMessaging.ts          - Typed message passing
    ai/
      AIAdapter.ts                 - AI API client
  presentation/
    App.tsx                        - Main panel UI (React)
    main.tsx                       - React entry point
  schemas/
    messages.ts                    - Message validation schemas
  tests/
    unit-tests.test.ts             - Unit tests
```

## Database Changes (Migration v8)

New tables added in version 8:

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| youtubeVideos | YouTube video metadata | videoId |
| transcripts | Transcript data with segments | videoId |
| videoAnalyses | Analysis results | videoId |
| videoVocabularySources | Vocabulary-video associations | vocabularyId, videoId |
| savedSentences | User-saved subtitle sentences | videoId |
| timestampedNotes | Notes linked to video timestamps | videoId |
| learningPlaylists | User-created playlists | - |
| playlistItems | Playlist-video associations | playlistId, videoId |
| videoStudySessions | Study session tracking | videoId, startTime |
| studyActivities | Activity log entries | sessionId, videoId |
| youtubeExercises | Generated exercises | videoId |
| exerciseAttempts | Exercise attempt records | exerciseId, videoId |
| dictationAttempts | Dictation practice records | videoId |
| shadowingAttempts | Shadowing practice records | videoId |
| speakingAttempts | Speaking practice records | videoId |
| summaryAttempts | Summary challenge records | videoId |
| tutorInterventions | AI Tutor messages | sessionId, videoId |
| aiGenerationCache | AI result cache | cacheKey, videoId |
| channelEvaluations | Channel analysis results | channelId |

## Message Contracts

### Content Script → Panel (iframe)

```
VIDEO_INFO, TIME_UPDATE, TRANSCRIPT_AVAILABLE, TRANSCRIPT_DATA,
TRANSCRIPT_UNAVAILABLE, FOCUS_MODE, AI_CONFIGURED, LEARNING_EVENT,
LEARNING_MODE_STATE, NOTES_DATA, START_PRACTICE
```

### Panel (iframe) → Content Script

```
PANEL_READY, TOGGLE_LEARNING_MODE, TOGGLE_FOCUS_MODE, REQUEST_TRANSCRIPT,
REQUEST_NOTES, CREATE_NOTE, DELETE_NOTE, SEEK_TO, START_DICTATION,
START_SHADOWING, START_SPEAKING, START_EXERCISES, START_SUMMARY,
START_LISTENING_SIM
```

## Privacy Model

- All learning data stored locally in IndexedDB (no cloud)
- Transcripts only sent to AI on explicit user action
- Camera/microphone only requested when user starts recording
- AI API key kept in extension storage (chrome.storage.local), never exposed to page context
- Audio recordings stored with retention limits and manual deletion controls
- Analytics events emitted only when enabled in settings, never include transcript text or recordings

## Known YouTube Platform Limitations

1. Transcript format varies by video (manual vs auto-generated, different XML structures)
2. Auto-generated captions may have timing inaccuracies
3. YouTube SPA navigation doesn't fire standard events - requires MutationObserver + yt-navigate-* events
4. Theatre mode and full-screen affect panel positioning
5. Miniplayer mode detaches the video element from the main document
6. YouTube A/B tests may change DOM structure unpredictably

## Testing Strategy

- **Unit tests**: Pure function testing (video ID parsing, timestamp formatting, dictation comparison, etc.)
- **Repository tests**: In-memory Dexie with fake-indexeddb
- **Component tests**: React Testing Library for panel components
- **Integration tests**: Mocked content script ↔ panel communication
- **E2E tests**: Playwright on actual YouTube pages (requires test fixtures)

## Adding a New Video Platform

To add support for another platform (e.g., Vimeo, Coursera):
1. Create a new adapter class implementing the same interface as `YouTubeAdapter`
2. Create a new DOM observer for the platform's navigation patterns
3. Create a new transcript provider for its subtitle format
4. Add platform detection to `YouTubePageDetector`
5. Register the adapter in the content script initialization

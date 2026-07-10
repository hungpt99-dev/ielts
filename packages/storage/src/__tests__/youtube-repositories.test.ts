import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'

import {
  YouTubeVideoRepository,
  TranscriptRepository,
  SavedSentenceRepository,
  TimestampedNoteRepository,
  LearningPlaylistRepository,
  PlaylistItemRepository,
  VideoStudySessionRepository,
  DictationAttemptRepository,
  ExerciseRepository,
} from '../youtube-repositories'

import type {
  YouTubeVideo, Transcript, SavedSentence, TimestampedNote,
  LearningPlaylist, PlaylistItem, VideoStudySession,
  DictationAttempt, Exercise,
} from '../youtube-schemas'

import { EntityNotFoundError } from '../errors'

const YOUTUBE_TABLES = [
  'youtubeVideos', 'transcripts', 'savedSentences', 'timestampedNotes',
  'learningPlaylists', 'playlistItems', 'videoStudySessions',
  'dictationAttempts', 'youtubeExercises',
]

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearYouTubeTables() {
  const db = getDb()
  for (const table of YOUTUBE_TABLES) {
    await db.table(table).clear()
  }
}

function isoNow(): string {
  return new Date().toISOString()
}

function makeVideo(overrides: Partial<YouTubeVideo> = {}): Omit<YouTubeVideo, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', title: 'Test Video', channelName: 'IELTS Channel',
    channelUrl: '', duration: 600, thumbnailUrl: '', description: '',
    tags: [], transcriptLanguage: 'en', transcriptSource: 'auto-generated',
    cefrLevel: 'B1', ieltsLevel: '5.0-6.0', speakingSpeed: 150,
    accent: 'american', topicCategories: [], advancedWordCount: 5,
    recommendedLevel: 'intermediate', mainChallenges: [], estimatedStudyMinutes: 30,
    analysisVersion: '', analysisTranscriptHash: '', subtitleAvailability: 'available',
    createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<YouTubeVideo, 'id'>
}

function makeTranscript(overrides: Partial<Transcript> = {}): Omit<Transcript, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', language: 'en', source: 'auto-generated',
    segments: [], contentHash: '', fullText: '', wordCount: 0, fetchedAt: now,
    ...overrides,
  } as Omit<Transcript, 'id'>
}

function makeSavedSentence(overrides: Partial<SavedSentence> = {}): Omit<SavedSentence, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', text: 'Saved sentence.', startTimestamp: 0, endTimestamp: 5,
    videoTitle: 'Test', videoUrl: '', transcriptLanguage: 'en',
    selectedVocabulary: [], userNote: '', tags: [], isFavorite: false,
    createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<SavedSentence, 'id'>
}

function makeTimestampedNote(overrides: Partial<TimestampedNote> = {}): Omit<TimestampedNote, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', text: 'A note.', timestamp: 30, transcriptSegmentId: '',
    transcriptText: '', category: 'personal-note', tags: [], videoTitle: 'Test',
    videoUrl: '', isFavorite: false, createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<TimestampedNote, 'id'>
}

function makePlaylist(overrides: Partial<LearningPlaylist> = {}): Omit<LearningPlaylist, 'id'> {
  const now = isoNow()
  return {
    name: 'My Playlist', description: '', playlistType: 'custom', videoIds: [],
    goal: '', status: 'planned', isFavorite: false, createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<LearningPlaylist, 'id'>
}

function makePlaylistItem(overrides: Partial<PlaylistItem> = {}): Omit<PlaylistItem, 'id'> {
  return {
    playlistId: 'pl-1', videoId: 'vid-1', sortOrder: 0, personalNote: '',
    status: 'planned', addedAt: isoNow(),
    ...overrides,
  } as Omit<PlaylistItem, 'id'>
}

function makeStudySession(overrides: Partial<VideoStudySession> = {}): Omit<VideoStudySession, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', startTime: now, activeStudyDuration: 0, watchDuration: 0,
    wordsViewed: 0, wordsSaved: 0, sentencesSaved: 0, notesCreated: 0,
    exercisesAttempted: 0, exerciseScores: [], dictationAccuracy: 0,
    speakingAttempts: 0, shadowingAttempts: 0, summaryAttempts: 0,
    tutorInterventions: 0, isCompleted: false, createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<VideoStudySession, 'id'>
}

function makeDictationAttempt(overrides: Partial<DictationAttempt> = {}): Omit<DictationAttempt, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', sentence: 'The quick brown fox.', userInput: '',
    normalizedUserInput: '', normalizedCorrect: '', startTimestamp: 0,
    endTimestamp: 5, accuracy: 0, insertedWords: [], missingWords: [],
    incorrectWords: [], hintsUsed: 0, replayCount: 0, timeSpentSeconds: 0,
    isDifficult: false, createdAt: now,
    ...overrides,
  } as Omit<DictationAttempt, 'id'>
}

function makeExercise(overrides: Partial<Exercise> = {}): Omit<Exercise, 'id'> {
  const now = isoNow()
  return {
    videoId: 'vid-1', type: 'multiple-choice', instructions: '', sourceSegments: [],
    transcriptHash: '', difficulty: 'intermediate', questions: [
      { id: 'q1', type: 'multiple-choice', question: 'Q?', options: ['A', 'B'], correctAnswer: 0, explanation: '' },
    ], score: 0, totalQuestions: 1, isCompleted: false, attemptHistory: [],
    generationSource: 'deterministic', generationOptions: '{}', createdAt: now, updatedAt: now,
    ...overrides,
  } as Omit<Exercise, 'id'>
}

describe('YouTubeVideoRepository', () => {
  let repo: YouTubeVideoRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new YouTubeVideoRepository() })
  afterEach(() => destroyDb())

  it('creates and finds by videoId', async () => {
    await repo.create(makeVideo({ videoId: 'abc-123' }))
    const found = await repo.findByVideoId('abc-123')
    expect(found).toBeDefined()
    expect(found!.videoId).toBe('abc-123')
  })

  it('returns undefined for non-existent videoId', async () => {
    expect(await repo.findByVideoId('nonexistent')).toBeUndefined()
  })

  it('returns all videos', async () => {
    await repo.create(makeVideo({ videoId: 'v1' }))
    await repo.create(makeVideo({ videoId: 'v2' }))
    expect(await repo.findAll()).toHaveLength(2)
  })

  it('returns empty array when empty', async () => {
    expect(await repo.findAll()).toEqual([])
  })

  it('persists all fields', async () => {
    const v = await repo.create(makeVideo({ title: 'IELTS Practice', channelName: 'IELTS Advantage', transcriptLanguage: 'en', cefrLevel: 'B2' }))
    expect(v.title).toBe('IELTS Practice')
    expect(v.channelName).toBe('IELTS Advantage')
    expect(v.cefrLevel).toBe('B2')
  })
})

describe('TranscriptRepository', () => {
  let repo: TranscriptRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new TranscriptRepository() })
  afterEach(() => destroyDb())

  it('creates and finds by videoId', async () => {
    await repo.create(makeTranscript({ videoId: 'vid-x' }))
    expect((await repo.findByVideoId('vid-x'))!.videoId).toBe('vid-x')
  })

  it('returns undefined when not found', async () => {
    expect(await repo.findByVideoId('nonexistent')).toBeUndefined()
  })

  it('creates with segments', async () => {
    const t = await repo.create(makeTranscript({
      videoId: 'v1', segments: [{
        id: 's1', videoId: 'v1', start: 0, end: 5, text: 'Hello', language: 'en',
        source: 'auto-generated', words: [], isAutoGenerated: false,
      }], fullText: 'Hello', wordCount: 1,
    }))
    expect(t.segments).toHaveLength(1)
    expect(t.fullText).toBe('Hello')
  })
})

describe('SavedSentenceRepository', () => {
  let repo: SavedSentenceRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new SavedSentenceRepository() })
  afterEach(() => destroyDb())

  it('creates and finds by videoId', async () => {
    await repo.create(makeSavedSentence({ videoId: 'v1', text: 'S1' }))
    await repo.create(makeSavedSentence({ videoId: 'v1', text: 'S2' }))
    expect(await repo.findByVideoId('v1')).toHaveLength(2)
  })

  it('returns empty array for empty video', async () => {
    expect(await repo.findByVideoId('empty')).toEqual([])
  })

  it('does not mix videos', async () => {
    await repo.create(makeSavedSentence({ videoId: 'v1', text: 'V1' }))
    await repo.create(makeSavedSentence({ videoId: 'v2', text: 'V2' }))
    expect(await repo.findByVideoId('v1')).toHaveLength(1)
  })
})

describe('TimestampedNoteRepository', () => {
  let repo: TimestampedNoteRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new TimestampedNoteRepository() })
  afterEach(() => destroyDb())

  it('performs full CRUD', async () => {
    const created = await repo.create(makeTimestampedNote({ text: 'Test note', category: 'grammar' }))
    expect(created.text).toBe('Test note')

    await repo.update(created.id, { text: 'Updated', isFavorite: true } as Partial<TimestampedNote>)
    const updated = await repo.findByIdOrThrow(created.id)
    expect(updated.text).toBe('Updated')
    expect(updated.isFavorite).toBe(true)

    await repo.delete(created.id)
    expect(await repo.findById(created.id)).toBeUndefined()
  })

  it('throws on non-existent update', async () => {
    await expect(repo.update('nonexistent', { text: 'x' } as Partial<TimestampedNote>)).rejects.toThrow(EntityNotFoundError)
  })

  it('finds by videoId', async () => {
    await repo.create(makeTimestampedNote({ videoId: 'v1', text: 'N1' }))
    await repo.create(makeTimestampedNote({ videoId: 'v1', text: 'N2' }))
    expect(await repo.findByVideoId('v1')).toHaveLength(2)
  })
})

describe('LearningPlaylistRepository', () => {
  let repo: LearningPlaylistRepository
  let itemRepo: PlaylistItemRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new LearningPlaylistRepository(); itemRepo = new PlaylistItemRepository() })
  afterEach(() => destroyDb())

  it('creates playlist with items', async () => {
    const pl = await repo.create(makePlaylist({ name: 'My List' }))
    await itemRepo.create(makePlaylistItem({ playlistId: pl.id, videoId: 'v1', sortOrder: 0 }))
    await itemRepo.create(makePlaylistItem({ playlistId: pl.id, videoId: 'v2', sortOrder: 1 }))
    expect(await itemRepo.findByPlaylistId(pl.id)).toHaveLength(2)
  })

  it('finds playlist items by videoId', async () => {
    const pl = await repo.create(makePlaylist({ name: 'P1' }))
    await itemRepo.create(makePlaylistItem({ playlistId: pl.id, videoId: 'shared' }))
    expect(await itemRepo.findByVideoId('shared')).toHaveLength(1)
  })

  it('returns empty for non-existent playlist', async () => {
    expect(await itemRepo.findByPlaylistId('nonexistent')).toEqual([])
  })
})

describe('VideoStudySessionRepository', () => {
  let repo: VideoStudySessionRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new VideoStudySessionRepository() })
  afterEach(() => destroyDb())

  it('creates and finds active session', async () => {
    await repo.create(makeStudySession({ videoId: 'v1', isCompleted: true }))
    const active = await repo.create(makeStudySession({ videoId: 'v1', isCompleted: false }))
    const found = await repo.findActiveByVideoId('v1')
    expect(found).toBeDefined()
    expect(found!.id).toBe(active.id)
  })

  it('returns undefined when no active session', async () => {
    await repo.create(makeStudySession({ videoId: 'v1', isCompleted: true }))
    expect(await repo.findActiveByVideoId('v1')).toBeUndefined()
  })

  it('tracks study progress', async () => {
    const s = await repo.create(makeStudySession({ videoId: 'v1', wordsViewed: 5, wordsSaved: 2 }))
    await repo.update(s.id, { wordsViewed: 10, wordsSaved: 5 } as Partial<VideoStudySession>)

    const updated = await repo.findByIdOrThrow(s.id)
    expect(updated.wordsViewed).toBe(10)
    expect(updated.wordsSaved).toBe(5)
  })
})

describe('DictationAttemptRepository', () => {
  let repo: DictationAttemptRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new DictationAttemptRepository() })
  afterEach(() => destroyDb())

  it('creates and finds by videoId', async () => {
    await repo.create(makeDictationAttempt({ videoId: 'v1' }))
    await repo.create(makeDictationAttempt({ videoId: 'v1' }))
    expect(await repo.findByVideoId('v1')).toHaveLength(2)
  })

  it('stores incorrect word analysis', async () => {
    const a = await repo.create(makeDictationAttempt({
      sentence: 'The cat sat.', userInput: 'The dog sat.', accuracy: 0.66,
      incorrectWords: [{ expected: 'cat', received: 'dog' }],
    }))
    expect(a.incorrectWords[0].expected).toBe('cat')
    expect(a.accuracy).toBe(0.66)
  })
})

describe('ExerciseRepository', () => {
  let repo: ExerciseRepository

  beforeEach(async () => { setupDb(); await clearYouTubeTables(); repo = new ExerciseRepository() })
  afterEach(() => destroyDb())

  it('creates and finds by videoId', async () => {
    await repo.create(makeExercise({ videoId: 'v1', instructions: 'Ex1' }))
    await repo.create(makeExercise({ videoId: 'v1', instructions: 'Ex2' }))
    expect(await repo.findByVideoId('v1')).toHaveLength(2)
  })

  it('creates with multiple question types', async () => {
    const e = await repo.create(makeExercise({
      type: 'fill-blanks',
      questions: [
        { id: 'q1', type: 'fill-blanks', text: 'The ___ cat.', blanks: ['big'], correctAnswers: ['big'], explanation: '' },
        { id: 'q2', type: 'true-false-not-given', statement: 'Earth is flat.', correctAnswer: 'false', explanation: '' },
        { id: 'q3', type: 'vocabulary-matching', prompt: 'Match.', items: ['a'], definitions: ['b'], correctMatches: { a: 0 }, explanation: '' },
      ],
      totalQuestions: 3,
    }))
    expect(e.questions).toHaveLength(3)
  })

  it('updates score and completion', async () => {
    const e = await repo.create(makeExercise({ type: 'multiple-choice' }))
    await repo.update(e.id, { score: 1, isCompleted: true } as Partial<Exercise>)
    const updated = await repo.findByIdOrThrow(e.id)
    expect(updated.score).toBe(1)
    expect(updated.isCompleted).toBe(true)
  })

  it('returns empty array for video with no exercises', async () => {
    expect(await repo.findByVideoId('empty')).toEqual([])
  })
})

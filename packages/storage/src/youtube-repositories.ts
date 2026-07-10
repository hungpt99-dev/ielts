import { BaseRepository } from './repositories/BaseRepository'
import {
  youtubeVideoSchema,
  transcriptSchema,
  videoAnalysisSchema,
  videoVocabularySourceSchema,
  savedSentenceSchema,
  timestampedNoteSchema,
  learningPlaylistSchema,
  playlistItemSchema,
  videoStudySessionSchema,
  studyActivitySchema,
  exerciseSchema,
  exerciseAttemptSchema,
  dictationAttemptSchema,
  shadowingAttemptSchema,
  speakingAttemptSchema,
  summaryAttemptSchema,
  tutorInterventionSchema,
  aiGenerationCacheSchema,
  channelEvaluationSchema,
} from './youtube-schemas'
import type {
  YouTubeVideo,
  Transcript,
  VideoAnalysis,
  VideoVocabularySource,
  SavedSentence,
  TimestampedNote,
  LearningPlaylist,
  PlaylistItem,
  VideoStudySession,
  StudyActivity,
  Exercise,
  ExerciseAttempt,
  DictationAttempt,
  ShadowingAttempt,
  SpeakingAttempt,
  SummaryAttempt,
  TutorIntervention,
  AIGenerationCache,
  ChannelEvaluation,
} from './youtube-schemas'

export class YouTubeVideoRepository extends BaseRepository<YouTubeVideo> {
  constructor() { super('youtubeVideos', youtubeVideoSchema) }
  async findByVideoId(videoId: string): Promise<YouTubeVideo | undefined> {
    const results = await this.queryByIndex('videoId', videoId)
    return results[0]
  }
}

export class TranscriptRepository extends BaseRepository<Transcript> {
  constructor() { super('transcripts', transcriptSchema) }
  async findByVideoId(videoId: string): Promise<Transcript | undefined> {
    const results = await this.queryByIndex('videoId', videoId)
    return results[0]
  }
}

export class VideoAnalysisRepository extends BaseRepository<VideoAnalysis> {
  constructor() { super('videoAnalyses', videoAnalysisSchema) }
  async findByVideoId(videoId: string): Promise<VideoAnalysis | undefined> {
    const results = await this.queryByIndex('videoId', videoId)
    return results[0]
  }
}

export class VideoVocabularySourceRepository extends BaseRepository<VideoVocabularySource> {
  constructor() { super('videoVocabularySources', videoVocabularySourceSchema) }
  async findByVideoId(videoId: string): Promise<VideoVocabularySource[]> {
    return this.queryByIndex('videoId', videoId)
  }
  async findByVocabularyId(vocabularyId: string): Promise<VideoVocabularySource[]> {
    return this.queryByIndex('vocabularyId', vocabularyId)
  }
}

export class SavedSentenceRepository extends BaseRepository<SavedSentence> {
  constructor() { super('savedSentences', savedSentenceSchema) }
  async findByVideoId(videoId: string): Promise<SavedSentence[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class TimestampedNoteRepository extends BaseRepository<TimestampedNote> {
  constructor() { super('timestampedNotes', timestampedNoteSchema) }
  async findByVideoId(videoId: string): Promise<TimestampedNote[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class LearningPlaylistRepository extends BaseRepository<LearningPlaylist> {
  constructor() { super('learningPlaylists', learningPlaylistSchema) }
}

export class PlaylistItemRepository extends BaseRepository<PlaylistItem> {
  constructor() { super('playlistItems', playlistItemSchema) }
  async findByPlaylistId(playlistId: string): Promise<PlaylistItem[]> {
    return this.queryByIndex('playlistId', playlistId)
  }
  async findByVideoId(videoId: string): Promise<PlaylistItem[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class VideoStudySessionRepository extends BaseRepository<VideoStudySession> {
  constructor() { super('videoStudySessions', videoStudySessionSchema) }
  async findByVideoId(videoId: string): Promise<VideoStudySession[]> {
    return this.queryByIndex('videoId', videoId)
  }
  async findActiveByVideoId(videoId: string): Promise<VideoStudySession | undefined> {
    const sessions = await this.queryByIndex('videoId', videoId)
    return sessions.find(s => !s.isCompleted)
  }
}

export class StudyActivityRepository extends BaseRepository<StudyActivity> {
  constructor() { super('studyActivities', studyActivitySchema) }
  async findBySessionId(sessionId: string): Promise<StudyActivity[]> {
    return this.queryByIndex('sessionId', sessionId)
  }
  async findByVideoId(videoId: string): Promise<StudyActivity[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor() { super('youtubeExercises', exerciseSchema) }
  async findByVideoId(videoId: string): Promise<Exercise[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class ExerciseAttemptRepository extends BaseRepository<ExerciseAttempt> {
  constructor() { super('exerciseAttempts', exerciseAttemptSchema) }
  async findByExerciseId(exerciseId: string): Promise<ExerciseAttempt[]> {
    return this.queryByIndex('exerciseId', exerciseId)
  }
}

export class DictationAttemptRepository extends BaseRepository<DictationAttempt> {
  constructor() { super('dictationAttempts', dictationAttemptSchema) }
  async findByVideoId(videoId: string): Promise<DictationAttempt[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class ShadowingAttemptRepository extends BaseRepository<ShadowingAttempt> {
  constructor() { super('shadowingAttempts', shadowingAttemptSchema) }
  async findByVideoId(videoId: string): Promise<ShadowingAttempt[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class SpeakingAttemptRepository extends BaseRepository<SpeakingAttempt> {
  constructor() { super('speakingAttempts', speakingAttemptSchema) }
  async findByVideoId(videoId: string): Promise<SpeakingAttempt[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class SummaryAttemptRepository extends BaseRepository<SummaryAttempt> {
  constructor() { super('summaryAttempts', summaryAttemptSchema) }
  async findByVideoId(videoId: string): Promise<SummaryAttempt[]> {
    return this.queryByIndex('videoId', videoId)
  }
}

export class TutorInterventionRepository extends BaseRepository<TutorIntervention> {
  constructor() { super('tutorInterventions', tutorInterventionSchema) }
  async findBySessionId(sessionId: string): Promise<TutorIntervention[]> {
    return this.queryByIndex('sessionId', sessionId)
  }
}

export class AIGenerationCacheRepository extends BaseRepository<AIGenerationCache> {
  constructor() { super('aiGenerationCache', aiGenerationCacheSchema) }
  async findByCacheKey(cacheKey: string): Promise<AIGenerationCache | undefined> {
    const results = await this.queryByIndex('cacheKey', cacheKey)
    return results[0]
  }
  async findExpired(): Promise<AIGenerationCache[]> {
    const all = await this.findAll()
    const now = new Date().toISOString()
    return all.filter(c => c.expiresAt < now)
  }
}

export class ChannelEvaluationRepository extends BaseRepository<ChannelEvaluation> {
  constructor() { super('channelEvaluations', channelEvaluationSchema) }
  async findByChannelId(channelId: string): Promise<ChannelEvaluation | undefined> {
    const results = await this.queryByIndex('channelId', channelId)
    return results[0]
  }
}

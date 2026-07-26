export interface StorageVersion {
  number: number
  stores: Record<string, string>
  upgrade?: (tx: any) => void | Promise<void>
}

export interface AppDatabaseSchema {
  currentVersion: number
  versions: StorageVersion[]
}

export const APP_SCHEMA: AppDatabaseSchema = {
  currentVersion: 1,
  versions: [
    {
      number: 1,
      stores: {
        vocabulary: 'id, topic, status, difficulty, createdAt',
        vocabularyReviews: 'id, vocabularyId, nextReviewDate, lastReviewDate',
        tasks: 'id, date, category, isDone, createdAt',
        readingSessions: 'id, topic, createdAt',
        readingPracticeSessions: 'id, passageId, topic, createdAt',
        listeningSessions: 'id, topic, createdAt',
        listeningPracticeSessions: 'id, exerciseId, topic, createdAt',
        writingSessions: 'id, taskType, topic, createdAt',
        speakingSessions: 'id, part, topic, createdAt',
        grammarNotes: 'id, topic, status, relatedSkill, createdAt',
        mistakes: 'id, skill, status, source, date, createdAt',
        mockTests: 'id, date, createdAt',
        topicsProgress: 'id, topic, updatedAt',
        passages: 'id, createdAt',
        ieltsTopics: 'id, name, skill, *tags, createdAt',
        exampleSentences: 'id, vocabularyId, topic, *tags, isFavorite, createdAt',
        readingPassages: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        listeningTranscripts: 'id, topic, difficulty, *tags, isFavorite, createdAt',
        writingPrompts: 'id, taskType, topic, difficulty, *tags, isFavorite, createdAt',
        speakingQuestions: 'id, part, topic, difficulty, *tags, isFavorite, createdAt',
        studyNotes: 'id, topic, skill, *tags, isFavorite, createdAt',
        customStudyPlans: 'id, isActive, createdAt',
        usefulPhrases: 'id, topic, skill, difficulty, *tags, isFavorite, createdAt',
        aiContents: 'id, type, topic, *tags, isFavorite, createdAt',
        publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
        progressRecords: 'id, date, skill, createdAt',
        contentMeta: 'id, packId, packVersion, seededAt',
        userContentEdits: 'id, originalId, userItemId, contentType, tableName, editedAt',
        speakingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        writingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        readingExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        listeningExercises: 'id, topic, skill, difficulty, sourceId, *tags, isFavorite, createdAt',
        artifacts: 'id, url, category, *tags, isFavorite, createdAt',
        learningEvents: 'id, eventType, source, timestamp, sessionId, syncStatus, createdAt',
        youtubeVideos: 'id, videoId, createdAt',
        transcripts: 'id, videoId, fetchedAt',
        videoAnalyses: 'id, videoId, createdAt',
        videoVocabularySources: 'id, vocabularyId, videoId, sourceCreatedAt',
        savedSentences: 'id, videoId, createdAt',
        timestampedNotes: 'id, videoId, createdAt',
        learningPlaylists: 'id, createdAt',
        playlistItems: 'id, playlistId, videoId, addedAt',
        videoStudySessions: 'id, videoId, startTime, createdAt',
        studyActivities: 'id, sessionId, videoId, timestamp',
        youtubeExercises: 'id, videoId, createdAt',
        exerciseAttempts: 'id, exerciseId, videoId, createdAt',
        dictationAttempts: 'id, videoId, createdAt',
        shadowingAttempts: 'id, videoId, createdAt',
        speakingAttempts: 'id, videoId, createdAt',
        summaryAttempts: 'id, videoId, createdAt',
        tutorInterventions: 'id, sessionId, videoId, createdAt',
        aiGenerationCache: 'id, cacheKey, videoId, expiresAt, createdAt',
        channelEvaluations: 'id, channelId, lastAnalyzedAt, createdAt',
        plans: 'id, createdAt',
        phases: 'id, planId, order, createdAt',
        weeks: 'id, phaseId, weekNumber, createdAt',
        days: 'id, weekId, date, dayNumber, createdAt',
        activities: 'id, type, skill, topic, createdAt',
      },
    },
  ],
}

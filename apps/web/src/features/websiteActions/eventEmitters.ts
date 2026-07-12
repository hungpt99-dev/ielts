import { emitLearningEvent } from '../learningEvents/LearningEventBus'
import type {
  AppOpenedPayload,
  DashboardOpenedPayload,
  AITutorOpenedPayload,
  StudyRoadmapViewedPayload,
  VocabularySavedPayload,
  VocabularyReviewedPayload,
  VocabularyForgottenPayload,
  VocabularyMasteredPayload,
  ArticleSavedPayload,
  ReadingPracticeCompletedPayload,
  ListeningPracticeCompletedPayload,
  WritingSubmittedPayload,
  SpeakingPracticedPayload,
  MistakeSavedPayload,
  RepeatedMistakeDetectedPayload,
  ProgressViewedPayload,
  AIProgressReviewGeneratedPayload,
  SettingsChangedPayload,
  AIProviderConfiguredPayload,
  UserBecameInactivePayload,
  UserReturnedAfterInactivityPayload,
} from '../learningEvents/types'

export function emitAppOpened(lastActiveAt: string | null, isReturnVisit: boolean): void {
  try {
    emitLearningEvent({
      eventType: 'app_opened',
      source: 'website',
      page: window.location.pathname,
      payload: { eventType: 'app_opened', lastActiveAt, isReturnVisit } satisfies AppOpenedPayload,
    })
  } catch { }
}

export function emitDashboardOpened(activeTasks: number): void {
  try {
    emitLearningEvent({
      eventType: 'dashboard_opened',
      source: 'website',
      page: '/dashboard',
      entityType: 'dashboard',
      payload: { eventType: 'dashboard_opened', activeTasks } satisfies DashboardOpenedPayload,
    })
  } catch { }
}

export function emitAITutorOpened(previousMessageCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'ai_tutor_opened',
      source: 'website',
      page: '/ai-tutor',
      entityType: 'ai_tutor',
      payload: { eventType: 'ai_tutor_opened', previousMessageCount } satisfies AITutorOpenedPayload,
    })
  } catch { }
}

export function emitStudyRoadmapViewed(roadmapId: string, weeksPlanned: number): void {
  try {
    emitLearningEvent({
      eventType: 'study_roadmap_viewed',
      source: 'website',
      page: '/roadmap',
      entityType: 'roadmap',
      payload: { eventType: 'study_roadmap_viewed', roadmapId, weeksPlanned } satisfies StudyRoadmapViewedPayload,
    })
  } catch { }
}

export function emitVocabularySaved(vocabularyId: string, word: string, topic: string, sessionWordCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'vocabulary_saved',
      source: 'vocabulary',
      page: '/vocabulary',
      entityType: 'vocabulary',
      entityId: vocabularyId,
      payload: { eventType: 'vocabulary_saved', vocabularyId, word, topic, sessionWordCount } satisfies VocabularySavedPayload,
    })
  } catch { }
}

export function emitVocabularyReviewed(vocabularyId: string, word: string, rating: 'again' | 'hard' | 'good' | 'easy', sessionReviewCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'vocabulary_reviewed',
      source: 'vocabulary',
      page: '/vocabulary',
      entityType: 'vocabulary',
      entityId: vocabularyId,
      payload: { eventType: 'vocabulary_reviewed', vocabularyId, word, rating, sessionReviewCount } satisfies VocabularyReviewedPayload,
    })
  } catch { }
}

export function emitVocabularyForgotten(vocabularyId: string, word: string, timesForgotten: number): void {
  try {
    emitLearningEvent({
      eventType: 'vocabulary_forgotten',
      source: 'vocabulary',
      page: '/vocabulary',
      entityType: 'vocabulary',
      entityId: vocabularyId,
      payload: { eventType: 'vocabulary_forgotten', vocabularyId, word, timesForgotten } satisfies VocabularyForgottenPayload,
    })
  } catch { }
}

export function emitVocabularyMastered(vocabularyId: string, word: string, totalMastered: number): void {
  try {
    emitLearningEvent({
      eventType: 'vocabulary_mastered',
      source: 'vocabulary',
      page: '/vocabulary',
      entityType: 'vocabulary',
      entityId: vocabularyId,
      payload: { eventType: 'vocabulary_mastered', vocabularyId, word, totalMastered } satisfies VocabularyMasteredPayload,
    })
  } catch { }
}

export function emitArticleSaved(articleId: string, title: string, sourceUrl: string, wordCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'article_saved',
      source: 'website',
      page: window.location.pathname,
      entityType: 'article',
      entityId: articleId,
      payload: { eventType: 'article_saved', articleId, title, sourceUrl, wordCount } satisfies ArticleSavedPayload,
    })
  } catch { }
}

export function emitReadingPracticeCompleted(sessionId: string, title: string, accuracy: number, totalQuestions: number, correctAnswers: number, timeSpentSeconds: number): void {
  try {
    emitLearningEvent({
      eventType: 'reading_practice_completed',
      source: 'practice',
      page: '/reading',
      entityType: 'reading',
      entityId: sessionId,
      payload: { eventType: 'reading_practice_completed', sessionId, title, accuracy, totalQuestions, correctAnswers, timeSpentSeconds } satisfies ReadingPracticeCompletedPayload,
    })
  } catch { }
}

export function emitListeningPracticeCompleted(sessionId: string, title: string, accuracy: number, totalQuestions: number, correctAnswers: number, timeSpentSeconds: number): void {
  try {
    emitLearningEvent({
      eventType: 'listening_practice_completed',
      source: 'practice',
      page: '/listening',
      entityType: 'listening',
      entityId: sessionId,
      payload: { eventType: 'listening_practice_completed', sessionId, title, accuracy, totalQuestions, correctAnswers, timeSpentSeconds } satisfies ListeningPracticeCompletedPayload,
    })
  } catch { }
}

export function emitWritingSubmitted(sessionId: string, taskType: 'task1' | 'task2', wordCount: number, estimatedBand: number): void {
  try {
    emitLearningEvent({
      eventType: 'writing_submitted',
      source: 'practice',
      page: '/writing',
      entityType: 'writing',
      entityId: sessionId,
      payload: { eventType: 'writing_submitted', sessionId, taskType, wordCount, estimatedBand } satisfies WritingSubmittedPayload,
    })
  } catch { }
}

export function emitSpeakingPracticed(sessionId: string, part: 1 | 2 | 3, durationSeconds: number): void {
  try {
    emitLearningEvent({
      eventType: 'speaking_practiced',
      source: 'practice',
      page: '/speaking',
      entityType: 'speaking',
      entityId: sessionId,
      payload: { eventType: 'speaking_practiced', sessionId, part, durationSeconds } satisfies SpeakingPracticedPayload,
    })
  } catch { }
}

export function emitMistakeSaved(mistakeId: string, mistake: string, skill: string, sessionMistakeCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'mistake_saved',
      source: 'website',
      page: '/mistakes',
      entityType: 'mistake',
      entityId: mistakeId,
      payload: { eventType: 'mistake_saved', mistakeId, mistake, skill, sessionMistakeCount } satisfies MistakeSavedPayload,
    })
  } catch { }
}

export function emitRepeatedMistakeDetected(mistakeId: string, mistake: string, skill: string, repetitionCount: number): void {
  try {
    emitLearningEvent({
      eventType: 'repeated_mistake_detected',
      source: 'website',
      page: '/mistakes',
      entityType: 'mistake',
      entityId: mistakeId,
      payload: { eventType: 'repeated_mistake_detected', mistakeId, mistake, skill, repetitionCount } satisfies RepeatedMistakeDetectedPayload,
    })
  } catch { }
}

export function emitProgressViewed(timeRange: string): void {
  try {
    emitLearningEvent({
      eventType: 'progress_viewed',
      source: 'progress',
      page: '/progress',
      entityType: 'progress',
      payload: { eventType: 'progress_viewed', timeRange } satisfies ProgressViewedPayload,
    })
  } catch { }
}

export function emitAIProgressReviewGenerated(reviewId: string, periodStart: string, periodEnd: string): void {
  try {
    emitLearningEvent({
      eventType: 'ai_progress_review_generated',
      source: 'progress',
      page: '/progress',
      entityType: 'progress',
      entityId: reviewId,
      payload: { eventType: 'ai_progress_review_generated', reviewId, periodStart, periodEnd } satisfies AIProgressReviewGeneratedPayload,
    })
  } catch { }
}

export function emitSettingsChanged(changedKeys: string[]): void {
  try {
    emitLearningEvent({
      eventType: 'settings_changed',
      source: 'settings',
      page: '/settings',
      entityType: 'settings',
      payload: { eventType: 'settings_changed', changedKeys } satisfies SettingsChangedPayload,
    })
  } catch { }
}

export function emitAIProviderConfigured(provider: string, model: string): void {
  try {
    emitLearningEvent({
      eventType: 'ai_provider_configured',
      source: 'settings',
      page: '/settings/ai-provider',
      entityType: 'settings',
      payload: { eventType: 'ai_provider_configured', provider, model } satisfies AIProviderConfiguredPayload,
    })
  } catch { }
}

export function emitUserBecameInactive(inactivityDurationMinutes: number): void {
  try {
    emitLearningEvent({
      eventType: 'user_became_inactive',
      source: 'website',
      page: window.location.pathname,
      entityType: 'user_session',
      payload: { eventType: 'user_became_inactive', inactivityDurationMinutes } satisfies UserBecameInactivePayload,
    })
  } catch { }
}

export function emitUserReturnedAfterInactivity(inactivityDurationMinutes: number): void {
  try {
    emitLearningEvent({
      eventType: 'user_returned_after_inactivity',
      source: 'website',
      page: window.location.pathname,
      entityType: 'user_session',
      payload: { eventType: 'user_returned_after_inactivity', inactivityDurationMinutes } satisfies UserReturnedAfterInactivityPayload,
    })
  } catch { }
}

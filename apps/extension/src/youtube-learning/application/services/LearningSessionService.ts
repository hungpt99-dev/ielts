import { StorageAdapter, type StudySessionData } from '../../infrastructure/persistence/StorageAdapter'
import { LearningEventBus } from '../../domain/events/LearningEventBus'

export type { StudySessionData }

export class LearningSessionService {
  private storageAdapter: StorageAdapter
  private eventBus: LearningEventBus
  private session: StudySessionData | null = null
  private tickIntervalId: ReturnType<typeof setInterval> | null = null
  private lastTickTime: number = 0
  private isVideoPlaying: boolean = false
  private isTabVisible: boolean = true
  private isUserActive: boolean = true
  private inactivityTimerId: ReturnType<typeof setTimeout> | null = null
  private readonly inactivityTimeoutMs: number = 300000
  private readonly tickIntervalMs: number = 1000

  constructor(storageAdapter: StorageAdapter, eventBus: LearningEventBus) {
    this.storageAdapter = storageAdapter
    this.eventBus = eventBus
  }

  async startSession(videoId: string): Promise<StudySessionData> {
    if (this.session && !this.session.isCompleted) {
      await this.endSession()
    }

    const now = new Date().toISOString()
    this.session = {
      id: crypto.randomUUID(),
      videoId,
      startTime: now,
      activeStudyDuration: 0,
      watchDuration: 0,
      wordsViewed: 0,
      wordsSaved: 0,
      sentencesSaved: 0,
      notesCreated: 0,
      exercisesAttempted: 0,
      isCompleted: false,
    }

    await this.storageAdapter.saveSession(this.session)
    this.startTicking()

    this.eventBus.emit({
      type: 'learning-mode-started',
      videoId,
      sessionId: this.session.id,
      timestamp: now,
    })

    return this.session
  }

  async endSession(): Promise<StudySessionData | null> {
    if (!this.session) return null

    this.stopTicking()
    this.clearInactivityTimer()

    this.session.isCompleted = true
    await this.storageAdapter.saveSession(this.session)

    this.eventBus.emit({
      type: 'study-session-completed',
      videoId: this.session.videoId,
      sessionId: this.session.id,
      metadata: {
        activeStudyDuration: this.session.activeStudyDuration,
        watchDuration: this.session.watchDuration,
        wordsViewed: this.session.wordsViewed,
        wordsSaved: this.session.wordsSaved,
        sentencesSaved: this.session.sentencesSaved,
        notesCreated: this.session.notesCreated,
        exercisesAttempted: this.session.exercisesAttempted,
      },
      timestamp: new Date().toISOString(),
    })

    this.eventBus.emit({
      type: 'learning-mode-ended',
      videoId: this.session.videoId,
      sessionId: this.session.id,
      timestamp: new Date().toISOString(),
    })

    const completed = this.session
    this.session = null
    await this.storageAdapter.clearSession()
    return completed
  }

  getActiveSession(): StudySessionData | null {
    return this.session
  }

  setVideoPlaying(playing: boolean): void {
    this.isVideoPlaying = playing
  }

  setTabVisibility(visible: boolean): void {
    this.isTabVisible = visible
  }

  markUserActive(): void {
    this.isUserActive = true
    this.resetInactivityTimer()
  }

  incrementWordsViewed(): void {
    if (!this.session) return
    this.session.wordsViewed++
    this.persistSession()
  }

  incrementWordsSaved(): void {
    if (!this.session) return
    this.session.wordsSaved++
    this.persistSession()
  }

  incrementSentencesSaved(): void {
    if (!this.session) return
    this.session.sentencesSaved++
    this.persistSession()
  }

  incrementNotesCreated(): void {
    if (!this.session) return
    this.session.notesCreated++
    this.persistSession()
  }

  incrementExercisesAttempted(): void {
    if (!this.session) return
    this.session.exercisesAttempted++
    this.persistSession()
  }

  destroy(): void {
    this.stopTicking()
    this.session = null
  }

  private startTicking(): void {
    if (this.tickIntervalId !== null) return
    this.lastTickTime = Date.now()
    this.tickIntervalId = setInterval(() => this.tick(), this.tickIntervalMs)
    this.resetInactivityTimer()
  }

  private stopTicking(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId)
      this.tickIntervalId = null
    }
    this.clearInactivityTimer()
  }

  private tick(): void {
    if (!this.session) return

    const now = Date.now()
    const elapsedMs = now - this.lastTickTime
    this.lastTickTime = now

    const elapsedSec = elapsedMs / 1000
    this.session.watchDuration += elapsedSec

    if (this.isVideoPlaying && this.isTabVisible && this.isUserActive) {
      this.session.activeStudyDuration += elapsedSec
    }

    this.persistSession()
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer()
    this.inactivityTimerId = setTimeout(() => {
      this.isUserActive = false
    }, this.inactivityTimeoutMs)
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimerId !== null) {
      clearTimeout(this.inactivityTimerId)
      this.inactivityTimerId = null
    }
  }

  private persistSession(): void {
    if (!this.session) return
    this.storageAdapter.saveSession(this.session).catch(() => {})
  }
}

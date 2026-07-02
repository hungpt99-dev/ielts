import { BaseRepository } from './BaseRepository'
import {
  readingSessionSchema,
  listeningSessionSchema,
  writingSessionSchema,
  speakingSessionSchema,
  readingPracticeSessionSchema,
  listeningPracticeSessionSchema,
} from '../schema'
import type { z } from 'zod'

export type ReadingSession = z.infer<typeof readingSessionSchema>
export type ListeningSession = z.infer<typeof listeningSessionSchema>
export type WritingSession = z.infer<typeof writingSessionSchema>
export type SpeakingSession = z.infer<typeof speakingSessionSchema>
export type ReadingPracticeSession = z.infer<typeof readingPracticeSessionSchema>
export type ListeningPracticeSession = z.infer<typeof listeningPracticeSessionSchema>

export class ReadingSessionRepository extends BaseRepository<ReadingSession> {
  constructor() {
    super('readingSessions', readingSessionSchema)
  }

  async findByTopic(topic: string): Promise<ReadingSession[]> {
    return this.queryByIndex('topic', topic)
  }
}

export class ListeningSessionRepository extends BaseRepository<ListeningSession> {
  constructor() {
    super('listeningSessions', listeningSessionSchema)
  }

  async findByTopic(topic: string): Promise<ListeningSession[]> {
    return this.queryByIndex('topic', topic)
  }
}

export class WritingSessionRepository extends BaseRepository<WritingSession> {
  constructor() {
    super('writingSessions', writingSessionSchema)
  }

  async findByTaskType(taskType: WritingSession['taskType']): Promise<WritingSession[]> {
    return this.queryByIndex('taskType', taskType)
  }
}

export class SpeakingSessionRepository extends BaseRepository<SpeakingSession> {
  constructor() {
    super('speakingSessions', speakingSessionSchema)
  }

  async findByPart(part: SpeakingSession['part']): Promise<SpeakingSession[]> {
    return this.queryByIndex('part', part)
  }
}

export class ReadingPracticeSessionRepository extends BaseRepository<ReadingPracticeSession> {
  constructor() {
    super('readingPracticeSessions', readingPracticeSessionSchema)
  }

  async findByPassageId(passageId: string): Promise<ReadingPracticeSession[]> {
    return this.queryByIndex('passageId', passageId)
  }
}

export class ListeningPracticeSessionRepository extends BaseRepository<ListeningPracticeSession> {
  constructor() {
    super('listeningPracticeSessions', listeningPracticeSessionSchema)
  }

  async findByExerciseId(exerciseId: string): Promise<ListeningPracticeSession[]> {
    return this.queryByIndex('exerciseId', exerciseId)
  }
}

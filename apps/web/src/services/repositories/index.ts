import { DatabaseService } from '../storage/Database'
import type {
  VocabularyEntry, VocabReviewEntry, MistakeEntry, TaskEntry, GrammarNote,
  StudyNote, ProgressRecord, AiContent, ReadingPracticeSession,
  ListeningPracticeSession, PublicApiContent,
} from '@ielts/storage'

function createRepo<T>(table: string) {
  return {
    async findAll(): Promise<T[]> {
      return DatabaseService.getAll<T>(table)
    },
    async findById(id: string): Promise<T | undefined> {
      return DatabaseService.getById<T>(table, id)
    },
    async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
      const id = await DatabaseService.add(table, item as Record<string, unknown>)
      return { ...item, id } as unknown as T
    },
    async bulkUpsert(items: T[]): Promise<void> {
      for (const item of items) {
        await DatabaseService.put(table, item as Record<string, unknown>)
      }
    },
    async update(id: string, changes: Partial<T>): Promise<void> {
      await DatabaseService.update(table, id, changes)
    },
    async patch(id: string, changes: Partial<T>): Promise<T | undefined> {
      await DatabaseService.update(table, id, changes)
      return DatabaseService.getById<T>(table, id)
    },
    async delete(id: string): Promise<void> {
      await DatabaseService.remove(table, id)
    },
    async count(): Promise<number> {
      return DatabaseService.count(table)
    },
    async bulkCreate(items: T[]): Promise<void> {
      await DatabaseService.bulkAdd(table, items as Record<string, unknown>[])
    },
    async clear(): Promise<void> {
      const all = await DatabaseService.getAll<T>(table)
      for (const item of all) {
        await DatabaseService.remove(table, (item as Record<string, unknown>).id as string)
      }
    },
  }
}

export const vocabularyRepo = createRepo<VocabularyEntry>('vocabulary')
export const vocabReviewRepo = createRepo<VocabReviewEntry>('vocabularyReviews')
export const mistakeRepo = createRepo<MistakeEntry>('mistakes')
export const taskRepo = createRepo<TaskEntry>('tasks')
export const grammarNoteRepo = createRepo<GrammarNote>('grammarNotes')
export const studyNoteRepo = createRepo<StudyNote>('studyNotes')
export const artifactRepo = createRepo<Record<string, unknown>>('artifacts')
export const progressRecordRepo = createRepo<ProgressRecord>('progressRecords')
export const aiContentRepo = createRepo<AiContent>('aiContents')
export const readingPracticeRepo = createRepo<ReadingPracticeSession>('readingPracticeSessions')
export const listeningPracticeRepo = createRepo<ListeningPracticeSession>('listeningPracticeSessions')
export const readingPassageRepo = createRepo<Record<string, unknown>>('readingPassages')
export const passageEntryRepo = createRepo<Record<string, unknown>>('passages')
export const readingExerciseRepo = createRepo<Record<string, unknown>>('readingExercises')
export const listeningExerciseRepo = createRepo<Record<string, unknown>>('listeningExercises')
export const writingSessionRepo = createRepo<Record<string, unknown>>('writingSessions')
export const speakingSessionRepo = createRepo<Record<string, unknown>>('speakingSessions')
export const publicApiContentRepo = createRepo<PublicApiContent>('publicApiContent')
export const topicProgressRepo = createRepo<Record<string, unknown>>('topicsProgress')

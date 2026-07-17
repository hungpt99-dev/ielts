import { initDb, getDb } from '@ielts/storage'
import { APP_SCHEMA } from '@ielts/storage'
import {
  VocabularyRepository,
  MistakeRepository,
  StudyNoteRepository,
  ArtifactRepository,
  PassageEntryRepository,
} from '@ielts/storage'

let initialized = false

export function ensureStorageInitialized(): void {
  if (initialized) return
  try {
    initDb(APP_SCHEMA)
    initialized = true
  } catch {
    /* init may fail if already open; docs say getDb recovers */
  }
}

export const vocabularyRepo = new VocabularyRepository()
export const mistakeRepo = new MistakeRepository()
export const studyNoteRepo = new StudyNoteRepository()
export const artifactRepo = new ArtifactRepository()
export const passageEntryRepo = new PassageEntryRepository()

export { getDb }

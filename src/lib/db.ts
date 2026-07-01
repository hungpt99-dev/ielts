import { openDB, type IDBPDatabase } from 'idb'
import type {
  VocabularyEntry,
  VocabReviewEntry,
  TaskEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  GrammarNote,
  MistakeEntry,
  MockTestEntry,
  TopicProgress,
  PassageEntry,
  AppExportData,
} from '../models'

const DB_NAME = 'ielts-journey'
const DB_VERSION = 1

type AppDatabase = IDBPDatabase<{
  vocabulary: VocabularyEntry
  vocabularyReviews: VocabReviewEntry
  tasks: TaskEntry
  readingSessions: ReadingSession
  listeningSessions: ListeningSession
  writingSessions: WritingSession
  speakingSessions: SpeakingSession
  grammarNotes: GrammarNote
  mistakes: MistakeEntry
  mockTests: MockTestEntry
  topicsProgress: TopicProgress
  passages: PassageEntry
}>

let dbInstance: AppDatabase | null = null

async function getDb(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = (await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      if (_oldVersion < 1) {
        db.createObjectStore('vocabulary', { keyPath: 'id' })
        db.createObjectStore('vocabularyReviews', { keyPath: 'id' })
        db.createObjectStore('tasks', { keyPath: 'id' })
        db.createObjectStore('readingSessions', { keyPath: 'id' })
        db.createObjectStore('listeningSessions', { keyPath: 'id' })
        db.createObjectStore('writingSessions', { keyPath: 'id' })
        db.createObjectStore('speakingSessions', { keyPath: 'id' })
        db.createObjectStore('grammarNotes', { keyPath: 'id' })
        db.createObjectStore('mistakes', { keyPath: 'id' })
        db.createObjectStore('mockTests', { keyPath: 'id' })
        db.createObjectStore('topicsProgress', { keyPath: 'id' })
        db.createObjectStore('passages', { keyPath: 'id' })
      }
    },
  })) as unknown as AppDatabase
  return dbInstance
}

export async function getAll<T>(store: string): Promise<T[]> {
  const db = await getDb()
  return (await db.getAll(store)) as T[]
}

export async function getById<T>(store: string, id: string): Promise<T | undefined> {
  const db = await getDb()
  return (await db.get(store, id)) as T | undefined
}

export async function add<T>(store: string, item: T): Promise<void> {
  const db = await getDb()
  await db.add(store, item as never)
}

export async function put<T>(store: string, item: T): Promise<void> {
  const db = await getDb()
  await db.put(store, item as never)
}

export async function remove(store: string, id: string): Promise<void> {
  const db = await getDb()
  await db.delete(store, id)
}

export async function clearStore(store: string): Promise<void> {
  const db = await getDb()
  await db.clear(store)
}

export async function clearAll(): Promise<void> {
  const stores = [
    'vocabulary', 'vocabularyReviews', 'tasks', 'readingSessions',
    'listeningSessions', 'writingSessions', 'speakingSessions',
    'grammarNotes', 'mistakes', 'mockTests', 'topicsProgress', 'passages',
  ]
  for (const store of stores) {
    await clearStore(store)
  }
}

export async function importData(data: AppExportData): Promise<void> {
  await clearAll()
  const db = await getDb()
  const tx = db.transaction(Object.keys(data).filter(k => k !== 'version' && k !== 'exportedAt' && k !== 'settings'), 'readwrite')
  for (const [key, items] of Object.entries(data)) {
    if (key === 'version' || key === 'exportedAt' || key === 'settings') continue
    if (Array.isArray(items)) {
      for (const item of items) {
        tx.objectStore(key).put(item as never)
      }
    }
  }
  await tx.done
}

export async function exportData(): Promise<AppExportData> {
  const db = await getDb()
  const [
    vocabulary, vocabularyReviews, tasks, readingSessions,
    listeningSessions, writingSessions, speakingSessions,
    grammarNotes, mistakes, mockTests, topicsProgress, passages,
  ] = await Promise.all([
    db.getAll('vocabulary'),
    db.getAll('vocabularyReviews'),
    db.getAll('tasks'),
    db.getAll('readingSessions'),
    db.getAll('listeningSessions'),
    db.getAll('writingSessions'),
    db.getAll('speakingSessions'),
    db.getAll('grammarNotes'),
    db.getAll('mistakes'),
    db.getAll('mockTests'),
    db.getAll('topicsProgress'),
    db.getAll('passages'),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: JSON.parse(localStorage.getItem('ielts-settings') || '{}'),
    vocabulary: vocabulary as VocabularyEntry[],
    vocabularyReviews: vocabularyReviews as VocabReviewEntry[],
    tasks: tasks as TaskEntry[],
    readingSessions: readingSessions as ReadingSession[],
    listeningSessions: listeningSessions as ListeningSession[],
    writingSessions: writingSessions as WritingSession[],
    speakingSessions: speakingSessions as SpeakingSession[],
    grammarNotes: grammarNotes as GrammarNote[],
    mistakes: mistakes as MistakeEntry[],
    mockTests: mockTests as MockTestEntry[],
    topicsProgress: topicsProgress as TopicProgress[],
    passages: passages as PassageEntry[],
  }
}

export async function getTasksForDate(date: string): Promise<TaskEntry[]> {
  const all = await getAll<TaskEntry>('tasks')
  const target = date.slice(0, 10)
  return all.filter(t => t.date.slice(0, 10) === target)
}

export async function getSessionsBetween(start: string, end: string): Promise<{
  readingSessions: ReadingSession[]
  listeningSessions: ListeningSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
}> {
  const [reading, listening, writing, speaking] = await Promise.all([
    getAll<ReadingSession>('readingSessions'),
    getAll<ListeningSession>('listeningSessions'),
    getAll<WritingSession>('writingSessions'),
    getAll<SpeakingSession>('speakingSessions'),
  ])
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const filter = <T extends { createdAt: string }>(arr: T[]) =>
    arr.filter(item => {
      const t = new Date(item.createdAt).getTime()
      return t >= s && t <= e
    })
  return {
    readingSessions: filter(reading),
    listeningSessions: filter(listening),
    writingSessions: filter(writing),
    speakingSessions: filter(speaking),
  }
}

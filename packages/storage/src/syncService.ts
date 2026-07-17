import { z } from 'zod'


export const extensionExportSchema = z.object({
  meta: z.object({
    version: z.number(),
    exportedAt: z.string(),
    source: z.enum(['extension', 'website']).default('extension'),
    appVersion: z.string().default('0.1.0'),
  }),
  learningEntries: z.array(z.any()).default([]),
  vocabulary: z.array(z.any()).default([]),
  articles: z.array(z.any()).default([]),
  mistakes: z.array(z.any()).default([]),
  videos: z.array(z.any()).default([]),
})

export type ExtensionExportData = z.infer<typeof extensionExportSchema>

export type ImportMode = 'merge' | 'replace'

export interface SyncSummary {
  added: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export interface SyncStatus {
  lastSyncAt: string | null
  pendingItems: Array<{
    id: string
    type: string
    savedAt: string
  }>
  lastSyncResult: 'success' | 'partial' | 'failed' | null
}

export type StorageGet<T> = (key: string) => Promise<T | null>
export type StorageSet = (key: string, value: unknown) => Promise<void>

export type AllEntriesGetter = () => Promise<Record<string, unknown>[]>
export type EntrySaver = (entry: Record<string, unknown>) => Promise<void>
export type EntryDeleter = (id: string) => Promise<void>
export type StoreClearer = () => Promise<void>

export interface StorageHandlers {
  getAllLearningEntries: AllEntriesGetter
  saveLearningEntry: EntrySaver
  clearLearningEntries: StoreClearer
  getAllVocabulary: AllEntriesGetter
  saveVocabularyEntry: EntrySaver
  deleteVocabularyEntry: EntryDeleter
  getAllArticles: AllEntriesGetter
  saveArticleEntry: EntrySaver
  deleteArticleEntry: EntryDeleter
  getAllMistakes: AllEntriesGetter
  saveMistakeEntry: EntrySaver
  deleteMistakeEntry: EntryDeleter
  getAllVideos: AllEntriesGetter
  saveVideoEntry: EntrySaver
  deleteVideoEntry: EntryDeleter
}

export interface MappedStorageData {
  vocabulary: Record<string, unknown>[]
  vocabularyReviews: Record<string, unknown>[]
  tasks: Record<string, unknown>[]
  mistakes: Record<string, unknown>[]
  grammarNotes: Record<string, unknown>[]
  readingPassages: Record<string, unknown>[]
  listeningTranscripts: Record<string, unknown>[]
  usefulPhrases: Record<string, unknown>[]
  exampleSentences: Record<string, unknown>[]
  studyNotes: Record<string, unknown>[]
  speakingQuestions: Record<string, unknown>[]
  writingPrompts: Record<string, unknown>[]
  progressRecords: Record<string, unknown>[]
  [key: string]: Record<string, unknown>[]
}

export type DataMapper = (extensionData: ExtensionExportData) => MappedStorageData
export type DataUnmapper = (appData: MappedStorageData) => ExtensionExportData

const CURRENT_VERSION = 1
const SYNC_STATUS_KEY = 'extension.syncStatus'


export async function exportExtensionData(
  handlers: StorageHandlers,
): Promise<ExtensionExportData> {
  const [learningEntries, vocabulary, articles, mistakes, videos] = await Promise.all([
    handlers.getAllLearningEntries().catch(() => []),
    handlers.getAllVocabulary().catch(() => []),
    handlers.getAllArticles().catch(() => []),
    handlers.getAllMistakes().catch(() => []),
    handlers.getAllVideos().catch(() => []),
  ])

  return {
    meta: {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      source: 'extension',
      appVersion: '0.1.0',
    },
    learningEntries,
    vocabulary,
    articles,
    mistakes,
    videos,
  }
}


export async function importExtensionData(
  data: ExtensionExportData,
  handlers: StorageHandlers,
  mode: ImportMode = 'merge',
): Promise<SyncSummary> {
  const summary: SyncSummary = { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }

  if (mode === 'replace') {
    await clearAllStores(handlers)
  }

  await importRecords(data.learningEntries, handlers.saveLearningEntry, 'learningEntry', summary)
  await importRecords(data.vocabulary, handlers.saveVocabularyEntry, 'vocabulary', summary)
  await importRecords(data.articles, handlers.saveArticleEntry, 'article', summary)
  await importRecords(data.mistakes, handlers.saveMistakeEntry, 'mistake', summary)
  await importRecords(data.videos, handlers.saveVideoEntry, 'video', summary)

  return summary
}

async function clearAllStores(handlers: StorageHandlers): Promise<void> {
  await Promise.all([
    handlers.clearLearningEntries().catch(() => {}),
    handlers.getAllVocabulary().then(entries =>
      Promise.all(entries.map(e => handlers.deleteVocabularyEntry((e as Record<string, unknown>).id as string).catch(() => {}))),
    ).catch(() => {}),
    handlers.getAllArticles().then(entries =>
      Promise.all(entries.map(e => handlers.deleteArticleEntry((e as Record<string, unknown>).id as string).catch(() => {}))),
    ).catch(() => {}),
    handlers.getAllMistakes().then(entries =>
      Promise.all(entries.map(e => handlers.deleteMistakeEntry((e as Record<string, unknown>).id as string).catch(() => {}))),
    ).catch(() => {}),
    handlers.getAllVideos().then(entries =>
      Promise.all(entries.map(e => handlers.deleteVideoEntry((e as Record<string, unknown>).id as string).catch(() => {}))),
    ).catch(() => {}),
  ])
}

async function importRecords(
  records: Record<string, unknown>[],
  saveFn: EntrySaver,
  label: string,
  summary: SyncSummary,
): Promise<void> {
  for (const record of records) {
    try {
      await saveFn(record)
      summary.added++
    } catch (e) {
      console.error('packages/storage/src/syncService.ts error:', e);
      summary.failed++
      summary.errors.push(
        `${label}: ${e instanceof Error ? e.message : 'Unknown error'}`,
      )
    }
  }
}


export async function getSyncStatus(
  storageGet: StorageGet<SyncStatus>,
): Promise<SyncStatus> {
  const existing = await storageGet(SYNC_STATUS_KEY)
  return existing || {
    lastSyncAt: null,
    pendingItems: [],
    lastSyncResult: null,
  }
}

export async function saveSyncStatus(
  status: SyncStatus,
  storageSet: StorageSet,
): Promise<void> {
  await storageSet(SYNC_STATUS_KEY, status)
}

export async function markItemPending(
  id: string,
  type: string,
  storageGet: StorageGet<SyncStatus>,
  storageSet: StorageSet,
): Promise<void> {
  const status = await getSyncStatus(storageGet)
  status.pendingItems.push({ id, type, savedAt: new Date().toISOString() })
  await saveSyncStatus(status, storageSet)
}

export async function markItemsSynced(
  ids: string[],
  storageGet: StorageGet<SyncStatus>,
  storageSet: StorageSet,
): Promise<void> {
  const status = await getSyncStatus(storageGet)
  const idSet = new Set(ids)
  status.pendingItems = status.pendingItems.filter(item => !idSet.has(item.id))
  status.lastSyncAt = new Date().toISOString()
  status.lastSyncResult = 'success'
  await saveSyncStatus(status, storageSet)
}

export async function markSyncFailed(
  storageGet: StorageGet<SyncStatus>,
  storageSet: StorageSet,
): Promise<void> {
  const status = await getSyncStatus(storageGet)
  status.lastSyncAt = new Date().toISOString()
  status.lastSyncResult = 'failed'
  await saveSyncStatus(status, storageSet)
}


export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generateExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `ielts-journey-backup-${date}.json`
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string))
      } catch (error) {
        console.error('packages/storage/src/syncService.ts error:', error);
        reject(new Error('Invalid JSON file: not valid JSON'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function validateExtensionExportData(data: unknown): data is ExtensionExportData {
  const result = extensionExportSchema.safeParse(data)
  return result.success
}

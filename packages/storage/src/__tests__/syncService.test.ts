import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SyncStatus, StorageHandlers, StorageGet, StorageSet } from '../syncService'
import {
  exportExtensionData,
  importExtensionData,
  getSyncStatus,
  saveSyncStatus,
  markItemPending,
  markItemsSynced,
  markSyncFailed,
  generateExportFilename,
  validateExtensionExportData,
} from '../syncService'

function createMockHandlers(): StorageHandlers & { store: Record<string, Record<string, unknown>[]> } {
  const store: Record<string, Record<string, unknown>[]> = {
    learningEntries: [],
    vocabulary: [],
    articles: [],
    mistakes: [],
    videos: [],
  }
  return {
    getAllLearningEntries: vi.fn(async () => store.learningEntries) as () => Promise<Record<string, unknown>[]>,
    saveLearningEntry: vi.fn(async (e: Record<string, unknown>) => { store.learningEntries.push(e) }) as (entry: Record<string, unknown>) => Promise<void>,
    clearLearningEntries: vi.fn(async () => { store.learningEntries = [] }) as () => Promise<void>,
    getAllVocabulary: vi.fn(async () => store.vocabulary) as () => Promise<Record<string, unknown>[]>,
    saveVocabularyEntry: vi.fn(async (e: Record<string, unknown>) => { store.vocabulary.push(e) }) as (entry: Record<string, unknown>) => Promise<void>,
    deleteVocabularyEntry: vi.fn(async (id: string) => { store.vocabulary = store.vocabulary.filter(e => e.id !== id) }) as (id: string) => Promise<void>,
    getAllArticles: vi.fn(async () => store.articles) as () => Promise<Record<string, unknown>[]>,
    saveArticleEntry: vi.fn(async (e: Record<string, unknown>) => { store.articles.push(e) }) as (entry: Record<string, unknown>) => Promise<void>,
    deleteArticleEntry: vi.fn(async (id: string) => { store.articles = store.articles.filter(e => e.id !== id) }) as (id: string) => Promise<void>,
    getAllMistakes: vi.fn(async () => store.mistakes) as () => Promise<Record<string, unknown>[]>,
    saveMistakeEntry: vi.fn(async (e: Record<string, unknown>) => { store.mistakes.push(e) }) as (entry: Record<string, unknown>) => Promise<void>,
    deleteMistakeEntry: vi.fn(async (id: string) => { store.mistakes = store.mistakes.filter(e => e.id !== id) }) as (id: string) => Promise<void>,
    getAllVideos: vi.fn(async () => store.videos) as () => Promise<Record<string, unknown>[]>,
    saveVideoEntry: vi.fn(async (e: Record<string, unknown>) => { store.videos.push(e) }) as (entry: Record<string, unknown>) => Promise<void>,
    deleteVideoEntry: vi.fn(async (id: string) => { store.videos = store.videos.filter(e => e.id !== id) }) as (id: string) => Promise<void>,
    store,
  }
}

function createMockStorage() {
  const store = new Map<string, unknown>()
  return {
    get: vi.fn(async (key: string) => (store.get(key) ?? null)) as StorageGet<SyncStatus>,
    set: vi.fn(async (key: string, value: unknown) => { store.set(key, value) }) as StorageSet,
    store,
  }
}

describe('syncService', () => {
  describe('exportExtensionData', () => {
    it('exports all stores as ExtensionExportData', async () => {
      const handlers = createMockHandlers()
      handlers.store.vocabulary = [{ id: 'v1', word: 'test' }]
      handlers.store.mistakes = [{ id: 'm1', mistake: 'error' }]
      const data = await exportExtensionData(handlers)
      expect(data.meta.version).toBe(1)
      expect(data.meta.source).toBe('extension')
      expect(data.vocabulary).toHaveLength(1)
      expect(data.mistakes).toHaveLength(1)
      expect(data.learningEntries).toEqual([])
      expect(data.articles).toEqual([])
      expect(data.videos).toEqual([])
    })

    it('handles getAll failures gracefully', async () => {
      const handlers = createMockHandlers()
      handlers.getAllVocabulary = vi.fn().mockRejectedValue(new Error('fail')) as () => Promise<Record<string, unknown>[]>
      const data = await exportExtensionData(handlers)
      expect(data.vocabulary).toEqual([])
    })
  })

  describe('importExtensionData', () => {
    it('imports records in merge mode', async () => {
      const handlers = createMockHandlers()
      const data = {
        meta: { version: 1, exportedAt: new Date().toISOString(), source: 'extension' as const, appVersion: '0.1.0' },
        learningEntries: [],
        vocabulary: [{ id: 'v1', word: 'apple' }],
        articles: [],
        mistakes: [{ id: 'm1', mistake: 'error' }],
        videos: [],
      }
      const summary = await importExtensionData(data, handlers, 'merge')
      expect(summary.added).toBe(2)
      expect(summary.failed).toBe(0)
    })

    it('replaces data in replace mode', async () => {
      const handlers = createMockHandlers()
      handlers.store.vocabulary = [{ id: 'old', word: 'old-word' }]
      const data = {
        meta: { version: 1, exportedAt: new Date().toISOString(), source: 'extension' as const, appVersion: '0.1.0' },
        learningEntries: [],
        vocabulary: [{ id: 'v1', word: 'new-word' }],
        articles: [],
        mistakes: [],
        videos: [],
      }
      const summary = await importExtensionData(data, handlers, 'replace')
      expect(summary.added).toBe(1)
    })
  })

  describe('sync status', () => {
    let storage: ReturnType<typeof createMockStorage>

    beforeEach(() => {
      storage = createMockStorage()
    })

    describe('getSyncStatus', () => {
      it('returns default status when none saved', async () => {
        const status = await getSyncStatus(storage.get)
        expect(status.lastSyncAt).toBeNull()
        expect(status.pendingItems).toEqual([])
        expect(status.lastSyncResult).toBeNull()
      })

      it('returns saved status', async () => {
        storage.store.set('extension.syncStatus', { lastSyncAt: '2024-01-01', pendingItems: [], lastSyncResult: 'success' })
        const status = await getSyncStatus(storage.get)
        expect(status.lastSyncAt).toBe('2024-01-01')
        expect(status.lastSyncResult).toBe('success')
      })
    })

    describe('saveSyncStatus', () => {
      it('persists sync status', async () => {
        await saveSyncStatus({ lastSyncAt: '2024-06-01', pendingItems: [], lastSyncResult: 'success' }, storage.set)
        expect(storage.store.get('extension.syncStatus')).toBeDefined()
      })
    })

    describe('markItemPending', () => {
      it('adds item to pending list', async () => {
        await markItemPending('v1', 'vocabulary', storage.get, storage.set)
        const status = await getSyncStatus(storage.get)
        expect(status.pendingItems).toHaveLength(1)
        expect(status.pendingItems[0].id).toBe('v1')
      })
    })

    describe('markItemsSynced', () => {
      it('removes synced items and marks success', async () => {
        storage.store.set('extension.syncStatus', {
          lastSyncAt: null,
          pendingItems: [{ id: 'v1', type: 'vocabulary', savedAt: '2024-01-01' }],
          lastSyncResult: null,
        })
        await markItemsSynced(['v1'], storage.get, storage.set)
        const status = await getSyncStatus(storage.get)
        expect(status.pendingItems).toHaveLength(0)
        expect(status.lastSyncAt).toBeTruthy()
        expect(status.lastSyncResult).toBe('success')
      })
    })

    describe('markSyncFailed', () => {
      it('sets lastSyncResult to failed', async () => {
        await markSyncFailed(storage.get, storage.set)
        const status = await getSyncStatus(storage.get)
        expect(status.lastSyncResult).toBe('failed')
        expect(status.lastSyncAt).toBeTruthy()
      })
    })
  })

  describe('generateExportFilename', () => {
    it('includes current date in filename', () => {
      const name = generateExportFilename()
      const date = new Date().toISOString().slice(0, 10)
      expect(name).toContain(date)
      expect(name).toContain('.json')
    })
  })

  describe('validateExtensionExportData', () => {
    it('validates correct export data', () => {
      const data = {
        meta: { version: 1, exportedAt: new Date().toISOString(), source: 'extension', appVersion: '0.1.0' },
        learningEntries: [],
        vocabulary: [],
        articles: [],
        mistakes: [],
        videos: [],
      }
      expect(validateExtensionExportData(data)).toBe(true)
    })

    it('rejects missing required fields', () => {
      expect(validateExtensionExportData({})).toBe(false)
      expect(validateExtensionExportData(null)).toBe(false)
    })
  })
})

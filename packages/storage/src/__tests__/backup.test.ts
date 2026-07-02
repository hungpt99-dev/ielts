import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { VocabularyRepository } from '../repositories'
import type { VocabularyEntry } from '../repositories/VocabularyRepository'
import {
  exportAllData,
  validateBackupData,
  validateBackupDataDetailed,
  importBackup,
  clearAllTables,
  mergeBackupWithDedup,
  isDuplicate,
  collectExistingIds,
  generateBackupFilename,
  DuplicateStrategy,
} from '../backup'
import type { AppBackupData } from '../backup/types'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  const tables = await db.tables
  for (const table of tables) {
    await table.clear()
  }
}

function makeVocab(overrides: Partial<VocabularyEntry> = {}): Omit<VocabularyEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    word: 'test',
    meaning: 'meaning',
    meaningVi: '',
    pronunciation: '/test/',
    partOfSpeech: 'noun',
    topic: 'general',
    exampleSentence: '',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium',
    status: 'new',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<VocabularyEntry, 'id'>
}

describe('Backup Service', () => {
  let vocabRepo: VocabularyRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    vocabRepo = new VocabularyRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('generateBackupFilename', () => {
    it('generates filename with current date', () => {
      const filename = generateBackupFilename()
      const date = new Date().toISOString().slice(0, 10)
      expect(filename).toBe(`ielts-journey-backup-${date}.json`)
    })
  })

  describe('exportAllData', () => {
    it('exports all tables including settings', async () => {
      await vocabRepo.create(makeVocab({ word: 'apple' }))
      const data = await exportAllData({ theme: 'dark' })
      expect(data.meta.version).toBe(1)
      expect(data.meta.source).toBe('web-app')
      expect(data.settings.theme).toBe('dark')
      expect(data.vocabulary).toHaveLength(1)
      expect(data.vocabulary[0].word).toBe('apple')
    })

    it('exports settings as empty object when not provided', async () => {
      const data = await exportAllData()
      expect(data.settings).toEqual({})
    })
  })

  describe('validateBackupData', () => {
    it('returns true for valid backup data', () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {},
      } as unknown as AppBackupData
      expect(validateBackupData(data)).toBe(true)
    })

    it('returns false for null', () => {
      expect(validateBackupData(null)).toBe(false)
    })

    it('returns false for non-object', () => {
      expect(validateBackupData('string')).toBe(false)
    })

    it('returns false for missing version', () => {
      expect(validateBackupData({ exportedAt: new Date().toISOString() } as unknown as AppBackupData)).toBe(false)
    })
  })

  describe('validateBackupDataDetailed', () => {
    it('returns valid for correct backup data', () => {
      const result = validateBackupDataDetailed({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: {},
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns errors for invalid data', () => {
      const result = validateBackupDataDetailed(null)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('importBackup', () => {
    it('imports data in replace mode', async () => {
      await vocabRepo.create(makeVocab({ word: 'old' }))
      const data = await exportAllData()
      data.vocabulary = [{
        ...makeVocab({ word: 'new-word' }),
        id: 'new-id',
      }] as unknown as AppBackupData['vocabulary']
      const summary = await importBackup(data as AppBackupData, 'replace')
      expect(summary.added).toBeGreaterThanOrEqual(1)
      const all = await vocabRepo.findAll()
      expect(all.some(v => v.word === 'old')).toBe(false)
    })

    it('imports data in merge mode', async () => {
      await vocabRepo.create(makeVocab({ word: 'existing', id: 'existing-id' } as unknown as Partial<VocabularyEntry>))
      const data = await exportAllData()
      data.vocabulary = [
        { ...makeVocab({ word: 'existing-updated' }), id: 'existing-id' } as unknown as AppBackupData['vocabulary'][0],
        { ...makeVocab({ word: 'new' }), id: 'new-id' } as unknown as AppBackupData['vocabulary'][0],
      ]
      const summary = await importBackup(data as AppBackupData, 'merge')
      expect(summary.added + summary.updated).toBe(2)
    })

    it('handles invalid data gracefully', async () => {
      const data = await exportAllData()
      data.vocabulary = [{ invalid: true } as never]
      const summary = await importBackup(data as unknown as AppBackupData)
      expect(summary.failed).toBeGreaterThanOrEqual(0)
      expect(summary.errors).toBeDefined()
    })
  })

  describe('mergeBackupWithDedup', () => {
    it('skips duplicates with Skip strategy', async () => {
      const entry = await vocabRepo.create(makeVocab({ word: 'original' }))
      const data = await exportAllData()
      data.vocabulary = [
        { ...makeVocab({ word: 'original' }), id: entry.id } as unknown as AppBackupData['vocabulary'][0],
        { ...makeVocab({ word: 'new-word' }), id: 'new-id' } as unknown as AppBackupData['vocabulary'][0],
      ]
      const summary = await mergeBackupWithDedup(data as AppBackupData, DuplicateStrategy.Skip)
      expect(summary.added).toBe(1)
      expect(summary.skipped).toBe(1)
    })

    it('overwrites duplicates with Overwrite strategy', async () => {
      const entry = await vocabRepo.create(makeVocab({ word: 'original' }))
      const data = await exportAllData()
      data.vocabulary = [
        { ...makeVocab({ word: 'overwritten' }), id: entry.id } as unknown as AppBackupData['vocabulary'][0],
      ]
      const summary = await mergeBackupWithDedup(data as AppBackupData, DuplicateStrategy.Overwrite)
      expect(summary.updated).toBe(1)
    })
  })

  describe('isDuplicate and collectExistingIds', () => {
    it('detects duplicates in id set', () => {
      const ids = collectExistingIds([{ id: 'a' }, { id: 'b' }] as Record<string, unknown>[])
      expect(ids.has('a')).toBe(true)
      expect(ids.has('b')).toBe(true)
      expect(isDuplicate('a', ids)).toBe(true)
      expect(isDuplicate('c', ids)).toBe(false)
    })

    it('handles items without ids', () => {
      const ids = collectExistingIds([{ name: 'no-id' }] as Record<string, unknown>[])
      expect(ids.size).toBe(0)
    })
  })
})

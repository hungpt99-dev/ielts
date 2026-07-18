import { describe, it, expect, beforeEach } from 'vitest'
import {
  APP_SCHEMA,
  CURRENT_DB_VERSION,
  STORED_VERSION_KEY,
  getSchemaForVersion,
  getStoreNamesForVersion,
  getAppliedVersion,
  setAppliedVersion,
  clearAppliedVersion,
} from '../migrations'

describe('Migrations', () => {
  beforeEach(() => {
    clearAppliedVersion()
  })

  describe('APP_SCHEMA', () => {
    it('has correct current version', () => {
      expect(CURRENT_DB_VERSION).toBe(9)
    })

    it('has 9 versions defined', () => {
      expect(APP_SCHEMA.versions).toHaveLength(9)
    })

    it('has versions in ascending order', () => {
      for (let i = 1; i < APP_SCHEMA.versions.length; i++) {
        expect(APP_SCHEMA.versions[i].number).toBeGreaterThan(APP_SCHEMA.versions[i - 1].number)
      }
    })

    it('all versions have store definitions', () => {
      for (const v of APP_SCHEMA.versions) {
        expect(Object.keys(v.stores).length).toBeGreaterThan(0)
      }
    })

    it('version 4 includes all store names', () => {
      const stores = getStoreNamesForVersion(4)
      expect(stores).toContain('contentMeta')
      expect(stores).toContain('userContentEdits')
    })

    it('version 5 includes exercise store names', () => {
      const stores = getStoreNamesForVersion(5)
      expect(stores).toContain('speakingExercises')
      expect(stores).toContain('writingExercises')
      expect(stores).toContain('readingExercises')
      expect(stores).toContain('listeningExercises')
    })
  })

  describe('getSchemaForVersion', () => {
    it('returns schema for existing version', () => {
      const schema = getSchemaForVersion(1)
      expect(schema).toBeDefined()
      expect(schema!.number).toBe(1)
      expect(schema!.stores).toBeDefined()
    })

    it('returns undefined for non-existent version', () => {
      const schema = getSchemaForVersion(99)
      expect(schema).toBeUndefined()
    })
  })

  describe('getStoreNamesForVersion', () => {
    it('returns store names for version 1', () => {
      const stores = getStoreNamesForVersion(1)
      expect(stores).toContain('vocabulary')
      expect(stores).toContain('tasks')
      expect(stores).toContain('mistakes')
      expect(stores).toHaveLength(14)
    })

    it('returns store names for version 2', () => {
      const stores = getStoreNamesForVersion(2)
      expect(stores).toContain('readingPassages')
      expect(stores).toContain('ieltsTopics')
      expect(stores).toHaveLength(25)
    })

    it('returns store names for version 4', () => {
      const stores = getStoreNamesForVersion(4)
      expect(stores).toContain('contentMeta')
      expect(stores).toContain('userContentEdits')
      expect(stores).toHaveLength(28)
    })

    it('returns store names for version 5', () => {
      const stores = getStoreNamesForVersion(5)
      expect(stores).toContain('speakingExercises')
      expect(stores).toContain('writingExercises')
      expect(stores).toContain('readingExercises')
      expect(stores).toContain('listeningExercises')
      expect(stores).toHaveLength(32)
    })

    it('returns empty for non-existent version', () => {
      const stores = getStoreNamesForVersion(0)
      expect(stores).toEqual([])
    })
  })

  describe('version tracking', () => {
    it('returns 0 when no version is stored', async () => {
      const version = await getAppliedVersion()
      expect(version).toBe(0)
    })

    it('returns the stored version', async () => {
      await setAppliedVersion(3)
      const version = await getAppliedVersion()
      expect(version).toBe(3)
    })

    it('returns 0 after clear', async () => {
      await setAppliedVersion(4)
      clearAppliedVersion()
      const version = await getAppliedVersion()
      expect(version).toBe(0)
    })

    it('handles invalid stored value gracefully', async () => {
      localStorage.setItem(STORED_VERSION_KEY, 'invalid')
      const version = await getAppliedVersion()
      expect(version).toBe(0)
    })
  })
})

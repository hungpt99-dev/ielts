import { describe, it, expect } from 'vitest'
import {
  APP_SCHEMA,
  CURRENT_DB_VERSION,
  getSchemaForVersion,
  getStoreNamesForVersion,
} from '../migrations'

describe('Migrations', () => {
  describe('APP_SCHEMA', () => {
    it('has correct current version', () => {
      expect(CURRENT_DB_VERSION).toBe(4)
    })

    it('has 4 versions defined', () => {
      expect(APP_SCHEMA.versions).toHaveLength(4)
    })

    it('has versions in ascending order', () => {
      for (let i = 1; i < APP_SCHEMA.versions.length; i++) {
        expect(APP_SCHEMA.versions[i].number).toBeGreaterThan(APP_SCHEMA.versions[i - 1].number)
      }
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

    it('returns empty for non-existent version', () => {
      const stores = getStoreNamesForVersion(0)
      expect(stores).toEqual([])
    })
  })
})

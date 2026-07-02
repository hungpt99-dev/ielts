import { describe, it, expect } from 'vitest'
import {
  StorageError,
  ValidationError,
  MigrationError,
  BackupError,
  EntityNotFoundError,
  DuplicateEntityError,
  DatabaseClosedError,
} from '../errors'

describe('Storage Errors', () => {
  describe('StorageError', () => {
    it('creates error with message', () => {
      const error = new StorageError('Something went wrong')
      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('StorageError')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(StorageError)
    })

    it('stores cause when provided', () => {
      const cause = new Error('underlying')
      const error = new StorageError('Wrapped', cause)
      expect(error.cause).toBe(cause)
    })

    it('works without cause', () => {
      const error = new StorageError('No cause')
      expect(error.cause).toBeUndefined()
    })
  })

  describe('ValidationError', () => {
    it('extends StorageError with correct name', () => {
      const error = new ValidationError('Invalid field')
      expect(error.message).toBe('Invalid field')
      expect(error.name).toBe('ValidationError')
      expect(error).toBeInstanceOf(StorageError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('MigrationError', () => {
    it('creates migration error with message and cause', () => {
      const cause = new Error('Schema mismatch')
      const error = new MigrationError('Migration failed', cause)
      expect(error.message).toBe('Migration failed')
      expect(error.name).toBe('MigrationError')
      expect(error.cause).toBe(cause)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('BackupError', () => {
    it('creates backup error with message', () => {
      const error = new BackupError('Invalid backup file')
      expect(error.message).toBe('Invalid backup file')
      expect(error.name).toBe('BackupError')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('EntityNotFoundError', () => {
    it('includes entity name and id in message', () => {
      const error = new EntityNotFoundError('vocabulary', 'abc-123')
      expect(error.message).toBe('vocabulary with id "abc-123" not found')
      expect(error.name).toBe('EntityNotFoundError')
      expect(error).toBeInstanceOf(StorageError)
    })
  })

  describe('DuplicateEntityError', () => {
    it('includes entity name and id in message', () => {
      const error = new DuplicateEntityError('tasks', 'dup-id')
      expect(error.message).toBe('tasks with id "dup-id" already exists')
      expect(error.name).toBe('DuplicateEntityError')
      expect(error).toBeInstanceOf(StorageError)
    })
  })

  describe('DatabaseClosedError', () => {
    it('has fixed message about closed database', () => {
      const error = new DatabaseClosedError()
      expect(error.message).toContain('Database is closed')
      expect(error.name).toBe('DatabaseClosedError')
      expect(error).toBeInstanceOf(StorageError)
    })
  })
})

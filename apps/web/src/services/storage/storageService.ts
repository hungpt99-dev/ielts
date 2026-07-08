import {
  initDb,
  getDb,
  isDbOpen,
  APP_SCHEMA,
  applyMigrations,
} from '@ielts/storage'
import type { AppBackupData, ImportSummary } from '@ielts/storage'

import DatabaseService from './Database'
import LocalTutorStorage from './LocalTutorStorage'
import { loadAppSettings, saveAppSettings } from './SettingsStorage'
import type { AppSettings } from '../../models'
import { DEFAULT_SETTINGS } from '../../models'

export class StorageOperationError extends Error {
  constructor(message: string, public source: 'indexeddb' | 'localstorage' | 'tutor', public cause?: unknown) {
    super(message)
    this.name = 'StorageOperationError'
  }
}

export class StorageMigrationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'StorageMigrationError'
  }
}

const LOCAL_STORAGE_SCHEMA_KEY = 'ielts-storage-schema-version'
const LOCAL_STORAGE_SCHEMA_VERSION = 1

interface LocalStorageSchemaEntry {
  key: string
  version: number
}

const LOCAL_STORAGE_REGISTRY: LocalStorageSchemaEntry[] = [
  { key: 'ielts-settings', version: 1 },
  { key: 'ielts-tutor-preferences', version: 1 },
  { key: 'ielts-tutor-memory-legacy', version: 1 },
  { key: 'ielts-theme-mode', version: 1 },
  { key: 'ielts-accent-color', version: 1 },
  { key: 'ielts-dark-mode', version: 1 },
  { key: 'ielts-notification-prefs', version: 1 },
]

const STORAGE_RETRY_COUNT = 1

function safeLocalGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.warn(`[StorageService] Failed to read "${key}" from localStorage:`, e)
  }
  return defaultValue
}

function safeLocalSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error(`[StorageService] localStorage quota exceeded for key "${key}"`)
    } else {
      console.error(`[StorageService] Failed to write "${key}" to localStorage:`, e)
    }
    throw new StorageOperationError(
      `Failed to write to localStorage: ${e instanceof Error ? e.message : 'Unknown error'}`,
      'localstorage',
      e,
    )
  }
}

function safeLocalRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(`[StorageService] Failed to remove "${key}" from localStorage:`, e)
  }
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = STORAGE_RETRY_COUNT): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (error instanceof StorageOperationError) throw error
      if (attempt < maxRetries) {
        if (!isDbOpen()) {
          initDb(APP_SCHEMA)
        }
        continue
      }
      throw new StorageOperationError(
        `${label} failed after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof StorageOperationError ? error.source : 'indexeddb',
        error,
      )
    }
  }
  throw new StorageOperationError(`${label} unreachable`, 'indexeddb')
}

export const StorageService = {
  async initialize(): Promise<void> {
    try {
      initDb(APP_SCHEMA)
      const db = getDb()
      await db.open()
      await applyMigrations()
    } catch (error) {
      throw new StorageOperationError(
        `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'indexeddb',
        error,
      )
    }
  },

  isInitialized(): boolean {
    return isDbOpen()
  },

  async getLocalStorageSchemaVersion(): Promise<number> {
    return safeLocalGet(LOCAL_STORAGE_SCHEMA_KEY, 0)
  },

  async setLocalStorageSchemaVersion(version: number): Promise<void> {
    safeLocalSet(LOCAL_STORAGE_SCHEMA_KEY, version)
  },

  async runLocalStorageMigrations(): Promise<void> {
    const currentVersion = await this.getLocalStorageSchemaVersion()
    if (currentVersion >= LOCAL_STORAGE_SCHEMA_VERSION) return

    for (const entry of LOCAL_STORAGE_REGISTRY) {
      if (currentVersion === 0 && entry.version >= 1) {
        const existing = safeLocalGet(entry.key, null)
        if (existing === null) {
          if (entry.key === 'ielts-settings') {
            safeLocalSet(entry.key, DEFAULT_SETTINGS)
          }
        }
      }
    }

    await this.setLocalStorageSchemaVersion(LOCAL_STORAGE_SCHEMA_VERSION)
  },

  getLocalItem<T>(key: string, defaultValue: T): T {
    return safeLocalGet(key, defaultValue)
  },

  setLocalItem<T>(key: string, value: T): void {
    safeLocalSet(key, value)
  },

  removeLocalItem(key: string): void {
    safeLocalRemove(key)
  },

  checkStorageQuota(): { used: number; remaining: number | null; percentUsed: number } {
    let used = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    }
    const remaining = (() => {
      try {
        const testKey = '__quota_test__'
        const testData = 'a'.repeat(1024 * 1024)
        localStorage.setItem(testKey, testData)
        localStorage.removeItem(testKey)
        return null
      } catch {
        const approxUsed = used
        return Math.max(0, 5 * 1024 * 1024 - approxUsed)
      }
    })()
    return {
      used,
      remaining,
      percentUsed: remaining !== null ? Math.round((used / (used + remaining)) * 100) : 0,
    }
  },

  isQuotaSafe(): boolean {
    try {
      const { remaining, percentUsed } = this.checkStorageQuota()
      if (remaining !== null && remaining < 10 * 1024) return false
      if (percentUsed > 95) return false
      return true
    } catch {
      return true
    }
  },

  async ensureStorageAvailable(): Promise<boolean> {
    try {
      const db = getDb()
      if (!db.isOpen()) {
        await db.open()
      }
      return true
    } catch {
      try {
        initDb(APP_SCHEMA)
        const db = getDb()
        await db.open()
        return true
      } catch {
        return false
      }
    }
  },

  async getAppSettings(): Promise<AppSettings> {
    return loadAppSettings()
  },

  async saveAppSettings(settings: AppSettings): Promise<void> {
    saveAppSettings(settings)
  },

  async patchAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings()
    const merged = { ...current, ...patch }
    await this.saveAppSettings(merged)
    return merged
  },

  async getStats(): Promise<{
    tables: Record<string, number>
    tutor: Record<string, number>
    vocabularyCount: number
    taskCount: number
    mistakeCount: number
    totalEntries: number
  }> {
    const tables = await DatabaseService.getStats()
    const tutor = await LocalTutorStorage.getStats().catch(() => ({}))
    const vocabularyCount = (tables.vocabulary as number) || 0
    const taskCount = (tables.tasks as number) || 0
    const mistakeCount = (tables.mistakes as number) || 0
    const totalEntries = Object.values(tables).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0)
    return { tables, tutor, vocabularyCount, taskCount, mistakeCount, totalEntries }
  },

  async exportAllData(): Promise<{
    main: AppBackupData
    tutor: Record<string, unknown>
    settings: AppSettings
    exportedAt: string
  }> {
    return withRetry(async () => {
      const settings = await this.getAppSettings()
      const main = await DatabaseService.exportAll()
      const tutor = await LocalTutorStorage.exportAll().catch(() => ({}))
      return {
        main,
        tutor: tutor as Record<string, unknown>,
        settings,
        exportedAt: new Date().toISOString(),
      }
    }, 'exportAllData')
  },

  async importAllData(
    data: { main: AppBackupData; settings: AppSettings },
    mode: 'merge' | 'replace' = 'replace',
  ): Promise<ImportSummary> {
    return withRetry(async () => {
      if (mode === 'replace') {
        await DatabaseService.importAll(data.main, 'replace')
      } else {
        await DatabaseService.importAll(data.main, 'merge')
      }
      if (data.settings) {
        await this.saveAppSettings(data.settings)
      }
      return { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }
    }, 'importAllData')
  },

  async clearAllData(): Promise<void> {
    return withRetry(async () => {
      await DatabaseService.clearAll()
      await LocalTutorStorage.clearAll().catch(() => {})
      this.removeLocalItem('ielts-settings')
    }, 'clearAllData')
  },

  async resetAllData(): Promise<void> {
    return withRetry(async () => {
      await DatabaseService.resetAll()
      await LocalTutorStorage.resetAll().catch(() => {})
      this.removeLocalItem(LOCAL_STORAGE_SCHEMA_KEY)
    }, 'resetAllData')
  },

  async getDbStats(): Promise<Record<string, number>> {
    return DatabaseService.getStats()
  },

  async ensureDbOpen(): Promise<void> {
    if (!isDbOpen()) {
      initDb(APP_SCHEMA)
    }
  },

  async runMigrations(): Promise<void> {
    await this.runLocalStorageMigrations()
    if (isDbOpen()) {
      await applyMigrations()
    }
  },
}

export default StorageService

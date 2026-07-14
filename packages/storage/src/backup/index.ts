import { z } from 'zod'
import { getDb, TABLE_NAMES, safeDb } from '../db'
import { BackupError, ValidationError } from '../errors'
import type { AppBackupData, ImportMode, ImportSummary } from './types'
import { appExportDataSchema, tableSchemas } from '../schema'

export type { AppBackupData, ImportMode, ImportSummary } from './types'

const CURRENT_BACKUP_VERSION = 1

export function generateBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `ielts-journey-backup-${date}.json`
}

export async function exportAllData(settings?: Record<string, unknown>): Promise<AppBackupData> {
  return safeDb(async () => {
    const db = getDb()
    const entries = await Promise.all(
      TABLE_NAMES.map(async (name) => ({
        name,
        items: await db.table(name).toArray(),
      })),
    )
    const data: Record<string, unknown[]> = {}
    for (const { name, items } of entries) {
      data[name] = items
    }
    return {
      meta: {
        version: CURRENT_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        source: 'web-app',
        appVersion: '0.1.0',
      },
      settings: settings || {},
      ...data,
    } as unknown as AppBackupData
  })
}

export function downloadBackup(data: AppBackupData, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || generateBackupFilename()
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function validateBackupData(data: unknown): data is AppBackupData {
  const result = appExportDataSchema.safeParse(data)
  return result.success
}

export function validateBackupDataDetailed(data: unknown): { valid: boolean; errors: string[] } {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Backup data must be an object'] }
  }
  const result = appExportDataSchema.safeParse(data)
  if (result.success) {
    return { valid: true, errors: [] }
  }
  const flattened = result.error.flatten()
  const errors = Object.entries(flattened.fieldErrors).flatMap(([field, msgs]) =>
    (msgs || []).map(m => `${field}: ${m}`),
  )
  return { valid: false, errors }
}

export async function readBackupFile(file: File): Promise<AppBackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!validateBackupData(data)) {
          reject(new BackupError('Invalid backup file format'))
          return
        }
        resolve(data)
      } catch (error) {
        console.error('packages/storage/src/backup/index.ts error:', error);
        reject(new BackupError('Failed to parse backup file: invalid JSON'))
      }
    }
    reader.onerror = () => reject(new BackupError('Failed to read file'))
    reader.readAsText(file)
  })
}

export async function importBackup(
  data: AppBackupData,
  mode: ImportMode = 'replace',
): Promise<ImportSummary> {
  return safeDb(async () => {
    const summary: ImportSummary = { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }
    const db = getDb()
    if (mode === 'replace') {
      await clearAllTables()
    }
    await db.transaction('rw', TABLE_NAMES, async () => {
      for (const tableName of TABLE_NAMES) {
        const schema = tableSchemas[tableName]
        const items = (data as unknown as Record<string, unknown[]>)[tableName]
        if (!items || !Array.isArray(items) || items.length === 0) continue
        for (const item of items) {
          try {
            const validated = schema ? schema.parse(item) : item
            const itemRecord = validated as Record<string, unknown>
            const id = itemRecord.id as string | undefined
            if (mode === 'merge' && id) {
              const existing = await db.table(tableName).get(id)
              if (existing) {
                await db.table(tableName).put(validated)
                summary.updated++
              } else {
                await db.table(tableName).add(validated)
                summary.added++
              }
            } else if (mode === 'merge' && !id) {
              await db.table(tableName).add(validated)
              summary.added++
            } else {
              await db.table(tableName).add(validated)
              summary.added++
            }
          } catch (e) {
            console.error('packages/storage/src/backup/index.ts error:', e);
            summary.failed++
            if (e instanceof ValidationError) {
              summary.errors.push(`${tableName}: ${e.message}`)
            } else if (e instanceof z.ZodError) {
              summary.errors.push(`${tableName}: Schema validation failed`)
            } else {
              summary.errors.push(
                `${tableName}: ${e instanceof Error ? e.message : 'Unknown error'}`,
              )
            }
          }
        }
      }
    })
    return summary
  })
}

export async function clearAllTables(): Promise<void> {
  return safeDb(async () => {
    const db = getDb()
    await db.transaction('rw', TABLE_NAMES, async () => {
      for (const name of TABLE_NAMES) {
        await db.table(name).clear()
      }
    })
  })
}

export function isDuplicate(id: string, existingIds: Set<string>): boolean {
  return existingIds.has(id)
}

export function collectExistingIds(items: Record<string, unknown>[]): Set<string> {
  const ids = new Set<string>()
  for (const item of items) {
    const id = item.id as string | undefined
    if (id) ids.add(id)
  }
  return ids
}

export enum DuplicateStrategy {
  Skip = 'skip',
  Overwrite = 'overwrite',
  KeepNewest = 'keep-newest',
}

export async function mergeBackupWithDedup(
  data: AppBackupData,
  strategy: DuplicateStrategy = DuplicateStrategy.Skip,
): Promise<ImportSummary> {
  return safeDb(async () => {
    const summary: ImportSummary = { added: 0, updated: 0, skipped: 0, failed: 0, errors: [] }
    const db = getDb()
    await db.transaction('rw', TABLE_NAMES, async () => {
      for (const tableName of TABLE_NAMES) {
        const items = (data as unknown as Record<string, unknown[]>)[tableName]
        if (!items || !Array.isArray(items) || items.length === 0) continue
        for (const item of items) {
          try {
            const itemRecord = item as Record<string, unknown>
            const id = itemRecord.id as string | undefined
            if (id) {
              const existing = await db.table(tableName).get(id)
              if (existing) {
                if (strategy === DuplicateStrategy.Skip) {
                  summary.skipped++
                  continue
                }
                if (strategy === DuplicateStrategy.KeepNewest) {
                  const existingUpdated = (existing as Record<string, unknown>).updatedAt as string | undefined
                  const incomingUpdated = itemRecord.updatedAt as string | undefined
                  if (existingUpdated && incomingUpdated && existingUpdated >= incomingUpdated) {
                    summary.skipped++
                    continue
                  }
                }
                await db.table(tableName).put(item)
                summary.updated++
              } else {
                await db.table(tableName).add(item)
                summary.added++
              }
            } else {
              await db.table(tableName).add(item)
              summary.added++
            }
          } catch (e) {
            console.error('packages/storage/src/backup/index.ts error:', e);
            summary.failed++
            summary.errors.push(
              `${tableName}: ${e instanceof Error ? e.message : 'Unknown error'}`,
            )
          }
        }
      }
    })
    return summary
  })
}
